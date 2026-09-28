/**
 * FSTS AI Hub — Cost Optimization Engine tests.
 *
 * These tests prove the mandatory cost-optimization guarantees, including that
 * security and compliance always override cheaper routing.
 *
 * Owner: Full Stack Tech & Solutions LLC
 */

import { describe, expect, it } from "vitest";
import type {
  AiCostRecord,
  BudgetPolicy,
  ProviderPriceVersion,
} from "@fsts/contracts";
import {
  IdempotencyGuard,
  areOwnershipCostsSeparated,
  attributeCosts,
  buildCacheKey,
  canModifyBudget,
  canProceed,
  computeCost,
  decideCache,
  detectBillingMismatch,
  detectProviderBypass,
  enforceAgentLoopGuard,
  enforceRetryGuard,
  evaluateBudget,
  routeRequest,
  selectPriceVersion,
  verifyCacheKeyScope,
  type CachePolicy,
  type RoutingCandidate,
} from "./index.js";

const NOW = "2026-01-01T00:00:00.000Z";

function candidate(overrides: Partial<RoutingCandidate>): RoutingCandidate {
  return {
    providerId: "p1",
    modelId: "m1",
    tier: "tier_3_standard",
    approved: true,
    compliantForClassification: true,
    residencySatisfied: true,
    capabilityMatch: true,
    meetsQualityFloor: true,
    healthy: true,
    meetsLatency: true,
    estimatedCost: 1,
    suspended: false,
    ...overrides,
  };
}

const baseRequest = {
  requiredCapability: "text",
  dataClassification: "internal" as const,
  requiredRegion: "us" as const,
  deterministicPossible: false,
  cacheAvailable: false,
  budgetRequiresCheaper: false,
};

describe("routing — security and compliance override cost", () => {
  it("never selects a cheaper unauthorized model", () => {
    const result = routeRequest(baseRequest, [
      candidate({
        providerId: "cheap",
        modelId: "cheap",
        approved: false,
        estimatedCost: 0.01,
      }),
      candidate({ providerId: "ok", modelId: "ok", estimatedCost: 5 }),
    ]);
    expect(result.selectedProviderId).toBe("ok");
    expect(
      result.candidates.find((c) => c.providerId === "cheap")?.eligible,
    ).toBe(false);
  });

  it("never selects a cheaper noncompliant model", () => {
    const result = routeRequest(baseRequest, [
      candidate({
        providerId: "cheap",
        compliantForClassification: false,
        estimatedCost: 0.01,
      }),
      candidate({ providerId: "ok", estimatedCost: 5 }),
    ]);
    expect(result.selectedProviderId).toBe("ok");
  });

  it("never selects a cheaper model that violates residency", () => {
    const result = routeRequest(baseRequest, [
      candidate({
        providerId: "cheap",
        residencySatisfied: false,
        estimatedCost: 0.01,
      }),
      candidate({ providerId: "ok", estimatedCost: 5 }),
    ]);
    expect(result.selectedProviderId).toBe("ok");
  });

  it("never selects a cheaper model lacking capability", () => {
    const result = routeRequest(baseRequest, [
      candidate({
        providerId: "cheap",
        capabilityMatch: false,
        estimatedCost: 0.01,
      }),
      candidate({ providerId: "ok", estimatedCost: 5 }),
    ]);
    expect(result.selectedProviderId).toBe("ok");
  });

  it("never selects a cheaper model below the quality floor", () => {
    const result = routeRequest(baseRequest, [
      candidate({
        providerId: "cheap",
        meetsQualityFloor: false,
        estimatedCost: 0.01,
      }),
      candidate({ providerId: "ok", estimatedCost: 5 }),
    ]);
    expect(result.selectedProviderId).toBe("ok");
  });

  it("never selects a cheaper suspended provider", () => {
    const result = routeRequest(baseRequest, [
      candidate({ providerId: "cheap", suspended: true, estimatedCost: 0.01 }),
      candidate({ providerId: "ok", estimatedCost: 5 }),
    ]);
    expect(result.selectedProviderId).toBe("ok");
  });

  it("blocks the request when no compliant provider is available", () => {
    const result = routeRequest(baseRequest, [
      candidate({ providerId: "a", approved: false }),
      candidate({ providerId: "b", compliantForClassification: false }),
    ]);
    expect(result.blocked).toBe(true);
    expect(result.reason).toBe("no_compliant_provider");
  });

  it("prefers deterministic processing when safely possible", () => {
    const result = routeRequest(
      { ...baseRequest, deterministicPossible: true },
      [candidate({})],
    );
    expect(result.reason).toBe("deterministic_no_llm");
    expect(result.selectedTier).toBe("tier_1_deterministic");
  });

  it("uses a validated cache when policy permits", () => {
    const result = routeRequest({ ...baseRequest, cacheAvailable: true }, [
      candidate({}),
    ]);
    expect(result.reason).toBe("cache_hit");
  });

  it("selects the cheapest eligible candidate when all else is equal", () => {
    const result = routeRequest(baseRequest, [
      candidate({ providerId: "expensive", estimatedCost: 10 }),
      candidate({ providerId: "cheap", estimatedCost: 1 }),
    ]);
    expect(result.selectedProviderId).toBe("cheap");
    expect(result.reason).toBe("cost_optimized");
  });

  it("does not escalate to the most expensive model by default", () => {
    const result = routeRequest(baseRequest, [
      candidate({
        providerId: "t5",
        tier: "tier_5_specialized",
        estimatedCost: 100,
      }),
      candidate({ providerId: "t2", tier: "tier_2_small", estimatedCost: 0.5 }),
    ]);
    expect(result.selectedProviderId).toBe("t2");
  });
});

