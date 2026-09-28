/**
 * FSTS AI Hub — Execution authorization contract.
 *
 * The request a connected system submits to obtain authorization to execute an
 * AI action against the Convex backend, and the decision the Hub returns. This
 * is the machine-facing authorization boundary: no execution proceeds without
 * an explicit `allow` decision.
 *
 * Owner: Full Stack Tech & Solutions LLC
 */

import { z } from "zod";
import {
  CorrelationIdSchema,
  DataClassificationSchema,
  IdempotencyKeySchema,
} from "./primitives.js";

export const EXECUTION_AUTHORIZATION_CONTRACT_VERSION = "1.0" as const;

/**
 * Ownership classification as persisted by the Convex backend
 * (`connectedSystems.ownershipKind`).
 *
 * Client-owned systems such as PlayRaise are classified `client_owned` and
 * require explicit authorization, independent tenant boundaries, and
 * restricted access. FSTS-owned and partner-owned systems are classified
 * separately.
 */
export const OwnershipKindSchema = z.enum([
  "fsts_owned",
  "client_owned",
  "partner_owned",
]);
export type OwnershipKind = z.infer<typeof OwnershipKindSchema>;

/**
 * Environment as persisted by the Convex backend
 * (`connectedSystems.environment`).
 */
export const ExecutionEnvironmentSchema = z.enum([
  "development",
  "staging",
  "production",
]);
export type ExecutionEnvironment = z.infer<typeof ExecutionEnvironmentSchema>;

/**
 * A request to authorize a single AI execution.
 *
 * The caller supplies the tenant, connected system, ownership, environment,
 * capability, data classification, and a maximum allowed cost. The Hub never
 * trusts a caller-supplied tenant ID without verifying it against the
 * authenticated service identity and the authorized system context.
 */
export const ExecutionAuthorizationRequestSchema = z
  .object({
    contractVersion: z.literal(EXECUTION_AUTHORIZATION_CONTRACT_VERSION),
    organizationKey: z.string().min(1).max(128),
    tenantKey: z.string().min(1).max(128),
    connectedSystemKey: z.string().min(1).max(128),
    ownershipKind: OwnershipKindSchema,
    environment: ExecutionEnvironmentSchema,
    aiIdentityKey: z.string().min(1).max(128),
    agentVersion: z.string().min(1).max(64),
    workflowKey: z.string().min(1).max(128).optional(),
    requestedCapability: z.string().min(1).max(128),
    dataClassification: DataClassificationSchema,
    maximumCostMicros: z.number().int().nonnegative(),
    currency: z
      .string()
      .length(3)
      .transform((value) => value.toUpperCase()),
    correlationId: CorrelationIdSchema,
    idempotencyKey: IdempotencyKeySchema,
    requestedAt: z.number().int().nonnegative(),
  })
  .strict();
export type ExecutionAuthorizationRequest = z.infer<
  typeof ExecutionAuthorizationRequestSchema
>;

/**
 * The Hub's decision for an execution authorization request.
 *
 * `allow` authorizes execution within the returned provider/model allowlist and
 * effective cost ceiling. `deny` and `require_approval` do not authorize
 * execution. The decision is bound to the request correlation ID and expires.
 */
export const ExecutionAuthorizationDecisionSchema = z
  .object({
    contractVersion: z.literal(EXECUTION_AUTHORIZATION_CONTRACT_VERSION),
    decision: z.enum(["allow", "deny", "require_approval"]),
    reasonCode: z.string().min(1).max(128),
    policyVersion: z.string().min(1).max(128),
    approvedProviderKeys: z.array(z.string().min(1).max(128)),
    approvedModelKeys: z.array(z.string().min(1).max(128)),
    effectiveMaximumCostMicros: z.number().int().nonnegative(),
    correlationId: CorrelationIdSchema,
    expiresAt: z.number().int().nonnegative(),
  })
  .strict();
export type ExecutionAuthorizationDecision = z.infer<
  typeof ExecutionAuthorizationDecisionSchema
>;
