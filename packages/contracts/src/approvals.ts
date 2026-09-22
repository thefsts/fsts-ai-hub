/**
 * FSTS AI Hub — Human approval requests and decisions.
 *
 * Owner: Full Stack Tech & Solutions LLC
 */

import { z } from "zod";
import {
  ContractVersionSchema,
  IdSchema,
  RiskLevelSchema,
  TimestampSchema,
} from "./primitives.js";

export const APPROVALS_CONTRACT_VERSION = "v1" as const;

/**
 * Categories of actions that require human approval.
 */
export const ApprovalCategorySchema = z.enum([
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
]);
export type ApprovalCategory = z.infer<typeof ApprovalCategorySchema>;

/** Approval lifecycle states. */
export const ApprovalStateSchema = z.enum([
  "pending",
  "approved",
  "rejected",
  "expired",
  "executed",
  "cancelled",
]);
export type ApprovalState = z.infer<typeof ApprovalStateSchema>;

/**
 * An approval request. The exact parameters are bound by an integrity
 * reference so that an approval for one action cannot be reused for a
 * materially different action.
 */
export const ApprovalRequestSchema = z.object({
  contractVersion: ContractVersionSchema,
  id: IdSchema,
  tenantId: IdSchema,
  organizationId: IdSchema,
  environmentId: IdSchema,
  connectedSystemId: IdSchema,
  /** The AI requesting the action. */
  requestingAiIdentityId: IdSchema,
  agentVersionId: IdSchema,
  category: ApprovalCategorySchema,
  riskLevel: RiskLevelSchema,
  /** Human-readable description of the requested action. */
  requestedAction: z.string().min(1).max(4096),
  /** SHA-256 hash binding the exact parameters of the action. */
  parametersIntegrityHash: z.string().regex(/^[a-f0-9]{64}$/),
  /** Protected reference to the full parameters (not the raw parameters). */
  parametersRef: z.string().min(1).max(256),
  /** The policy that requires approval. */
  requiredByPolicyVersionId: IdSchema,
  state: ApprovalStateSchema,
  /** Expiration of the approval window. */
  expiresAt: TimestampSchema,
  correlationId: z.string().min(8).max(128),
  idempotencyKey: z.string().min(8).max(256),
  requestedAt: TimestampSchema,
});
export type ApprovalRequest = z.infer<typeof ApprovalRequestSchema>;

/** An approval decision made by a human approver. */
export const ApprovalDecisionSchema = z.object({
  contractVersion: ContractVersionSchema,
  id: IdSchema,
  approvalRequestId: IdSchema,
  /** The human approver. Must not be the requesting AI. */
  approverIdentityId: IdSchema,
  decision: z.enum(["approved", "rejected"]),
  reason: z.string().min(1).max(2048),
  /** Execution status after the decision. */
  executionStatus: z.enum([
    "not_started",
    "in_progress",
    "completed",
    "failed",
  ]),
  correlationId: z.string().min(8).max(128),
  decidedAt: TimestampSchema,
});
export type ApprovalDecision = z.infer<typeof ApprovalDecisionSchema>;

/**
 * Guard: an approval decision must be made by a human identity that is not the
 * requesting AI. Returns true when the decision is valid on this dimension.
 */
export function isApproverIndependent(
  requestingAiIdentityId: string,
  approverIdentityId: string,
): boolean {
  return requestingAiIdentityId !== approverIdentityId;
}

/**
 * Guard: an approval is expired when the current time is at or after its
 * expiration. Expired approvals must be rejected.
 */
export function isApprovalExpired(
  expiresAt: string,
  now: Date = new Date(),
): boolean {
  return new Date(expiresAt).getTime() <= now.getTime();
}

/**
 * Guard: an approval may only be used for the exact action it was granted for.
 * The integrity hash of the action being executed must match the hash bound to
 * the approval.
 */
export function isApprovalApplicable(
  approvalParametersIntegrityHash: string,
  actionParametersIntegrityHash: string,
): boolean {
  return approvalParametersIntegrityHash === actionParametersIntegrityHash;
}
