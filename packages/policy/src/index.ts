/**
 * FSTS AI Hub — Policy evaluation engine.
 *
 * Deny-by-default policy evaluation. Policies are versioned and evaluated in a
 * deterministic order. On any error or ambiguity, the engine fails closed.
 *
 * Owner: Full Stack Tech & Solutions LLC
 */

import type { DecisionOutcome, RiskLevel } from "@fsts/contracts";
import { combineDecisions, type AuthzDecision } from "@fsts/security";

export interface PolicyRule {
  id: string;
  description: string;
  /** Higher priority rules are evaluated first. */
  priority: number;
  /** Returns a decision, or null to abstain. */
  evaluate: (input: PolicyInput) => AuthzDecision | null;
}

export interface PolicyInput {
  tenantId: string;
  organizationId: string;
  environmentId: string;
  connectedSystemId: string;
  aiIdentityId: string;
  agentVersionId: string;
  dataClassification: string;
  riskLevel: RiskLevel;
  /** Whether the action is on the restricted-action list. */
  isRestrictedAction: boolean;
  /** Whether a valid, applicable, unexpired approval is present. */
  hasValidApproval: boolean;
  /** Whether the requesting AI is the approver (must never be true). */
  isSelfApproval: boolean;
}

export interface PolicyEvaluationResult {
  outcome: DecisionOutcome;
  reason: string;
  obligations: string[];
  policyVersionId: string;
}

/**
 * Built-in baseline rules. These encode the non-negotiable security posture and
 * are always evaluated before any tenant-supplied rules.
 */
export const BASELINE_RULES: PolicyRule[] = [
  {
    id: "deny-self-approval",
    description: "An AI may never approve its own restricted action.",
    priority: 1000,
    evaluate: (input) =>
      input.isSelfApproval
        ? { allowed: false, reason: "self-approval is prohibited" }
        : null,
  },
  {
    id: "require-approval-restricted",
    description: "Restricted actions require a valid human approval.",
    priority: 900,
    evaluate: (input) => {
      if (input.isRestrictedAction && !input.hasValidApproval) {
        return {
          allowed: false,
          reason: "restricted action requires a valid human approval",
        };
      }
      return null;
    },
  },
  {
    id: "deny-missing-context",
    description: "All isolation context fields must be present.",
    priority: 800,
    evaluate: (input) => {
      const required = [
        input.tenantId,
        input.organizationId,
        input.environmentId,
        input.connectedSystemId,
        input.aiIdentityId,
        input.agentVersionId,
      ];
      return required.some((v) => !v)
        ? { allowed: false, reason: "missing required isolation context" }
        : null;
    },
  },
];

/**
 * Evaluate a policy input against baseline rules and optional tenant rules.
 * Returns a DecisionOutcome. Fails closed on error.
 */
export function evaluatePolicy(
  input: PolicyInput,
  tenantRules: PolicyRule[] = [],
  policyVersionId = "polv_baseline",
): PolicyEvaluationResult {
  try {
    const rules = [...BASELINE_RULES, ...tenantRules].sort(
      (a, b) => b.priority - a.priority,
    );

    const decisions: AuthzDecision[] = [];
    for (const rule of rules) {
      const decision = rule.evaluate(input);
      if (decision) decisions.push(decision);
    }

    // Rules abstain by returning null. If no rule produced a decision, the
    // request passes the baseline checks. If any rule denied, fail closed.
    if (decisions.length > 0) {
      const combined = combineDecisions(decisions);
      if (!combined.allowed) {
        return {
          outcome: "deny",
          reason: combined.reason,
          obligations: [],
          policyVersionId,
        };
      }
    }

    if (input.isRestrictedAction) {
      return {
        outcome: "require_approval",
        reason: "restricted action permitted with approval",
        obligations: ["human_approval"],
        policyVersionId,
      };
    }

    return {
      outcome: "allow",
      reason: "all policy checks passed",
      obligations: [],
      policyVersionId,
    };
  } catch {
    // Fail closed on any evaluation error.
    return {
      outcome: "deny",
      reason: "policy evaluation error (fail closed)",
      obligations: [],
      policyVersionId,
    };
  }
}
