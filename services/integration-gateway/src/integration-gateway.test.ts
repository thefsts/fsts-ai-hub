/**
 * Tests for the Integration Gateway.
 *
 * These tests prove fail-closed behavior when policy resolution fails, that
 * raw credentials are rejected, and that successful operations are reported
 * honestly.
 */

import { describe, expect, it } from "vitest";
import {
  assertCredentialReferenceOnly,
  invokeExternalOperation,
  type ApiHubClient,
  type ComplianceHubClient,
  type IntegrationRequest,
} from "./index.js";

function request(
  overrides: Partial<IntegrationRequest> = {},
): IntegrationRequest {
  return {
    operationId: "op-1",
    tenantId: "tenant-a",
    organizationId: "org-a",
    environmentId: "env-1",
    connectedSystemId: "sys-1",
    credentialRef: "cred-ref-1",
    parameters: {},
    dataClassification: "internal",
    correlationId: "corr-12345678",
    idempotencyKey: "idem-12345678",
    ...overrides,
  };
}

const okApiHub: ApiHubClient = {
  invoke: async (req) => ({
    contractVersion: "v1",
    correlationId: req.correlationId,
    outcome: "success",
    retryable: false,
    completedAt: "2026-01-01T00:00:01.000Z",
  }),
};

const okComplianceHub: ComplianceHubClient = {
  getApplicablePolicies: async () => [],
};

describe("invokeExternalOperation", () => {
  it("fails closed when policy resolution fails", async () => {
    const failing: ComplianceHubClient = {
      getApplicablePolicies: async () => {
        throw new Error("compliance hub down");
      },
    };
    const result = await invokeExternalOperation(request(), okApiHub, failing);
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("fail closed");
  });

  it("reports success and applied policies", async () => {
    const withPolicy: ComplianceHubClient = {
      getApplicablePolicies: async () => [
        {
          contractVersion: "v1",
          policyId: "pol-1",
          policyVersionId: "polv-1",
          controlIds: ["ctrl-1"],
          appliesTo: { tenantIds: [], systemIds: [], dataClassifications: [] },
          evidenceRequirements: [],
          effectiveFrom: "2026-01-01T00:00:00.000Z",
        },
      ],
    };
    const result = await invokeExternalOperation(
      request(),
      okApiHub,
      withPolicy,
    );
    expect(result.ok).toBe(true);
    expect(result.appliedPolicies).toContain("polv-1");
  });
});

describe("assertCredentialReferenceOnly", () => {
  it("rejects raw credentials", () => {
    const result = assertCredentialReferenceOnly({
      rawCredential: "sk-live-xxx",
    });
    expect(result.ok).toBe(false);
  });

  it("accepts a credential reference", () => {
    const result = assertCredentialReferenceOnly({
      credentialRef: "cred-ref-1",
    });
    expect(result.ok).toBe(true);
  });

  it("rejects a missing reference", () => {
    expect(assertCredentialReferenceOnly({}).ok).toBe(false);
  });
});
