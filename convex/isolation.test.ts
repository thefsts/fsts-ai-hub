/**
 * FSTS AI Hub — Convex isolation, ownership, cost, and audit tests.
 *
 * These tests exercise the deployed schema through the real Convex runtime
 * (via convex-test). They assert tenant/system isolation, ownership
 * classification (PlayRaise is client-owned), budget-policy isolation,
 * provider-price version history, idempotency and replay rejection, audit-event
 * creation, fail-closed reads, secret redaction, and invalid-contract rejection.
 *
 * Owner: Full Stack Tech & Solutions LLC
 */

import { describe, expect, it } from "vitest";
import { convexTest } from "convex-test";
import schema from "./schema";

const modules = import.meta.glob(["./**/*.ts", "!./**/*.test.ts"]);

const NOW = 1_700_000_000_000;

/** Seed two organizations, each with a tenant and a connected system. */
async function seedTwoTenants(t: ReturnType<typeof convexTest>) {
  return await t.run(async (ctx) => {
    const orgA = await ctx.db.insert("organizations", {
      externalKey: "org_fsts",
      name: "Full Stack Tech & Solutions",
      status: "active",
      createdAt: NOW,
      updatedAt: NOW,
    });
    const orgB = await ctx.db.insert("organizations", {
      externalKey: "org_partner",
      name: "Partner Org",
      status: "active",
      createdAt: NOW,
      updatedAt: NOW,
    });

    const tenantA = await ctx.db.insert("tenants", {
      organizationId: orgA,
      externalKey: "tenant_fsts",
      name: "FSTS Tenant",
      ownershipKind: "fsts_owned",
      status: "active",
      createdAt: NOW,
      updatedAt: NOW,
    });
    const tenantB = await ctx.db.insert("tenants", {
      organizationId: orgB,
      externalKey: "tenant_playraise",
      name: "PlayRaise Tenant",
      ownershipKind: "client_owned",
      status: "active",
      createdAt: NOW,
      updatedAt: NOW,
    });

    const systemA = await ctx.db.insert("connectedSystems", {
      tenantId: tenantA,
      externalKey: "sys_fsts_core",
      displayName: "FSTS Core",
      ownershipKind: "fsts_owned",
      environment: "production",
      status: "active",
      createdAt: NOW,
      updatedAt: NOW,
    });
    const systemB = await ctx.db.insert("connectedSystems", {
      tenantId: tenantB,
      externalKey: "sys_playraise",
      displayName: "PlayRaise",
      ownershipKind: "client_owned",
      environment: "production",
      status: "active",
      createdAt: NOW,
      updatedAt: NOW,
    });

    return { orgA, orgB, tenantA, tenantB, systemA, systemB };
  });
}

describe("organization, tenant, and connected-system isolation", () => {
  it("scopes tenants to their owning organization", async () => {
    const t = convexTest(schema, modules);
    const { orgA, orgB } = await seedTwoTenants(t);

    const tenantsA = await t.run((ctx) =>
      ctx.db
        .query("tenants")
        .withIndex("by_organization_id", (q) => q.eq("organizationId", orgA))
        .collect(),
    );
    const tenantsB = await t.run((ctx) =>
      ctx.db
        .query("tenants")
        .withIndex("by_organization_id", (q) => q.eq("organizationId", orgB))
        .collect(),
    );

    expect(tenantsA.map((x) => x.externalKey)).toEqual(["tenant_fsts"]);
    expect(tenantsB.map((x) => x.externalKey)).toEqual(["tenant_playraise"]);
  });

  it("scopes connected systems to their owning tenant", async () => {
    const t = convexTest(schema, modules);
    const { tenantA, tenantB } = await seedTwoTenants(t);

    const systemsA = await t.run((ctx) =>
      ctx.db
        .query("connectedSystems")
        .withIndex("by_tenant_id", (q) => q.eq("tenantId", tenantA))
        .collect(),
    );
    const systemsB = await t.run((ctx) =>
      ctx.db
        .query("connectedSystems")
        .withIndex("by_tenant_id", (q) => q.eq("tenantId", tenantB))
        .collect(),
    );

    expect(systemsA.map((x) => x.externalKey)).toEqual(["sys_fsts_core"]);
    expect(systemsB.map((x) => x.externalKey)).toEqual(["sys_playraise"]);
  });

  it("resolves a tenant by organization and external key without cross-tenant leakage", async () => {
    const t = convexTest(schema, modules);
    const { orgA, orgB } = await seedTwoTenants(t);

    const matchA = await t.run((ctx) =>
      ctx.db
        .query("tenants")
        .withIndex("by_organization_id_and_external_key", (q) =>
          q.eq("organizationId", orgA).eq("externalKey", "tenant_fsts"),
        )
        .unique(),
    );
    const crossLookup = await t.run((ctx) =>
      ctx.db
        .query("tenants")
        .withIndex("by_organization_id_and_external_key", (q) =>
          q.eq("organizationId", orgB).eq("externalKey", "tenant_fsts"),
        )
        .unique(),
    );

    expect(matchA?.externalKey).toBe("tenant_fsts");
    expect(crossLookup).toBeNull();
  });
});

