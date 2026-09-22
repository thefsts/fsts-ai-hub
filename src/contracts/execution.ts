import { z } from "zod";

export const ownershipKindSchema = z.enum(["fsts_owned", "client_owned", "partner_owned"]);
export const environmentSchema = z.enum(["development", "staging", "production"]);

export const executionAuthorizationRequestSchema = z
  .object({
    contractVersion: z.literal("1.0"),
    organizationKey: z.string().min(1).max(128),
    tenantKey: z.string().min(1).max(128),
    connectedSystemKey: z.string().min(1).max(128),
    ownershipKind: ownershipKindSchema,
    environment: environmentSchema,
    aiIdentityKey: z.string().min(1).max(128),
    agentVersion: z.string().min(1).max(64),
    workflowKey: z.string().min(1).max(128).optional(),
    requestedCapability: z.string().min(1).max(128),
    dataClassification: z.enum(["public", "internal", "confidential", "restricted"]),
    maximumCostMicros: z.number().int().nonnegative(),
    currency: z.string().length(3).transform((value) => value.toUpperCase()),
    correlationId: z.string().uuid(),
    idempotencyKey: z.string().min(16).max(256),
    requestedAt: z.number().int().nonnegative(),
  })
  .strict();

export type ExecutionAuthorizationRequest = z.infer<typeof executionAuthorizationRequestSchema>;

export const executionAuthorizationDecisionSchema = z
  .object({
    contractVersion: z.literal("1.0"),
    decision: z.enum(["allow", "deny", "require_approval"]),
    reasonCode: z.string().min(1).max(128),
    policyVersion: z.string().min(1).max(128),
    approvedProviderKeys: z.array(z.string().min(1).max(128)),
    approvedModelKeys: z.array(z.string().min(1).max(128)),
    effectiveMaximumCostMicros: z.number().int().nonnegative(),
    correlationId: z.string().uuid(),
    expiresAt: z.number().int().nonnegative(),
  })
  .strict();

export type ExecutionAuthorizationDecision = z.infer<typeof executionAuthorizationDecisionSchema>;
