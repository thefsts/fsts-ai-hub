/**
 * FSTS AI Hub — Shared contract primitives.
 *
 * These are the lowest-level, reusable building blocks for every cross-system
 * contract. They are versioned, runtime-validated, and deliberately strict.
 *
 * Owner: Full Stack Tech & Solutions LLC
 */

import { z } from "zod";

/** Semantic version string, e.g. "1.0.0". */
export const SemVerSchema = z
  .string()
  .regex(/^\d+\.\d+\.\d+$/, "must be a semantic version (e.g. 1.0.0)");

/** Contract version identifier, e.g. "v1". */
export const ContractVersionSchema = z
  .string()
  .regex(/^v\d+$/, "must be a contract version (e.g. v1)");

/** ISO-8601 UTC timestamp. */
export const TimestampSchema = z
  .string()
  .datetime({ offset: true, message: "must be an ISO-8601 timestamp" });

/** Opaque, non-empty identifier. */
export const IdSchema = z.string().min(1).max(128);

/** Correlation ID used to trace a request across systems. */
export const CorrelationIdSchema = z.string().min(8).max(128);

/** Idempotency key for replay-safe operations. */
export const IdempotencyKeySchema = z.string().min(8).max(256);

/**
 * Data classification levels, ordered from least to most sensitive.
 * Used to enforce handling, routing, and retention rules.
 */
export const DataClassificationSchema = z.enum([
  "public",
  "internal",
  "confidential",
  "restricted",
  "regulated",
]);
export type DataClassification = z.infer<typeof DataClassificationSchema>;

/** Environment kinds. */
export const EnvironmentKindSchema = z.enum([
  "development",
  "test",
  "staging",
  "production",
]);
export type EnvironmentKind = z.infer<typeof EnvironmentKindSchema>;

/** Lifecycle status shared by many entities. */
export const LifecycleStatusSchema = z.enum([
  "draft",
  "active",
  "suspended",
  "deprecated",
  "retired",
]);
export type LifecycleStatus = z.infer<typeof LifecycleStatusSchema>;

/**
 * System ownership classification.
 *
 * FSTS-owned products may be registered as first-party systems.
 * Client-owned systems (e.g. PlayRaise) are classified separately and require
 * explicit authorization, independent tenant boundaries, and restricted access.
 */
export const SystemOwnershipSchema = z.enum([
  "fsts_first_party",
  "fsts_internal",
  "client_owned",
  "third_party",
]);
export type SystemOwnership = z.infer<typeof SystemOwnershipSchema>;

/** Data residency region. */
export const DataRegionSchema = z.enum([
  "us",
  "eu",
  "uk",
  "ca",
  "au",
  "global",
]);
export type DataRegion = z.infer<typeof DataRegionSchema>;

/** Risk level for tools, actions, and decisions. */
export const RiskLevelSchema = z.enum([
  "none",
  "low",
  "medium",
  "high",
  "critical",
]);
export type RiskLevel = z.infer<typeof RiskLevelSchema>;

/** Decision outcomes for policy evaluation. */
export const DecisionOutcomeSchema = z.enum([
  "allow",
  "deny",
  "require_approval",
  "allow_with_redaction",
]);
export type DecisionOutcome = z.infer<typeof DecisionOutcomeSchema>;

/**
 * The mandatory execution context that every material execution must carry.
 *
 * This is the backbone of tenant isolation, auditability, and policy
 * enforcement. User-supplied tenant IDs must never be trusted without
 * verification against the authenticated identity and authorized system
 * context.
 */
export const ExecutionContextSchema = z.object({
  tenantId: IdSchema,
  organizationId: IdSchema,
  environmentId: IdSchema,
  environmentKind: EnvironmentKindSchema,
  connectedSystemId: IdSchema,
  aiIdentityId: IdSchema,
  agentVersionId: IdSchema,
  policyVersionId: IdSchema,
  promptVersionId: IdSchema.optional(),
  workflowVersionId: IdSchema.optional(),
  correlationId: CorrelationIdSchema,
  idempotencyKey: IdempotencyKeySchema.optional(),
  actorIdentityId: IdSchema,
  dataClassification: DataClassificationSchema,
  timestamp: TimestampSchema,
});
export type ExecutionContext = z.infer<typeof ExecutionContextSchema>;

/** Standard structured error shape used across all contracts. */
export const ContractErrorSchema = z.object({
  code: z.string().min(1).max(64),
  message: z.string().min(1).max(1024),
  retryable: z.boolean(),
  details: z.record(z.unknown()).optional(),
});
export type ContractError = z.infer<typeof ContractErrorSchema>;

/**
 * A credential reference. The AI Hub stores references to credentials owned by
 * the API Hub — never the secret material itself.
 */
export const CredentialRefSchema = z.object({
  ref: z.string().min(1).max(256),
  provider: z.string().min(1).max(64),
  scope: z.string().min(1).max(128).optional(),
});
export type CredentialRef = z.infer<typeof CredentialRefSchema>;

/** Retention policy reference. */
export const RetentionPolicySchema = z.object({
  policyId: IdSchema,
  retentionDays: z.number().int().nonnegative(),
  legalHold: z.boolean().default(false),
});
export type RetentionPolicy = z.infer<typeof RetentionPolicySchema>;
