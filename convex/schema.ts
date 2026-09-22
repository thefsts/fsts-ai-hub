import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const status = v.union(
  v.literal("active"),
  v.literal("suspended"),
  v.literal("disabled"),
);
const environment = v.union(
  v.literal("development"),
  v.literal("staging"),
  v.literal("production"),
);
const ownershipKind = v.union(
  v.literal("fsts_owned"),
  v.literal("client_owned"),
  v.literal("partner_owned"),
);
const budgetAction = v.union(
  v.literal("warn"),
  v.literal("throttle"),
  v.literal("require_approval"),
  v.literal("block"),
);

export default defineSchema({
  organizations: defineTable({
    externalKey: v.string(),
    name: v.string(),
    status,
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_external_key", ["externalKey"]),

  tenants: defineTable({
    organizationId: v.id("organizations"),
    externalKey: v.string(),
    name: v.string(),
    ownershipKind,
    status,
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_organization_id", ["organizationId"])
    .index("by_organization_id_and_external_key", [
      "organizationId",
      "externalKey",
    ]),

  connectedSystems: defineTable({
    tenantId: v.id("tenants"),
    externalKey: v.string(),
    displayName: v.string(),
    ownershipKind,
    environment,
    status,
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant_id", ["tenantId"])
    .index("by_tenant_id_and_external_key", ["tenantId", "externalKey"]),

  serviceIdentities: defineTable({
    connectedSystemId: v.id("connectedSystems"),
    keyId: v.string(),
    secretDigest: v.string(),
    scopes: v.array(v.string()),
    status,
    expiresAt: v.optional(v.number()),
    lastUsedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_key_id", ["keyId"])
    .index("by_connected_system_id", ["connectedSystemId"]),

  providerPriceVersions: defineTable({
    providerKey: v.string(),
    modelKey: v.string(),
    currency: v.string(),
    inputMicrosPerMillionTokens: v.number(),
    outputMicrosPerMillionTokens: v.number(),
    cachedInputMicrosPerMillionTokens: v.optional(v.number()),
    effectiveAt: v.number(),
    expiresAt: v.optional(v.number()),
    source: v.string(),
    verifiedAt: v.number(),
  }).index("by_provider_key_and_model_key_and_effective_at", [
    "providerKey",
    "modelKey",
    "effectiveAt",
  ]),

  budgetPolicies: defineTable({
    tenantId: v.id("tenants"),
    connectedSystemId: v.optional(v.id("connectedSystems")),
    scopeKind: v.union(
      v.literal("tenant"),
      v.literal("system"),
      v.literal("agent"),
      v.literal("workflow"),
    ),
    scopeKey: v.string(),
    period: v.union(
      v.literal("request"),
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("monthly"),
    ),
    currency: v.string(),
    limitMicros: v.number(),
    warningThresholdBps: v.number(),
    action: budgetAction,
    status,
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant_id", ["tenantId"])
    .index("by_tenant_id_and_scope_kind_and_scope_key", [
      "tenantId",
      "scopeKind",
      "scopeKey",
    ]),

  aiUsageRecords: defineTable({
    tenantId: v.id("tenants"),
    connectedSystemId: v.id("connectedSystems"),
    correlationId: v.string(),
    idempotencyKey: v.string(),
    aiIdentityKey: v.string(),
    agentVersion: v.string(),
    workflowKey: v.optional(v.string()),
    providerKey: v.string(),
    modelKey: v.string(),
    routingTier: v.number(),
    inputTokens: v.number(),
    outputTokens: v.number(),
    cachedInputTokens: v.number(),
    retryCount: v.number(),
    toolCallCount: v.number(),
    estimatedCostMicros: v.number(),
    actualCostMicros: v.optional(v.number()),
    currency: v.string(),
    outcome: v.union(
      v.literal("succeeded"),
      v.literal("failed"),
      v.literal("blocked"),
      v.literal("cancelled"),
    ),
    occurredAt: v.number(),
  })
    .index("by_tenant_id_and_occurred_at", ["tenantId", "occurredAt"])
    .index("by_connected_system_id_and_occurred_at", [
      "connectedSystemId",
      "occurredAt",
    ])
    .index("by_tenant_id_and_idempotency_key", ["tenantId", "idempotencyKey"])
    .index("by_correlation_id", ["correlationId"]),

  auditEvents: defineTable({
    tenantId: v.optional(v.id("tenants")),
    connectedSystemId: v.optional(v.id("connectedSystems")),
    correlationId: v.string(),
    eventType: v.string(),
    actorType: v.union(
      v.literal("service"),
      v.literal("human"),
      v.literal("system"),
    ),
    actorKey: v.string(),
    outcome: v.union(
      v.literal("allowed"),
      v.literal("denied"),
      v.literal("failed"),
    ),
    reasonCode: v.string(),
    policyVersion: v.optional(v.string()),
    metadata: v.optional(v.record(v.string(), v.string())),
    occurredAt: v.number(),
  })
    .index("by_correlation_id", ["correlationId"])
    .index("by_tenant_id_and_occurred_at", ["tenantId", "occurredAt"]),
});
