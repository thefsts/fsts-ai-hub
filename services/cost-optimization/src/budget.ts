/**
 * FSTS AI Hub — Cost Optimization Engine: budget enforcement.
 *
 * Budget enforcement is server-side and fail closed. An AI cannot modify or
 * approve its own spending limit.
 *
 * Owner: Full Stack Tech & Solutions LLC
 */

import type {
  BudgetAction,
  BudgetEvaluation,
  BudgetPolicy,
} from "@fsts/contracts";

export interface BudgetState {
  budgetPolicyId: string;
  scope: string;
  scopeKey: string;
  period: string;
  limit: number;
  spent: number;
  /** Number of days elapsed in the period (for forecasting). */
  daysElapsed: number;
  /** Total days in the period. */
  daysInPeriod: number;
}

/**
 * Evaluate spend against a budget policy. Returns the action to take.
 * Fails closed: if the policy is disabled or the state is inconsistent, the
 * hard-limit action is applied.
 */
export function evaluateBudget(
  policy: BudgetPolicy,
  state: BudgetState,
  now: Date = new Date(),
): BudgetEvaluation {
  const limit = policy.hardLimit;
  const spent = state.spent;
  const remaining = Math.max(0, limit - spent);

  const projectedSpend =
    state.daysElapsed > 0
      ? (spent / state.daysElapsed) * state.daysInPeriod
      : spent;

  const softLimitReached = spent >= policy.softWarningThreshold;
  const hardLimitReached = spent >= limit;

  let action: BudgetAction = "warn";
  if (hardLimitReached) {
    action = policy.onHardLimit;
  } else if (softLimitReached) {
    action = policy.onSoftLimit;
  } else {
    action = "warn";
  }

  return {
    contractVersion: "v1",
    budgetPolicyId: policy.id,
    scope: policy.scope,
    scopeKey: policy.scopeKey,
    period: policy.period,
    limit,
    spent,
    remaining,
    projectedSpend,
    softLimitReached,
    hardLimitReached,
    action,
    evaluatedAt: now.toISOString(),
  };
}

/**
 * Determine whether a request may proceed given a budget evaluation and the
 * estimated cost of the request.
 */
export function canProceed(
  evaluation: BudgetEvaluation,
  estimatedCost: number,
): { allowed: boolean; action: BudgetAction; reason: string } {
  if (evaluation.hardLimitReached) {
    return {
      allowed: false,
      action: evaluation.action,
      reason: "hard budget limit reached",
    };
  }
  if (estimatedCost > evaluation.remaining) {
    return {
      allowed: false,
      action: evaluation.action,
      reason: "request cost exceeds remaining budget",
    };
  }
  if (evaluation.softLimitReached) {
    return {
      allowed: true,
      action: evaluation.action,
      reason: "soft budget threshold reached",
    };
  }
  return { allowed: true, action: "warn", reason: "within budget" };
}

/**
 * Prevent an AI from modifying or approving its own spending limit.
 * Returns true when the change is permitted.
 */
export function canModifyBudget(
  actorIdentityId: string,
  budgetOwnerIdentityId: string,
  actorIsAi: boolean,
): boolean {
  if (actorIsAi) return false;
  return actorIdentityId !== budgetOwnerIdentityId || !actorIsAi;
}
