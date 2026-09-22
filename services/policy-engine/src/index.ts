/**
 * FSTS AI Hub — Policy Engine.
 *
 * Evaluates versioned policies against a request and produces a deny-by-default
 * decision with obligations. The engine is deterministic and side-effect free:
 * it never executes actions, it only decides.
 *
 * Owner: Full Stack Tech & Solutions LLC
 */

import type { DataClassification, RiskLevel } from "@fsts/contracts";
import {
  evaluatePolicy,
  type PolicyEvaluationResult,
  type PolicyRule,
} from "@fsts/policy";

export interface PolicyEvaluationInput {
  tenantId: string;
  organizationId: string;
  environmentId: string;
  connectedSystemId: string;
  aiIdentityId: string;
  agentVersionId: string;
  dataClassification: DataClassification;
  riskLevel: RiskLevel;
  /** Whether the action is on the restricted-action list. */
  isRestrictedAction: boolean;
  /** Whether a valid, applicable, unexpired approval is present. */
  hasValidApproval: boolean;
  /** Whether the requesting AI is the approver (must never be true). */
  isSelfApproval: boolean;
}

/**
 * Evaluate a request against the baseline rules plus optional tenant rules.
 * The default outcome is deny; the engine fails closed on any error.
 */
export function evaluateRequest(
  input: PolicyEvaluationInput,
  tenantRules: PolicyRule[] = [],
  policyVersionId = "polv_baseline",
): PolicyEvaluationResult {
  return evaluatePolicy(
    {
      tenantId: input.tenantId,
      organizationId: input.organizationId,
      environmentId: input.environmentId,
      connectedSystemId: input.connectedSystemId,
      aiIdentityId: input.aiIdentityId,
      agentVersionId: input.agentVersionId,
      dataClassification: input.dataClassification,
      riskLevel: input.riskLevel,
      isRestrictedAction: input.isRestrictedAction,
      hasValidApproval: input.hasValidApproval,
      isSelfApproval: input.isSelfApproval,
    },
    tenantRules,
    policyVersionId,
  );
}