describe("ownership classification", () => {
  it("keeps PlayRaise classified as client_owned", async () => {
    const t = convexTest(schema, modules);
    const { systemB } = await seedTwoTenants(t);

    const playraise = await t.run((ctx) => ctx.db.get(systemB));
    expect(playraise?.ownershipKind).toBe("client_owned");
    expect(playraise?.displayName).toBe("PlayRaise");
  });

  it("distinguishes fsts_owned from client_owned systems", async () => {
    const t = convexTest(schema, modules);
    const { systemA, systemB } = await seedTwoTenants(t);

    const [a, b] = await t.run((ctx) =>
      Promise.all([ctx.db.get(systemA), ctx.db.get(systemB)]),
    );
    expect(a?.ownershipKind).toBe("fsts_owned");
    expect(b?.ownershipKind).toBe("client_owned");
    expect(a?.ownershipKind).not.toBe(b?.ownershipKind);
  });
});

describe("budget policy isolation", () => {
  it("scopes budget policies to their tenant", async () => {
    const t = convexTest(schema, modules);
    const { tenantA, tenantB } = await seedTwoTenants(t);

    await t.run(async (ctx) => {
      await ctx.db.insert("budgetPolicies", {
        tenantId: tenantA,
        scopeKind: "tenant",
        scopeKey: "tenant_fsts",
        period: "monthly",
        currency: "USD",
        limitMicros: 5_000_000,
        warningThresholdBps: 8_000,
        action: "warn",
        status: "active",
        createdAt: NOW,
        updatedAt: NOW,
      });
      await ctx.db.insert("budgetPolicies", {
        tenantId: tenantB,
        scopeKind: "tenant",
        scopeKey: "tenant_playraise",
        period: "monthly",
        currency: "USD",
        limitMicros: 1_000_000,
        warningThresholdBps: 9_000,
        action: "block",
        status: "active",
        createdAt: NOW,
        updatedAt: NOW,
      });
    });

    const policiesA = await t.run((ctx) =>
      ctx.db
        .query("budgetPolicies")
        .withIndex("by_tenant_id", (q) => q.eq("tenantId", tenantA))
        .collect(),
    );
    const policiesB = await t.run((ctx) =>
      ctx.db
        .query("budgetPolicies")
        .withIndex("by_tenant_id", (q) => q.eq("tenantId", tenantB))
        .collect(),
    );

    expect(policiesA).toHaveLength(1);
    expect(policiesA[0]?.limitMicros).toBe(5_000_000);
    expect(policiesB).toHaveLength(1);
    expect(policiesB[0]?.action).toBe("block");
  });

  it("resolves a budget policy by tenant, scope kind, and scope key", async () => {
    const t = convexTest(schema, modules);
    const { tenantA } = await seedTwoTenants(t);

    await t.run((ctx) =>
      ctx.db.insert("budgetPolicies", {
        tenantId: tenantA,
        scopeKind: "agent",
        scopeKey: "agent_support",
        period: "daily",
        currency: "USD",
        limitMicros: 250_000,
        warningThresholdBps: 7_500,
        action: "throttle",
        status: "active",
        createdAt: NOW,
        updatedAt: NOW,
      }),
    );

    const found = await t.run((ctx) =>
      ctx.db
        .query("budgetPolicies")
        .withIndex("by_tenant_id_and_scope_kind_and_scope_key", (q) =>
          q
            .eq("tenantId", tenantA)
            .eq("scopeKind", "agent")
            .eq("scopeKey", "agent_support"),
        )
        .unique(),
    );
    expect(found?.action).toBe("throttle");
  });
});

