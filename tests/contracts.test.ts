import { describe, expect, it } from "vitest";
import { executionAuthorizationRequestSchema } from "../src/contracts/execution";
import { canonicalizeServiceRequest } from "../src/contracts/service-auth";

describe("execution authorization contract", () => {
  it("accepts a tenant-scoped request", () => {
    const result = executionAuthorizationRequestSchema.parse({
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
    });

    expect(result.currency).toBe("USD");
  });

  it("rejects unknown fields so callers cannot smuggle policy inputs", () => {
    const result = executionAuthorizationRequestSchema.safeParse({
      contractVersion: "1.0",
      unexpectedPolicyOverride: true,
    });
    expect(result.success).toBe(false);
  });
});

describe("service request canonicalization", () => {
  it("produces a deterministic signed representation", () => {
    expect(
      canonicalizeServiceRequest({
        method: "post",
        pathname: "/v1/executions/authorize",
        timestamp: 1_800_000_000_000,
        nonce: "nonce_01JYFSTSAIHUB",
        bodyDigest: "ABCDEF",
      }),
    ).toBe("POST\n/v1/executions/authorize\n1800000000000\nnonce_01JYFSTSAIHUB\nabcdef");
  });
});