describe("budget enforcement", () => {
  const policy: BudgetPolicy = {
    contractVersion: "v1",
    id: "bp1",
    scope: "tenant",
    scopeKey: "t1",
    organizationId: "o1",
    period: "monthly",
    currency: "USD",
    softWarningThreshold: 80,
    hardLimit: 100,
    onSoftLimit: "warn",
    onHardLimit: "block",
    enabled: true,
    createdAt: NOW,
    updatedAt: NOW,
  };

  it("warns at the soft limit", () => {
    const evalResult = evaluateBudget(policy, {
      budgetPolicyId: "bp1",
      scope: "tenant",
      scopeKey: "t1",
      period: "monthly",
      limit: 100,
      spent: 85,
      daysElapsed: 15,
      daysInPeriod: 30,
    });
    expect(evalResult.softLimitReached).toBe(true);
    expect(evalResult.hardLimitReached).toBe(false);
    expect(evalResult.action).toBe("warn");
  });

  it("blocks at the hard limit", () => {
    const evalResult = evaluateBudget(policy, {
      budgetPolicyId: "bp1",
      scope: "tenant",
      scopeKey: "t1",
      period: "monthly",
      limit: 100,
      spent: 100,
      daysElapsed: 20,
      daysInPeriod: 30,
    });
    expect(evalResult.hardLimitReached).toBe(true);
    expect(evalResult.action).toBe("block");
  });

  it("blocks a request that exceeds the remaining budget", () => {
    const evalResult = evaluateBudget(policy, {
      budgetPolicyId: "bp1",
      scope: "tenant",
      scopeKey: "t1",
      period: "monthly",
      limit: 100,
      spent: 95,
      daysElapsed: 20,
      daysInPeriod: 30,
    });
    const decision = canProceed(evalResult, 10);
    expect(decision.allowed).toBe(false);
  });

  it("allows a request within budget", () => {
    const evalResult = evaluateBudget(policy, {
      budgetPolicyId: "bp1",
      scope: "tenant",
      scopeKey: "t1",
      period: "monthly",
      limit: 100,
      spent: 10,
      daysElapsed: 5,
      daysInPeriod: 30,
    });
    expect(canProceed(evalResult, 5).allowed).toBe(true);
  });

  it("prevents an AI from modifying its own budget", () => {
    expect(canModifyBudget("ai_1", "ai_1", true)).toBe(false);
    expect(canModifyBudget("ai_1", "user_1", true)).toBe(false);
    expect(canModifyBudget("user_1", "user_1", false)).toBe(true);
  });
});