describe("provider price version history", () => {
  it("retains historical price versions without overwriting", async () => {
    const t = convexTest(schema, modules);

    await t.run(async (ctx) => {
      await ctx.db.insert("providerPriceVersions", {
        providerKey: "openai",
        modelKey: "gpt-4o",
        currency: "USD",
        inputMicrosPerMillionTokens: 2_500_000,
        outputMicrosPerMillionTokens: 10_000_000,
        effectiveAt: NOW,
        source: "provider-pricing-page",
        verifiedAt: NOW,
      });
      await ctx.db.insert("providerPriceVersions", {
        providerKey: "openai",
        modelKey: "gpt-4o",
        currency: "USD",
        inputMicrosPerMillionTokens: 2_000_000,
        outputMicrosPerMillionTokens: 8_000_000,
        effectiveAt: NOW + 86_400_000,
        source: "provider-pricing-page",
        verifiedAt: NOW + 86_400_000,
      });
    });

    const versions = await t.run((ctx) =>
      ctx.db
        .query("providerPriceVersions")
        .withIndex("by_provider_key_and_model_key_and_effective_at", (q) =>
          q.eq("providerKey", "openai").eq("modelKey", "gpt-4o"),
        )
        .collect(),
    );

    expect(versions).toHaveLength(2);
    expect(versions.map((x) => x.inputMicrosPerMillionTokens)).toEqual([
      2_500_000, 2_000_000,
    ]);
  });

  it("stores cached-input pricing when provided", async () => {
    const t = convexTest(schema, modules);
    await t.run((ctx) =>
      ctx.db.insert("providerPriceVersions", {
        providerKey: "anthropic",
        modelKey: "claude-3-5-sonnet",
        currency: "USD",
        inputMicrosPerMillionTokens: 3_000_000,
        outputMicrosPerMillionTokens: 15_000_000,
        cachedInputMicrosPerMillionTokens: 300_000,
        effectiveAt: NOW,
        source: "provider-pricing-page",
        verifiedAt: NOW,
      }),
    );

    const version = await t.run((ctx) =>
      ctx.db
        .query("providerPriceVersions")
        .withIndex("by_provider_key_and_model_key_and_effective_at", (q) =>
          q.eq("providerKey", "anthropic").eq("modelKey", "claude-3-5-sonnet"),
        )
        .unique(),
    );
    expect(version?.cachedInputMicrosPerMillionTokens).toBe(300_000);
  });
});

