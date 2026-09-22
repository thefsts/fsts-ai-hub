/**
 * FSTS AI Hub — Execution authorization contract tests.
 *
 * Owner: Full Stack Tech & Solutions LLC
 */

import { describe, expect, it } from "vitest";
import {
  ExecutionAuthorizationDecisionSchema,
  ExecutionAuthorizationRequestSchema,
  OwnershipKindSchema,
} from "./execution-authorization.js";

const validRequest = {
  contractVersion: "1.0",
  organizationKey: "fsts",
  tenantKey: "fsts-internal",
  connectedSystemKey: "arma-system-360",
  ownershipKind: "fsts_owned",
  environment: "development",
  aiIdentityKey: "joy",
  agentVersion: "1.0.0",
  requestedCapability: "summarize-alert",
  dataClassification: "internal",
  maximumCostMicros: 25_000,
  currency: "usd",
  correlationId: "b460e050-8284-4953-9fd9-9a9674a77334",
  idempotencyKey: "idem_01JYFSTSAIHUB0001",
  requestedAt: 1_800_000_000_000,
};

describe("execution authorization request", () => {
  it("accepts a tenant-scoped request and uppercases the currency", () => {
    const result = ExecutionAuthorizationRequestSchema.parse(validRequest);
    expect(result.currency).toBe("USD");
  });

  it("accepts a client-owned system (PlayRaise)", () => {
    const result = ExecutionAuthorizationRequestSchema.parse({
      ...validRequest,
      connectedSystemKey: "playraise",
      ownershipKind: "client_owned",
    });
    expect(result.ownershipKind).toBe("client_owned");
  });

  it("rejects unknown fields so callers cannot smuggle policy inputs", () => {
    const result = ExecutionAuthorizationRequestSchema.safeParse({
      ...validRequest,
      unexpectedPolicyOverride: true,
    });
    expect(result.success).toBe(false);
  });

  it("rejects an ownership kind outside the Convex taxonomy", () => {
    expect(OwnershipKindSchema.safeParse("fsts_first_party").success).toBe(
      false,
    );
  });

  it("rejects a negative maximum cost", () => {
    expect(
      ExecutionAuthorizationRequestSchema.safeParse({
        ...validRequest,
        maximumCostMicros: -1,
      }).success,
    ).toBe(false);
  });

  it("rejects a non-3-letter currency", () => {
    expect(
      ExecutionAuthorizationRequestSchema.safeParse({
        ...validRequest,
        currency: "us",
      }).success,
    ).toBe(false);
  });

  it("rejects a missing required field", () => {
    const { tenantKey: _tenantKey, ...withoutTenant } = validRequest;
    expect(
      ExecutionAuthorizationRequestSchema.safeParse(withoutTenant).success,
    ).toBe(false);
  });
});

describe("execution authorization decision", () => {
  it("accepts a well-formed allow decision", () => {
    const result = ExecutionAuthorizationDecisionSchema.parse({
      contractVersion: "1.0",
      decision: "allow",
      reasonCode: "policy_allow",
      policyVersion: "v1",
      approvedProviderKeys: ["openai"],
      approvedModelKeys: ["gpt-4o-mini"],
      effectiveMaximumCostMicros: 25_000,
      correlationId: "b460e050-8284-4953-9fd9-9a9674a77334",
      expiresAt: 1_800_000_060_000,
    });
    expect(result.decision).toBe("allow");
  });

  it("rejects an unknown decision value", () => {
    expect(
      ExecutionAuthorizationDecisionSchema.safeParse({
        contractVersion: "1.0",
        decision: "maybe",
      }).success,
    ).toBe(false);
  });
});
