/**
 * FSTS AI Hub — Connector contracts for the API Hub, Compliance Hub, and
 * product-side adapters.
 *
 * The AI Hub does NOT recreate the API Hub or the Compliance Hub. It consumes
 * their capabilities through these versioned contracts.
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

export const CONNECTORS_CONTRACT_VERSION = "v1" as const;

/**
 * API Hub operation request. External connectivity is owned by the API Hub;
 * the AI Hub submits governed operation requests and never holds provider
 * credentials directly.
 */
export const ApiHubOperationRequestSchema = z.object({
  contractVersion: ContractVersionSchema,
  /** The API Hub operation to invoke. */
  operationId: IdSchema,
  tenantId: IdSchema,
  organizationId: IdSchema,
  environmentId: IdSchema,
  connectedSystemId: IdSchema,
  /** Credential reference owned by the API Hub — never the value. */
  credentialRef: z.string().min(1).max(256),
  /** Validated operation parameters. */
  parameters: z.record(z.unknown()),
  dataClassification: DataClassificationSchema,
  correlationId: z.string().min(8).max(128),
  idempotencyKey: z.string().min(8).max(256),
  timeoutMs: z.number().int().positive().max(600000).default(30000),
  requestedAt: TimestampSchema,
});
export type ApiHubOperationRequest = z.infer<
  typeof ApiHubOperationRequestSchema
>;

/** API Hub operation response. */
export const ApiHubOperationResponseSchema = z.object({
  contractVersion: ContractVersionSchema,
  correlationId: z.string().min(8).max(128),
  outcome: z.enum(["success", "error", "timeout", "rate_limited"]),
  statusCode: z.number().int().optional(),
  /** Redacted response payload. */
  payload: z.record(z.unknown()).optional(),
  errorCode: z.string().max(64).optional(),
  retryable: z.boolean().default(false),
  completedAt: TimestampSchema,
});
export type ApiHubOperationResponse = z.infer<
  typeof ApiHubOperationResponseSchema
>;

/**
 * Compliance Hub policy reference. The Compliance Hub supplies applicable
 * policies and control references; the AI Hub enforces them. The Compliance
 * Hub does not execute product actions.
 */
export const ComplianceHubPolicyReferenceSchema = z.object({
  contractVersion: ContractVersionSchema,
  policyId: IdSchema,
  policyVersionId: IdSchema,
  /** Regulatory control identifiers this policy maps to. */
  controlIds: z.array(IdSchema).max(256),
  /** Applicability scope. */
  appliesTo: z.object({
    tenantIds: z.array(IdSchema).max(256).default([]),
    systemIds: z.array(IdSchema).max(256).default([]),
    dataClassifications: z.array(DataClassificationSchema).max(16).default([]),
  }),
  /** Evidence requirements the AI Hub must produce. */
  evidenceRequirements: z.array(IdSchema).max(256),
  effectiveFrom: TimestampSchema,
  effectiveTo: TimestampSchema.optional(),
});
export type ComplianceHubPolicyReference = z.infer<
  typeof ComplianceHubPolicyReferenceSchema
>;

/**
 * Product adapter request envelope. Product systems connect through versioned
 * product-side adapters and must not receive unrestricted direct access to
 * internal Hub services.
 */
export const ProductAdapterRequestSchema = z.object({
  contractVersion: ContractVersionSchema,
  adapterContractVersion: ContractVersionSchema,
  tenantId: IdSchema,
  organizationId: IdSchema,
  environmentId: IdSchema,
  connectedSystemId: IdSchema,
  /** The product-side actor identity. */
  actorIdentityId: IdSchema,
  /** The AI identity acting on behalf of the product. */
  aiIdentityId: IdSchema,
  operation: z.string().min(1).max(128),
  payload: z.record(z.unknown()),
  correlationId: z.string().min(8).max(128),
  idempotencyKey: z.string().min(8).max(256),
  requestedAt: TimestampSchema,
});
export type ProductAdapterRequest = z.infer<typeof ProductAdapterRequestSchema>;

/** Product adapter response envelope. */
export const ProductAdapterResponseSchema = z.object({
  contractVersion: ContractVersionSchema,
  correlationId: z.string().min(8).max(128),
  outcome: z.enum(["success", "error", "denied", "pending_approval"]),
  payload: z.record(z.unknown()).optional(),
  errorCode: z.string().max(64).optional(),
  /** Product systems must revalidate actions before applying them. */
  requiresProductRevalidation: z.boolean().default(true),
  completedAt: TimestampSchema,
});
export type ProductAdapterResponse = z.infer<
  typeof ProductAdapterResponseSchema
>;