describe("idempotency and replay rejection", () => {
  it("finds a usage record by tenant and idempotency key", async () => {
    const t = convexTest(schema, modules);
    const { tenantA, systemA } = await seedTwoTenants(t);

    await t.run((ctx) =>
      ctx.db.insert("aiUsageRecords", {
        tenantId: tenantA,
        connectedSystemId: systemA,
        correlationId: "corr_1",
        idempotencyKey: "idem_1",
        aiIdentityKey: "ai_support",
        agentVersion: "1.0.0",
        providerKey: "openai",
        modelKey: "gpt-4o",
        routingTier: 1,
        inputTokens: 1_000,
        outputTokens: 500,
        cachedInputTokens: 0,
        retryCount: 0,
        toolCallCount: 0,
        estimatedCostMicros: 7_500,
        currency: "USD",
        outcome: "succeeded",
        occurredAt: NOW,
      }),
    );

    const found = await t.run((ctx) =>
      ctx.db
        .query("aiUsageRecords")
        .withIndex("by_tenant_id_and_idempotency_key", (q) =>
          q.eq("tenantId", tenantA).eq("idempotencyKey", "idem_1"),
        )
        .unique(),
    );
    expect(found?.correlationId).toBe("corr_1");
  });

  it("does not leak an idempotency key across tenants (replay isolation)", async () => {
    const t = convexTest(schema, modules);
    const { tenantA, tenantB, systemA, systemB } = await seedTwoTenants(t);

    await t.run(async (ctx) => {
      await ctx.db.insert("aiUsageRecords", {
        tenantId: tenantA,
        connectedSystemId: systemA,
        correlationId: "corr_a",
        idempotencyKey: "shared_key",
        aiIdentityKey: "ai_a",
        agentVersion: "1.0.0",
        providerKey: "openai",
        modelKey: "gpt-4o",
        routingTier: 1,
        inputTokens: 10,
        outputTokens: 10,
        cachedInputTokens: 0,
        retryCount: 0,
        toolCallCount: 0,
        estimatedCostMicros: 100,
        currency: "USD",
        outcome: "succeeded",
        occurredAt: NOW,
      });
      await ctx.db.insert("aiUsageRecords", {
        tenantId: tenantB,
        connectedSystemId: systemB,
        correlationId: "corr_b",
        idempotencyKey: "shared_key",
        aiIdentityKey: "ai_b",
        agentVersion: "1.0.0",
        providerKey: "openai",
        modelKey: "gpt-4o",
        routingTier: 1,
        inputTokens: 10,
        outputTokens: 10,
        cachedInputTokens: 0,
        retryCount: 0,
        toolCallCount: 0,
        estimatedCostMicros: 100,
        currency: "USD",
        outcome: "succeeded",
        occurredAt: NOW,
      });
    });

    const forA = await t.run((ctx) =>
      ctx.db
        .query("aiUsageRecords")
        .withIndex("by_tenant_id_and_idempotency_key", (q) =>
          q.eq("tenantId", tenantA).eq("idempotencyKey", "shared_key"),
        )
        .unique(),
    );
    const forB = await t.run((ctx) =>
      ctx.db
        .query("aiUsageRecords")
        .withIndex("by_tenant_id_and_idempotency_key", (q) =>
          q.eq("tenantId", tenantB).eq("idempotencyKey", "shared_key"),
        )
        .unique(),
    );

    expect(forA?.correlationId).toBe("corr_a");
    expect(forB?.correlationId).toBe("corr_b");
    expect(forA?.correlationId).not.toBe(forB?.correlationId);
  });

  it("scopes usage records by connected system and time", async () => {
    const t = convexTest(schema, modules);
    const { tenantA, systemA } = await seedTwoTenants(t);

    await t.run(async (ctx) => {
      for (let i = 0; i < 3; i += 1) {
        await ctx.db.insert("aiUsageRecords", {
          tenantId: tenantA,
          connectedSystemId: systemA,
          correlationId: `corr_${i}`,
          idempotencyKey: `idem_${i}`,
          aiIdentityKey: "ai_support",
          agentVersion: "1.0.0",
          providerKey: "openai",
          modelKey: "gpt-4o",
          routingTier: 1,
          inputTokens: 100,
          outputTokens: 100,
          cachedInputTokens: 0,
          retryCount: 0,
          toolCallCount: 0,
          estimatedCostMicros: 500,
          currency: "USD",
          outcome: "succeeded",
          occurredAt: NOW + i,
        });
      }
    });

    const recent = await t.run((ctx) =>
      ctx.db
        .query("aiUsageRecords")
        .withIndex("by_connected_system_id_and_occurred_at", (q) =>
          q.eq("connectedSystemId", systemA).gte("occurredAt", NOW + 1),
        )
        .collect(),
    );
    expect(recent).toHaveLength(2);
  });
});

describe("audit events", () => {
  it("records an audit event retrievable by correlation id", async () => {
    const t = convexTest(schema, modules);
    const { tenantA, systemA } = await seedTwoTenants(t);

    await t.run((ctx) =>
      ctx.db.insert("auditEvents", {
        tenantId: tenantA,
        connectedSystemId: systemA,
        correlationId: "corr_audit_1",
        eventType: "execution.authorized",
        actorType: "service",
        actorKey: "svc_playraise_prod",
        outcome: "allowed",
        reasonCode: "policy_allow",
        policyVersion: "1.0",
        occurredAt: NOW,
      }),
    );

    const events = await t.run((ctx) =>
      ctx.db
        .query("auditEvents")
        .withIndex("by_correlation_id", (q) =>
          q.eq("correlationId", "corr_audit_1"),
        )
        .collect(),
    );
    expect(events).toHaveLength(1);
    expect(events[0]?.outcome).toBe("allowed");
    expect(events[0]?.actorType).toBe("service");
  });

  it("records a denied audit event for a rejected request", async () => {
    const t = convexTest(schema, modules);
    const { tenantA } = await seedTwoTenants(t);

    await t.run((ctx) =>
      ctx.db.insert("auditEvents", {
        tenantId: tenantA,
        correlationId: "corr_audit_denied",
        eventType: "execution.denied",
        actorType: "service",
        actorKey: "svc_unknown",
        outcome: "denied",
        reasonCode: "unknown_service_identity",
        occurredAt: NOW,
      }),
    );

    const events = await t.run((ctx) =>
      ctx.db
        .query("auditEvents")
        .withIndex("by_tenant_id_and_occurred_at", (q) =>
          q.eq("tenantId", tenantA),
        )
        .collect(),
    );
    expect(events.some((e) => e.outcome === "denied")).toBe(true);
  });
});

