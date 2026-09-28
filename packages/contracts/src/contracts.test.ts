/**
 * FSTS AI Hub — Contract validation tests.
 *
 * These tests assert real behavior: valid contracts parse, invalid contracts
 * are rejected, and trust-boundary guards fail closed.
 *
 * Owner: Full Stack Tech & Solutions LLC
 */

import { describe, expect, it } from "vitest";
import {
  AiIdentitySchema,
  ApprovalRequestSchema,
  ConnectedSystemSchema,
  ExecutionContextSchema,
  ExecutionRequestSchema,
  ProductSystemRegistrationSchema,
  ToolAuthorizationRequestSchema,
  isApprovalApplicable,
  isApprovalExpired,
  isApproverIndependent,
  isDeniedBySuspension,
  isOwnershipClassificationConsistent,
} from "./index.js";

const NOW = "2026-01-01T00:00:00.000Z";

const validContext = {
  tenantId: "tenant_1",
  organizationId: "org_1",
  environmentId: "env_1",
  environmentKind: "production" as const,
  connectedSystemId: "sys_1",
  aiIdentityId: "ai_leone",
  agentVersionId: "agentv_1",
  policyVersionId: "polv_1",
  correlationId: "corr_12345678",
  actorIdentityId: "user_1",
  dataClassification: "internal" as const,
  timestamp: NOW,
};

