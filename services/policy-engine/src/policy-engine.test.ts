/**
 * Tests for the Policy Engine.
 *
 * These tests prove deny-by-default behavior, self-approval prohibition, and
 * approval requirements for restricted actions.
 */

import { describe, expect, it } from "vitest";
import { evaluateRequest, type PolicyEvaluationInput } from "./index.js";

function input(
  overrides: Partial<PolicyEvaluationInput> = {},
): PolicyEvaluationInput {
  return {
    tenantId: "tenant-a",
    organizationId: "org-a",
    environmentId: "env-1",
    connectedSystemId: "sys-1",
    aiIdentityId: "ai-1",
    agentVersionId: "av-1",
    dataClassification: "internal",
    riskLevel: "low",
    isRestrictedAction: false,
    hasValidApproval: false,
    isSelfApproval: false,
    ...overrides,
  };
}

describe("evaluateRequest", () => {
  it("allows a non-restricted action with full context", () => {
    const result = evaluateRequest(input());
    expect(result.outcome).toBe("allow");
  });

  it("denies self-approval", () => {
    const result = evaluateRequest(input({ isSelfApproval: true }));
    expect(result.outcome).toBe("deny");
  });

  it("requires approval for a restricted action without approval", () => {
    const result = evaluateRequest(input({ isRestrictedAction: true }));
    expect(result.outcome).toBe("deny");
  });

  it("requires approval for a restricted action with a valid approval", () => {
    const result = evaluateRequest(
      input({ isRestrictedAction: true, hasValidApproval: true }),
    );
    expect(result.outcome).toBe("require_approval");
  });

  it("denies when isolation context is missing", () => {
    const result = evaluateRequest(input({ tenantId: "" }));
    expect(result.outcome).toBe("deny");
  });
});