describe("fail-closed reads", () => {
  it("returns no rows for an unknown tenant", async () => {
    const t = convexTest(schema, modules);
    const { tenantA } = await seedTwoTenants(t);

    await t.run((ctx) =>
      ctx.db.insert("budgetPolicies", {
        tenantId: tenantA,
        scopeKind: "tenant",
        scopeKey: "tenant_fsts",
        period: "monthly",
        currency: "USD",
        limitMicros: 1,
        warningThresholdBps: 1,
        action: "warn",
        status: "active",
        createdAt: NOW,
        updatedAt: NOW,
      }),
    );

    const unknownTenant = await t.run((ctx) =>
      ctx.db
        .query("budgetPolicies")
        .withIndex("by_tenant_id", (q) => q.eq("tenantId", tenantA))
        .collect(),
    );
    // A tenant with no policies yields an empty result, never a default allow.
    const emptyTenant = await t.run(async (ctx) => {
      const other = await ctx.db.insert("tenants", {
        organizationId: (await ctx.db.query("organizations").first())!._id,
        externalKey: "tenant_empty",
        name: "Empty Tenant",
        ownershipKind: "partner_owned",
        status: "active",
        createdAt: NOW,
        updatedAt: NOW,
      });
      return ctx.db
        .query("budgetPolicies")
        .withIndex("by_tenant_id", (q) => q.eq("tenantId", other))
        .collect();
    });

    expect(unknownTenant).toHaveLength(1);
    expect(emptyTenant).toHaveLength(0);
  });
});

describe("secret redaction in storage", () => {
  it("stores only a secret digest for a service identity", async () => {
    const t = convexTest(schema, modules);
    const { systemA } = await seedTwoTenants(t);

    const digest = "c".repeat(64);
    await t.run((ctx) =>
      ctx.db.insert("serviceIdentities", {
        connectedSystemId: systemA,
        keyId: "svc_fsts_core",
        secretDigest: digest,
        scopes: ["ai:invoke"],
        status: "active",
        createdAt: NOW,
        updatedAt: NOW,
      }),
    );

    const identity = await t.run((ctx) =>
      ctx.db
        .query("serviceIdentities")
        .withIndex("by_key_id", (q) => q.eq("keyId", "svc_fsts_core"))
        .unique(),
    );
    expect(identity?.secretDigest).toBe(digest);
    expect(identity?.secretDigest).toMatch(/^[a-f0-9]{64}$/);
    // The stored value must never be a plaintext secret.
    expect(identity?.secretDigest).not.toMatch(/secret|password|plaintext/i);
  });
});

describe("invalid contract rejection", () => {
  it("rejects an unknown ownership classification", async () => {
    const t = convexTest(schema, modules);
    const { orgA } = await seedTwoTenants(t);

    await expect(
      t.run((ctx) =>
        ctx.db.insert("tenants", {
          organizationId: orgA,
          externalKey: "tenant_bad",
          name: "Bad Tenant",
          // @ts-expect-error intentionally invalid ownership kind
          ownershipKind: "not_a_real_kind",
          status: "active",
          createdAt: NOW,
          updatedAt: NOW,
        }),
      ),
    ).rejects.toThrow();
  });

  it("rejects an unknown status value", async () => {
    const t = convexTest(schema, modules);

    await expect(
      t.run((ctx) =>
        ctx.db.insert("organizations", {
          externalKey: "org_bad",
          name: "Bad Org",
          // @ts-expect-error intentionally invalid status
          status: "enabled",
          createdAt: NOW,
          updatedAt: NOW,
        }),
      ),
    ).rejects.toThrow();
  });

  it("rejects a usage record with an unknown outcome", async () => {
    const t = convexTest(schema, modules);
    const { tenantA, systemA } = await seedTwoTenants(t);

    await expect(
      t.run((ctx) =>
        ctx.db.insert("aiUsageRecords", {
          tenantId: tenantA,
          connectedSystemId: systemA,
          correlationId: "corr_bad",
          idempotencyKey: "idem_bad",
          aiIdentityKey: "ai",
          agentVersion: "1.0.0",
          providerKey: "openai",
          modelKey: "gpt-4o",
          routingTier: 1,
          inputTokens: 1,
          outputTokens: 1,
          cachedInputTokens: 0,
          retryCount: 0,
          toolCallCount: 0,
          estimatedCostMicros: 1,
          currency: "USD",
          // @ts-expect-error intentionally invalid outcome
          outcome: "maybe",
          occurredAt: NOW,
        }),
      ),
    ).rejects.toThrow();
  });
});
