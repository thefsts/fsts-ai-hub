/**
 * FSTS AI Hub — Policy engine tests.
 *
 * Owner: Full Stack Tech & Solutions LLC
 */

import { describe, expect, it } from "vitest";
import { evaluatePolicy, type PolicyInput } from "./index.js";

const base: PolicyInput = {
  tenantId: "t1",
  organizationId: "o1",
  environmentId: "e1",
  connectedSystemId: "s1",
  aiIdentityId: "ai1",
  agentVersionId: "av1",
  dataClassification: "internal",
  riskLevel: "low",
  isRestrictedAction: false,
  hasValidApproval: false,
  isSelfApproval: false,
};

describe("evaluatePolicy", () => {
  it("allows a low-risk action with full context", () => {
    expect(evaluatePolicy(base).outcome).toBe("allow");
  });

  it("denies a restricted action without approval", () => {
    const result = evaluatePolicy({ ...base, isRestrictedAction: true });
    expect(result.outcome).toBe("deny");
  });

  it("requires approval for a restricted action with a valid approval", () => {
    const result = evaluatePolicy({
      ...base,
      isRestrictedAction: true,
      hasValidApproval: true,
    });
    expect(result.outcome).toBe("require_approval");
    expect(result.obligations).toContain("human_approval");
  });

  it("denies self-approval even with a valid approval", () => {
    const result = evaluatePolicy({
      ...base,
      isRestrictedAction: true,
      hasValidApproval: true,
      isSelfApproval: true,
    });
    expect(result.outcome).toBe("deny");
  });

  it("denies when isolation context is missing", () => {
    expect(evaluatePolicy({ ...base, tenantId: "" }).outcome).toBe("deny");
  });

  it("fails closed when a tenant rule throws", () => {
    const result = evaluatePolicy(base, [
      {
        id: "boom",
        description: "throws",
        priority: 500,
        evaluate: () => {
          throw new Error("boom");
        },
      },
    ]);
    expect(result.outcome).toBe("deny");
  });

  it("applies a tenant rule that denies", () => {
    const result = evaluatePolicy(base, [
      {
        id: "tenant-deny",
        description: "deny everything",
        priority: 500,
        evaluate: () => ({ allowed: false, reason: "tenant policy denies" }),
      },
    ]);
    expect(result.outcome).toBe("deny");
  });
});