describe("tenant-safe caching", () => {
  const policy: CachePolicy = {
    tenantId: "t1",
    cachingEnabled: true,
    cacheableClassifications: ["public", "internal"],
    allowPersonalized: false,
    allowVolatile: false,
    allowHighRisk: false,
  };

  const request = {
    tenantId: "t1",
    connectedSystemId: "s1",
    environmentId: "e1",
    modelOrCompatibilityClass: "tier_2_small",
    policyVersionId: "polv1",
    dataClassification: "internal" as const,
    isPersonalized: false,
    isVolatile: false,
    isHighRisk: false,
  };

  it("allows caching when policy permits", () => {
    expect(decideCache(policy, request).allowed).toBe(true);
  });

  it("denies caching for a non-cacheable classification", () => {
    expect(
      decideCache(policy, { ...request, dataClassification: "restricted" })
        .allowed,
    ).toBe(false);
  });

  it("denies caching personalized output", () => {
    expect(
      decideCache(policy, { ...request, isPersonalized: true }).allowed,
    ).toBe(false);
  });

  it("denies caching high-risk output", () => {
    expect(decideCache(policy, { ...request, isHighRisk: true }).allowed).toBe(
      false,
    );
  });

  it("produces different cache keys for different tenants (no leakage)", () => {
    const keyA = buildCacheKey(request);
    const keyB = buildCacheKey({ ...request, tenantId: "t2" });
    expect(keyA).not.toBe(keyB);
  });

  it("produces different cache keys for different systems", () => {
    const keyA = buildCacheKey(request);
    const keyB = buildCacheKey({ ...request, connectedSystemId: "s2" });
    expect(keyA).not.toBe(keyB);
  });

  it("rejects a cache key from another scope", () => {
    const key = buildCacheKey(request);
    expect(verifyCacheKeyScope(key, request)).toBe(true);
    expect(verifyCacheKeyScope(key, { ...request, tenantId: "t2" })).toBe(
      false,
    );
  });
});

describe("cost attribution and ownership separation", () => {
  const record = (overrides: Partial<AiCostRecord>): AiCostRecord => ({
    contractVersion: "v1",
    id: "c1",
    usageRecordId: "u1",
    organizationId: "o1",
    tenantId: "t1",
    connectedSystemId: "s1",
    systemOwnership: "fsts_first_party",
    environmentId: "e1",
    aiIdentityId: "ai1",
    agentId: "a1",
    agentVersionId: "av1",
    providerId: "p1",
    modelId: "m1",
    routingTier: "tier_3_standard",
    routingReason: "cost_optimized",
    estimatedCost: 1,
    currency: "USD",
    priceVersionId: "pv1",
    budgetBeforeExecution: 100,
    budgetRemaining: 99,
    executionStatus: "success",
    correlationId: "corr_12345678",
    occurredAt: NOW,
    ...overrides,
  });

  it("separates client-owned costs from FSTS-owned costs", () => {
    const buckets = attributeCosts([
      record({
        id: "c1",
        systemOwnership: "fsts_first_party",
        connectedSystemId: "fsts1",
      }),
      record({
        id: "c2",
        systemOwnership: "client_owned",
        connectedSystemId: "playraise",
      }),
    ]);
    expect(areOwnershipCostsSeparated(buckets)).toBe(true);
    const fsts = buckets.find((b) => b.dimension === "fsts_system");
    const client = buckets.find((b) => b.dimension === "client_system");
    expect(fsts?.dimensionKey).toBe("fsts1");
    expect(client?.dimensionKey).toBe("playraise");
  });

  it("attributes cost per tenant, agent, provider, and model", () => {
    const buckets = attributeCosts([record({})]);
    const dims = buckets.map((b) => b.dimension);
    expect(dims).toContain("tenant");
    expect(dims).toContain("agent");
    expect(dims).toContain("provider");
    expect(dims).toContain("model");
  });
});

