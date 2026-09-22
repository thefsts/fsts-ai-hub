/**
 * FSTS AI Hub — Model providers, models, capabilities, and cost definitions.
 *
 * Owner: Full Stack Tech & Solutions LLC
 */

import { z } from "zod";
import {
  ContractVersionSchema,
  DataClassificationSchema,
  DataRegionSchema,
  IdSchema,
  LifecycleStatusSchema,
  TimestampSchema,
} from "./primitives.js";

export const MODELS_CONTRACT_VERSION = "v1" as const;

/** A model provider (e.g. a vendor or self-hosted inference endpoint). */
export const ModelProviderSchema = z.object({
  contractVersion: ContractVersionSchema,
  id: IdSchema,
  name: z.string().min(1).max(128),
  /** Credential reference owned by the API Hub — never the value. */
  credentialRef: z.string().min(1).max(256),
  dataRegion: DataRegionSchema,
  /** Highest data classification this provider is approved to handle. */
  maxDataClassification: DataClassificationSchema,
  /** Whether the provider is approved for use at all. */
  approved: z.boolean(),
  healthStatus: z.enum(["healthy", "degraded", "unavailable", "unknown"]),
  status: LifecycleStatusSchema,
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});
export type ModelProvider = z.infer<typeof ModelProviderSchema>;

/** A model offered by a provider. */
export const ModelSchema = z.object({
  contractVersion: ContractVersionSchema,
  id: IdSchema,
  providerId: IdSchema,
  name: z.string().min(1).max(128),
  /** Capabilities this model supports. */
  capabilities: z.array(IdSchema).max(128),
  /** Approved uses (free-form governed tags). */
  approvedUses: z.array(z.string().min(1).max(128)).max(128),
  /** Explicitly restricted uses. */
  restrictedUses: z.array(z.string().min(1).max(128)).max(128),
  dataHandlingClassification: DataClassificationSchema,
  dataRegion: DataRegionSchema,
  costDefinitionId: IdSchema,
  fallbackPolicyId: IdSchema.optional(),
  healthStatus: z.enum(["healthy", "degraded", "unavailable", "unknown"]),
  status: LifecycleStatusSchema,
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});
export type Model = z.infer<typeof ModelSchema>;

/** A model capability (e.g. text, vision, tool-use, streaming). */
export const ModelCapabilitySchema = z.object({
  contractVersion: ContractVersionSchema,
  id: IdSchema,
  name: z.string().min(1).max(64),
  description: z.string().max(1024).optional(),
});
export type ModelCapability = z.infer<typeof ModelCapabilitySchema>;

/** A cost definition for a model (per-unit pricing). */
export const CostDefinitionSchema = z.object({
  contractVersion: ContractVersionSchema,
  id: IdSchema,
  modelId: IdSchema,
  currency: z.string().length(3),
  inputPerMillionTokens: z.number().nonnegative(),
  outputPerMillionTokens: z.number().nonnegative(),
  /** Optional per-request fixed cost. */
  perRequest: z.number().nonnegative().default(0),
  effectiveFrom: TimestampSchema,
});
export type CostDefinition = z.infer<typeof CostDefinitionSchema>;

/** A fallback policy defining explicit, ordered fallback behavior. */
export const FallbackPolicySchema = z.object({
  contractVersion: ContractVersionSchema,
  id: IdSchema,
  /** Ordered list of model IDs to try, in order. */
  fallbackOrder: z.array(IdSchema).max(64),
  /** Whether fallback may cross providers. */
  allowCrossProvider: z.boolean(),
  /** Whether fallback may cross data regions. */
  allowCrossRegion: z.boolean().default(false),
  maxAttempts: z.number().int().positive().max(16),
});
export type FallbackPolicy = z.infer<typeof FallbackPolicySchema>;
