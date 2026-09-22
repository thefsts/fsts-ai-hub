/**
 * FSTS AI Hub — Approval Engine.
 *
 * Manages human approval requests and their state transitions. Approvals are
 * bound to the exact parameters of an action via an integrity hash so that an
 * approval for one action cannot be reused for a materially different action.
 *
 * Invariants enforced here:
 *   - An AI may never approve its own request.
 *   - An expired approval is never valid.
 *   - An approval is only applicable to the exact action it was granted for.
 *   - State transitions follow a strict, one-way lifecycle.
 *
 * Owner: Full Stack Tech & Solutions LLC
 */

import {
  isApprovalApplicable,
  isApprovalExpired,
  isApproverIndependent,
  type ApprovalRequest,
  type ApprovalState,
} from "@fsts/contracts";

/** Allowed state transitions. */
const TRANSITIONS: Record<ApprovalState, ApprovalState[]> = {
  pending: ["approved", "rejected", "expired", "cancelled"],
  approved: ["executed", "expired", "cancelled"],
  rejected: [],
  expired: [],
  executed: [],
  cancelled: [],
};

export interface TransitionResult {
  ok: boolean;
  nextState?: ApprovalState;
  reason: string;
}

/** Validate a state transition. */
export function transitionApproval(
  current: ApprovalState,
  next: ApprovalState,
): TransitionResult {
  const allowed = TRANSITIONS[current];
  if (!allowed.includes(next)) {
    return {
      ok: false,
      reason: `illegal transition from ${current} to ${next}`,
    };
  }
  return { ok: true, nextState: next, reason: "transition allowed" };
}

export interface ApprovalValidationInput {
  request: ApprovalRequest;
  approverIdentityId: string;
  /** Integrity hash of the action being executed right now. */
  actionParametersIntegrityHash: string;
  now?: Date;
}

export interface ApprovalValidationResult {
  valid: boolean;
  reason: string;
}

/**
 * Validate that an approval may be used to execute an action. Fails closed on
 * any violation.
 */
export function validateApprovalForExecution(
  input: ApprovalValidationInput,
): ApprovalValidationResult {
  const { request, approverIdentityId, actionParametersIntegrityHash } = input;
  const now = input.now ?? new Date();

  if (request.state !== "approved") {
    return {
      valid: false,
      reason: `approval is not in approved state (${request.state})`,
    };
  }
  if (
    !isApproverIndependent(request.requestingAiIdentityId, approverIdentityId)
  ) {
    return {
      valid: false,
      reason: "approver is the requesting AI (self-approval)",
    };
  }
  if (isApprovalExpired(request.expiresAt, now)) {
    return { valid: false, reason: "approval expired" };
  }
  if (
    !isApprovalApplicable(
      request.parametersIntegrityHash,
      actionParametersIntegrityHash,
    )
  ) {
    return {
      valid: false,
      reason: "approval does not apply to this action (parameter mismatch)",
    };
  }
  return { valid: true, reason: "approval valid for execution" };
}

/**
 * Determine whether a category of action requires human approval. This is the
 * canonical restricted-action list.
 */
export const APPROVAL_REQUIRED_CATEGORIES = [
  "financial",
  "legal_or_evidentiary",
  "security",
  "emergency_communication",
  "customer_facing_publication",
  "destructive",
  "identity_or_permission_change",
  "high_risk_tool_execution",
  "external_data_disclosure",
  "cross_system_data_movement",
  "production_configuration_change",
] as const;

export function requiresHumanApproval(category: string): boolean {
  return (APPROVAL_REQUIRED_CATEGORIES as readonly string[]).includes(category);
}
