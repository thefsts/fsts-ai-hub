/**
 * FSTS AI Hub — Normalized audit events, usage, and cost records.
 *
 * Owner: Full Stack Tech & Solutions LLC
 */

import { z } from "zod";
import {
  ContractVersionSchema,
  DataClassificationSchema,
  IdSchema,
  TimestampSchema,
} from "./primitives.js";

export const AUDIT_CONTRACT_VERSION = "v1" as const;

/** Normalized audit event types. */
export const AuditEventTypeSchema = z.enum([
  "authentication",
  "authorization",
  "policy_evaluation",
  "model_selection",
  "model_request",
  "model_response_metadata",
  "tool_selection",
  "tool_execution",
  "approval_request",
  "approval_decision",
  "memory_access",
  "knowledge_retrieval",
  "prompt_version_use",
  "configuration_change",
  "permission_change",
  "emergency_stop",
  "security_event",
  "cost_event",
  "error",
  "retry",
  "cancellation",
  "data_export",
  "data_deletion",
]);
export type AuditEventType = z.infer<typeof AuditEventTypeSchema>;

/**
 * A normalized audit event. Every material execution produces one or more of
 * these. Secrets and unrestricted sensitive content must never be recorded.
 */
export const AuditEventSchema = z.object({
  contractVersion: ContractVersionSchema,
  id: IdSchema,
  type: AuditEventTypeSchema,
  tenantId: IdSchema,
  organizationId: IdSchema,
  environmentId: IdSchema,
  connectedSystemId: IdSchema,
  aiIdentityId: IdSchema.optional(),
  agentVersionId: IdSchema.optional(),
  actorIdentityId: IdSchema,
  correlationId: z.string().min(8).max(128),
  traceId: z.string().min(8).max(128),
  dataClassification: DataClassificationSchema,
  /** Structured, redacted payload. */
  payload: z.record(z.unknown()),
  /** Integrity hash over the canonicalized event. */
  integrityHash: z.string().regex(/^[a-f0-9]{64}$/),
  /** Retention classification for the event. */
  retentionClass: z.enum(["short", "standard", "long", "legal_hold"]),
  occurredAt: TimestampSchema,
});
export type AuditEvent = z.infer<typeof AuditEventSchema>;

/** A usage record for a single metered operation. */
export const UsageRecordSchema = z.object({
  contractVersion: ContractVersionSchema,
  id: IdSchema,
  tenantId: IdSchema,
  organizationId: IdSchema,
  environmentId: IdSchema,
  connectedSystemId: IdSchema,
  aiIdentityId: IdSchema,
  agentVersionId: IdSchema,
  resourceType: z.enum(["model", "tool", "memory", "knowledge"]),
  resourceId: IdSchema,
  quantity: z.number().nonnegative(),
  unit: z.string().min(1).max(32),
  correlationId: z.string().min(8).max(128),
  occurredAt: TimestampSchema,
});
export type UsageRecord = z.infer<typeof UsageRecordSchema>;

/** A cost record derived from usage. */
export const CostRecordSchema = z.object({
  contractVersion: ContractVersionSchema,
  id: IdSchema,
  tenantId: IdSchema,
  organizationId: IdSchema,
  environmentId: IdSchema,
  connectedSystemId: IdSchema,
  aiIdentityId: IdSchema,
  usageRecordId: IdSchema,
  currency: z.string().length(3),
  amount: z.number().nonnegative(),
  costDefinitionId: IdSchema,
  correlationId: z.string().min(8).max(128),
  occurredAt: TimestampSchema,
});
export type CostRecord = z.infer<typeof CostRecordSchema>;

/** A health status report for a component. */
export const HealthStatusSchema = z.object({
  contractVersion: ContractVersionSchema,
  componentId: IdSchema,
  componentType: z.enum([
    "service",
    "provider",
    "model",
    "tool",
    "mcp_server",
    "connector",
  ]),
  status: z.enum(["healthy", "degraded", "unavailable", "unknown"]),
  message: z.string().max(1024).optional(),
  checkedAt: TimestampSchema,
});
export type HealthStatus = z.infer<typeof HealthStatusSchema>;
