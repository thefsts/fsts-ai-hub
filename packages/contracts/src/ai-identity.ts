/**
 * FSTS AI Hub — AI identities, agents, and service identities.
 *
 * Owner: Full Stack Tech & Solutions LLC
 */

import { z } from "zod";
import {
  ContractVersionSchema,
  EnvironmentKindSchema,
  IdSchema,
  LifecycleStatusSchema,
  TimestampSchema,
} from "./primitives.js";

export const AI_IDENTITY_CONTRACT_VERSION = "v1" as const;

/** The kind of AI identity. */
export const AiIdentityKindSchema = z.enum([
  "conversational_assistant",
  "backend_worker",
  "autonomous_agent",
  "semi_autonomous_agent",
  "service_identity",
]);
export type AiIdentityKind = z.infer<typeof AiIdentityKindSchema>;

/**
 * An AI identity is a named, governed AI operating within FSTS systems.
 * Examples include Leone, Daunte, MILAN, JOY, ROSE, and future identities.
 *
 * Identities do NOT share permissions, tools, memory, data, or system access
 * by default. Each is independently governed.
 */
export const AiIdentitySchema = z.object({
  contractVersion: ContractVersionSchema,
  id: IdSchema,
  tenantId: IdSchema,
  organizationId: IdSchema,
  name: z.string().min(1).max(128),
  kind: AiIdentityKindSchema,
  ownerIdentityId: IdSchema,
  /** Systems this identity is assigned to. */
  systemAssignments: z.array(IdSchema).max(256),
  /** Environments this identity may operate in. */
  allowedEnvironments: z.array(EnvironmentKindSchema).min(1),
  status: LifecycleStatusSchema,
  suspensionReason: z.string().max(1024).optional(),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});
export type AiIdentity = z.infer<typeof AiIdentitySchema>;

/** An agent is a versioned, executable AI identity configuration. */
export const AgentSchema = z.object({
  contractVersion: ContractVersionSchema,
  id: IdSchema,
  aiIdentityId: IdSchema,
  tenantId: IdSchema,
  name: z.string().min(1).max(128),
  description: z.string().max(2048).optional(),
  currentVersionId: IdSchema,
  status: LifecycleStatusSchema,
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});
export type Agent = z.infer<typeof AgentSchema>;

/**
 * An agent version is an immutable snapshot of an agent's configuration.
 * Changing an agent produces a new version; versions are never mutated.
 */
export const AgentVersionSchema = z.object({
  contractVersion: ContractVersionSchema,
  id: IdSchema,
  agentId: IdSchema,
  version: z.string().min(1).max(64),
  /** Allowed model IDs for this version. */
  allowedModels: z.array(IdSchema).max(256),
  /** Allowed tool IDs for this version. */
  allowedTools: z.array(IdSchema).max(1024),
  /** Allowed provider IDs for this version. */
  allowedProviders: z.array(IdSchema).max(256),
  /** Memory scope IDs this version may access. */
  memoryScopes: z.array(IdSchema).max(256),
  /** Whether this version requires human approval for restricted actions. */
  requiresApprovalForRestricted: z.boolean(),
  status: LifecycleStatusSchema,
  createdAt: TimestampSchema,
});
export type AgentVersion = z.infer<typeof AgentVersionSchema>;

/** A conversational assistant profile. */
export const AssistantProfileSchema = z.object({
  contractVersion: ContractVersionSchema,
  aiIdentityId: IdSchema,
  displayName: z.string().min(1).max(128),
  defaultPromptVersionId: IdSchema,
  streamingEnabled: z.boolean(),
  maxTurns: z.number().int().positive().max(1000),
});
export type AssistantProfile = z.infer<typeof AssistantProfileSchema>;

/** A backend worker profile. */
export const BackendWorkerProfileSchema = z.object({
  contractVersion: ContractVersionSchema,
  aiIdentityId: IdSchema,
  queueName: z.string().min(1).max(128),
  maxConcurrency: z.number().int().positive().max(1000),
  timeoutSeconds: z.number().int().positive().max(86400),
});
export type BackendWorkerProfile = z.infer<typeof BackendWorkerProfileSchema>;

/** A service identity used for service-to-service authentication. */
export const ServiceIdentitySchema = z.object({
  contractVersion: ContractVersionSchema,
  id: IdSchema,
  tenantId: IdSchema,
  name: z.string().min(1).max(128),
  /** Credential reference — never the credential value. */
  credentialRef: z.string().min(1).max(256),
  scopes: z.array(z.string().min(1).max(128)).max(256),
  status: LifecycleStatusSchema,
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});
export type ServiceIdentity = z.infer<typeof ServiceIdentitySchema>;

/** AI identity registration request. */
export const AiIdentityRegistrationSchema = z.object({
  contractVersion: ContractVersionSchema,
  tenantId: IdSchema,
  organizationId: IdSchema,
  name: z.string().min(1).max(128),
  kind: AiIdentityKindSchema,
  ownerIdentityId: IdSchema,
  systemAssignments: z.array(IdSchema).max(256),
  allowedEnvironments: z.array(EnvironmentKindSchema).min(1),
  correlationId: z.string().min(8).max(128),
  idempotencyKey: z.string().min(8).max(256),
  requestedAt: TimestampSchema,
});
export type AiIdentityRegistration = z.infer<
  typeof AiIdentityRegistrationSchema
>;