describe("ExecutionContext", () => {
  it("accepts a complete execution context", () => {
    expect(ExecutionContextSchema.safeParse(validContext).success).toBe(true);
  });

  it("rejects a context missing tenant isolation fields", () => {
    const { tenantId: _omit, ...incomplete } = validContext;
    expect(ExecutionContextSchema.safeParse(incomplete).success).toBe(false);
  });

  it("rejects an invalid data classification", () => {
    const bad = { ...validContext, dataClassification: "top_secret" };
    expect(ExecutionContextSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects a non-ISO timestamp", () => {
    const bad = { ...validContext, timestamp: "yesterday" };
    expect(ExecutionContextSchema.safeParse(bad).success).toBe(false);
  });
});

describe("ExecutionRequest", () => {
  it("accepts a valid execution request and applies defaults", () => {
    const parsed = ExecutionRequestSchema.safeParse({
      contractVersion: "v1",
      context: validContext,
      intent: "Summarize the latest incident report.",
      requestedAt: NOW,
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.stream).toBe(false);
      expect(parsed.data.timeoutMs).toBe(60000);
    }
  });

  it("rejects an execution request without a context", () => {
    const parsed = ExecutionRequestSchema.safeParse({
      contractVersion: "v1",
      intent: "Do something.",
      requestedAt: NOW,
    });
    expect(parsed.success).toBe(false);
  });
});

describe("Ownership classification", () => {
  it("rejects classifying a client-owned product as FSTS-owned", () => {
    expect(isOwnershipClassificationConsistent("client_owned", true)).toBe(
      false,
    );
  });

  it("rejects classifying an FSTS product as client-owned", () => {
    expect(isOwnershipClassificationConsistent("fsts_first_party", false)).toBe(
      false,
    );
  });

  it("accepts consistent classifications", () => {
    expect(isOwnershipClassificationConsistent("client_owned", false)).toBe(
      true,
    );
    expect(isOwnershipClassificationConsistent("fsts_first_party", true)).toBe(
      true,
    );
  });

  it("rejects a connected system with an invalid ownership value", () => {
    const parsed = ConnectedSystemSchema.safeParse({
      contractVersion: "v1",
      id: "sys_1",
      tenantId: "tenant_1",
      organizationId: "org_1",
      name: "PlayRaise",
      ownership: "fsts_owned",
      dataRegion: "us",
      retentionPolicy: {
        policyId: "ret_1",
        retentionDays: 365,
        legalHold: false,
      },
      adapterContractVersion: "v1",
      authorized: true,
      status: "active",
      createdAt: NOW,
      updatedAt: NOW,
    });
    expect(parsed.success).toBe(false);
  });
});

describe("ProductSystemRegistration", () => {
  it("accepts a valid registration", () => {
    const parsed = ProductSystemRegistrationSchema.safeParse({
      contractVersion: "v1",
      tenantId: "tenant_1",
      organizationId: "org_1",
      systemName: "PlayRaise",
      ownership: "client_owned",
      dataRegion: "us",
      adapterContractVersion: "v1",
      requestedCapabilities: ["chat", "summarize"],
      correlationId: "corr_12345678",
      idempotencyKey: "idem_12345678",
      requestedAt: NOW,
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects a registration missing an idempotency key", () => {
    const parsed = ProductSystemRegistrationSchema.safeParse({
      contractVersion: "v1",
      tenantId: "tenant_1",
      organizationId: "org_1",
      systemName: "PlayRaise",
      ownership: "client_owned",
      dataRegion: "us",
      adapterContractVersion: "v1",
      requestedCapabilities: [],
      correlationId: "corr_12345678",
      requestedAt: NOW,
    });
    expect(parsed.success).toBe(false);
  });
});

describe("AiIdentity", () => {
  it("requires at least one allowed environment", () => {
    const parsed = AiIdentitySchema.safeParse({
      contractVersion: "v1",
      id: "ai_leone",
      tenantId: "tenant_1",
      organizationId: "org_1",
      name: "Leone",
      kind: "conversational_assistant",
      ownerIdentityId: "user_1",
      systemAssignments: [],
      allowedEnvironments: [],
      status: "active",
      createdAt: NOW,
      updatedAt: NOW,
    });
    expect(parsed.success).toBe(false);
  });
});

describe("ToolAuthorizationRequest", () => {
  it("accepts a valid tool authorization request", () => {
    const parsed = ToolAuthorizationRequestSchema.safeParse({
      contractVersion: "v1",
      tenantId: "tenant_1",
      organizationId: "org_1",
      environmentId: "env_1",
      connectedSystemId: "sys_1",
      aiIdentityId: "ai_leone",
      agentVersionId: "agentv_1",
      toolId: "tool_1",
      arguments: { query: "status" },
      dataClassification: "internal",
      correlationId: "corr_12345678",
      requestedAt: NOW,
    });
    expect(parsed.success).toBe(true);
  });
});

describe("Approval guards", () => {
  it("rejects an approver that is the requesting AI", () => {
    expect(isApproverIndependent("ai_leone", "ai_leone")).toBe(false);
    expect(isApproverIndependent("ai_leone", "user_1")).toBe(true);
  });

  it("rejects an expired approval", () => {
    expect(isApprovalExpired("2025-01-01T00:00:00.000Z", new Date(NOW))).toBe(
      true,
    );
    expect(isApprovalExpired("2027-01-01T00:00:00.000Z", new Date(NOW))).toBe(
      false,
    );
  });

  it("rejects an approval reused for a materially different action", () => {
    const hashA = "a".repeat(64);
    const hashB = "b".repeat(64);
    expect(isApprovalApplicable(hashA, hashA)).toBe(true);
    expect(isApprovalApplicable(hashA, hashB)).toBe(false);
  });

  it("rejects an approval request with a malformed integrity hash", () => {
    const parsed = ApprovalRequestSchema.safeParse({
      contractVersion: "v1",
      id: "appr_1",
      tenantId: "tenant_1",
      organizationId: "org_1",
      environmentId: "env_1",
      connectedSystemId: "sys_1",
      requestingAiIdentityId: "ai_leone",
      agentVersionId: "agentv_1",
      category: "financial",
      riskLevel: "high",
      requestedAction: "Transfer funds.",
      parametersIntegrityHash: "not-a-hash",
      parametersRef: "ref_1",
      requiredByPolicyVersionId: "polv_1",
      state: "pending",
      expiresAt: "2027-01-01T00:00:00.000Z",
      correlationId: "corr_12345678",
      idempotencyKey: "idem_12345678",
      requestedAt: NOW,
    });
    expect(parsed.success).toBe(false);
  });
});

describe("Emergency suspension (fail-closed)", () => {
  const ctx = {
    tenantId: "tenant_1",
    agentVersionId: "agentv_1",
    toolId: "tool_1",
    providerId: "prov_1",
    connectedSystemId: "sys_1",
  };

  it("denies everything under a global emergency stop", () => {
    expect(
      isDeniedBySuspension(
        [{ scope: "global", globalEmergencyStop: true }],
        ctx,
        new Date(NOW),
      ),
    ).toBe(true);
  });

  it("denies a specific suspended tool", () => {
    expect(
      isDeniedBySuspension(
        [{ scope: "tool", targetId: "tool_1", globalEmergencyStop: false }],
        ctx,
        new Date(NOW),
      ),
    ).toBe(true);
  });

  it("does not deny an unrelated tool", () => {
    expect(
      isDeniedBySuspension(
        [{ scope: "tool", targetId: "tool_other", globalEmergencyStop: false }],
        ctx,
        new Date(NOW),
      ),
    ).toBe(false);
  });

  it("ignores an expired suspension", () => {
    expect(
      isDeniedBySuspension(
        [
          {
            scope: "tool",
            targetId: "tool_1",
            globalEmergencyStop: false,
            expiresAt: "2025-01-01T00:00:00.000Z",
          },
        ],
        ctx,
        new Date(NOW),
      ),
    ).toBe(false);
  });
});