describe("versioned pricing reproducibility", () => {
  const v1: ProviderPriceVersion = {
    contractVersion: "v1",
    id: "pv1",
    providerId: "p1",
    modelId: "m1",
    version: "1",
    inputPerMillionTokens: 1,
    outputPerMillionTokens: 2,
    toolOrRequestCharge: 0,
    currency: "USD",
    region: "us",
    effectiveFrom: "2026-01-01T00:00:00.000Z",
    effectiveTo: "2026-06-01T00:00:00.000Z",
    source: "provider-docs",
    lastVerifiedAt: NOW,
  };
  const v2: ProviderPriceVersion = {
    ...v1,
    id: "pv2",
    version: "2",
    inputPerMillionTokens: 2,
    outputPerMillionTokens: 4,
    effectiveFrom: "2026-06-01T00:00:00.000Z",
    effectiveTo: undefined,
  };

  it("selects the price version effective at a historical time", () => {
    const selected = selectPriceVersion(
      [v1, v2],
      new Date("2026-03-01T00:00:00.000Z"),
    );
    expect(selected?.id).toBe("pv1");
  });

  it("selects the newer price version after the change", () => {
    const selected = selectPriceVersion(
      [v1, v2],
      new Date("2026-07-01T00:00:00.000Z"),
    );
    expect(selected?.id).toBe("pv2");
  });

  it("reproduces historical cost after a price change", () => {
    const usage = { inputTokens: 1_000_000, outputTokens: 1_000_000 };
    const historical = computeCost(v1, usage);
    const current = computeCost(v2, usage);
    expect(historical).toBe(3);
    expect(current).toBe(6);
  });
});

describe("billing reconciliation", () => {
  it("detects a billing mismatch beyond tolerance", () => {
    const result = detectBillingMismatch(100, 120, 5);
    expect(result.mismatch).toBe(true);
    expect(result.variance).toBe(20);
  });

  it("does not flag a mismatch within tolerance", () => {
    expect(detectBillingMismatch(100, 102, 5).mismatch).toBe(false);
  });
});

describe("retry and agent-loop guards", () => {
  it("stops runaway retries", () => {
    expect(
      enforceRetryGuard({ maxRetries: 3, maxRetryCost: 10 }, 3, 0).allowed,
    ).toBe(false);
    expect(
      enforceRetryGuard({ maxRetries: 3, maxRetryCost: 10 }, 1, 0).allowed,
    ).toBe(true);
  });

  it("stops runaway retry cost", () => {
    expect(
      enforceRetryGuard({ maxRetries: 10, maxRetryCost: 5 }, 1, 5).allowed,
    ).toBe(false);
  });

  it("stops runaway agent loops", () => {
    expect(
      enforceAgentLoopGuard(
        { maxIterations: 5, maxToolCalls: 10, maxLoopCost: 20 },
        5,
        0,
        0,
      ).allowed,
    ).toBe(false);
  });

  it("stops excessive tool calls", () => {
    expect(
      enforceAgentLoopGuard(
        { maxIterations: 5, maxToolCalls: 10, maxLoopCost: 20 },
        1,
        10,
        0,
      ).allowed,
    ).toBe(false);
  });
});

describe("idempotency", () => {
  it("does not produce duplicate charges for duplicate requests", () => {
    const guard = new IdempotencyGuard();
    expect(guard.register("idem_1", "result_1")).toBeUndefined();
    expect(guard.register("idem_1", "result_2")).toBe("result_1");
    expect(guard.has("idem_1")).toBe(true);
  });
});

describe("direct provider bypass detection", () => {
  it("reports a direct provider call without an exception", () => {
    expect(detectProviderBypass("direct", false).bypassDetected).toBe(true);
  });

  it("does not report a call routed through the gateway", () => {
    expect(detectProviderBypass("model_gateway", false).bypassDetected).toBe(
      false,
    );
  });

  it("does not report a direct call with a valid exception", () => {
    expect(detectProviderBypass("direct", true).bypassDetected).toBe(false);
  });
});
