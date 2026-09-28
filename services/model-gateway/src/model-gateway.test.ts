/**
 * Tests for the Model Gateway.
 *
 * These tests prove the gateway never routes to an unapproved, noncompliant,
 * incapable, unhealthy, or suspended model, and that direct provider bypass is
 * detected.
 */

import { describe, expect, it } from "vitest";
import {
  decideModelRoute,
  detectModelGatewayBypass,
  normalizeProviderError,
  type ApprovedModel,
  type ModelGatewayRequest,
} from "./index.js";

function model(overrides: Partial<ApprovedModel> = {}): ApprovedModel {
  return {
    providerId: "provider-a",
    modelId: "model-a",
    tier: "tier_3_standard",
    capabilities: ["chat"],
    approvedClassifications: ["public", "internal"],
    approvedRegions: ["us"],
    healthy: true,
    suspended: false,
    estimatedCost: 1,
    estimatedLatencyMs: 500,
    qualityScore: 0.9,
    ...overrides,
  };
}

function request(
  overrides: Partial<ModelGatewayRequest> = {},
): ModelGatewayRequest {
  return {
    requiredCapability: "chat",
    dataClassification: "internal",
    requiredRegion: "us",
    deterministicPossible: false,
    cacheAvailable: false,
    budgetRequiresCheaper: false,
    ...overrides,
  };
}

describe("decideModelRoute", () => {
  it("blocks when no approved model is available", () => {
    const decision = decideModelRoute(request(), []);
    expect(decision.allowed).toBe(false);
    expect(decision.routing.blocked).toBe(true);
  });

  it("never selects a model not approved for the data classification", () => {
    const decision = decideModelRoute(
      request({ dataClassification: "regulated" }),
      [model({ approvedClassifications: ["public"] })],
    );
    expect(decision.allowed).toBe(false);
  });

  it("never selects a model that violates residency", () => {
    const decision = decideModelRoute(request({ requiredRegion: "eu" }), [
      model({ approvedRegions: ["us"] }),
    ]);
    expect(decision.allowed).toBe(false);
  });

  it("never selects a suspended model", () => {
    const decision = decideModelRoute(request(), [model({ suspended: true })]);
    expect(decision.allowed).toBe(false);
  });

  it("never selects an incapable model", () => {
    const decision = decideModelRoute(
      request({ requiredCapability: "vision" }),
      [model({ capabilities: ["chat"] })],
    );
    expect(decision.allowed).toBe(false);
  });

  it("selects an eligible model", () => {
    const decision = decideModelRoute(request(), [model()]);
    expect(decision.allowed).toBe(true);
    expect(decision.selected?.modelId).toBe("model-a");
  });

  it("prefers deterministic processing when possible", () => {
    const decision = decideModelRoute(
      request({ deterministicPossible: true }),
      [model()],
    );
    expect(decision.routing.reason).toBe("deterministic_no_llm");
  });
});

describe("detectModelGatewayBypass", () => {
  it("flags a call with no gateway decision", () => {
    const result = detectModelGatewayBypass({
      providerId: "p",
      modelId: "m",
    });
    expect(result.bypass).toBe(true);
  });

  it("accepts a call with a gateway decision", () => {
    const result = detectModelGatewayBypass({
      gatewayDecisionId: "dec-1",
      providerId: "p",
      modelId: "m",
    });
    expect(result.bypass).toBe(false);
  });
});

describe("normalizeProviderError", () => {
  it("normalizes common status codes", () => {
    expect(normalizeProviderError(429)).toBe("rate_limited");
    expect(normalizeProviderError(504)).toBe("timeout");
    expect(normalizeProviderError(500)).toBe("provider_error");
    expect(normalizeProviderError(undefined)).toBe("unknown");
  });
});
