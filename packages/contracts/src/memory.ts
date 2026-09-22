/**
 * FSTS AI Hub — Memory scopes, knowledge sources, RAG collections, and vector
 * store references.
 *
 * Owner: Full Stack Tech & Solutions LLC
 */

import { z } from "zod";
import {
  ContractVersionSchema,
  DataClassificationSchema,
  IdSchema,
  LifecycleStatusSchema,
  RetentionPolicySchema,
  TimestampSchema,
} from "./primitives.js";

export const MEMORY_CONTRACT_VERSION = "v1" as const;

/**
 * A memory scope is an isolation boundary for AI memory. Memory is scoped by
 * tenant, system, and agent. Cross-scope access is denied by default.
 */
export const MemoryScopeSchema = z.object({
  contractVersion: ContractVersionSchema,
  id: IdSchema,
  tenantId: IdSchema,
  connectedSystemId: IdSchema,
  aiIdentityId: IdSchema,
  name: z.string().min(1).max(128),
  dataClassification: DataClassificationSchema,
  retentionPolicy: RetentionPolicySchema,
  /** Whether reads are permitted within the scope. */
  readEnabled: z.boolean(),
  /** Whether writes are permitted within the scope. */
  writeEnabled: z.boolean(),
  deletionState: z.enum(["active", "pending_deletion", "deleted"]),
  status: LifecycleStatusSchema,
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});
export type MemoryScope = z.infer<typeof MemoryScopeSchema>;

/** A knowledge source feeding RAG collections. */
export const KnowledgeSourceSchema = z.object({
  contractVersion: ContractVersionSchema,
  id: IdSchema,
  tenantId: IdSchema,
  connectedSystemId: IdSchema,
  name: z.string().min(1).max(128),
  dataClassification: DataClassificationSchema,
  retentionPolicy: RetentionPolicySchema,
  status: LifecycleStatusSchema,
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});
export type KnowledgeSource = z.infer<typeof KnowledgeSourceSchema>;

/** A RAG collection backed by a vector store. */
export const RagCollectionSchema = z.object({
  contractVersion: ContractVersionSchema,
  id: IdSchema,
  tenantId: IdSchema,
  knowledgeSourceId: IdSchema,
  name: z.string().min(1).max(128),
  vectorStoreRef: z.string().min(1).max(256),
  embeddingModelId: IdSchema,
  dataClassification: DataClassificationSchema,
  retentionPolicy: RetentionPolicySchema,
  status: LifecycleStatusSchema,
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});
export type RagCollection = z.infer<typeof RagCollectionSchema>;

/** A vector store reference (the store itself is owned elsewhere). */
export const VectorStoreRefSchema = z.object({
  contractVersion: ContractVersionSchema,
  ref: z.string().min(1).max(256),
  provider: z.string().min(1).max(64),
  dataRegion: z.string().min(1).max(32),
  dataClassification: DataClassificationSchema,
});
export type VectorStoreRef = z.infer<typeof VectorStoreRefSchema>;

/**
 * A memory access request. Evaluated against scope boundaries before any read
 * or write. Cross-tenant, cross-system, and cross-agent access is denied by
 * default.
 */
export const MemoryAccessRequestSchema = z.object({
  contractVersion: ContractVersionSchema,
  tenantId: IdSchema,
  connectedSystemId: IdSchema,
  aiIdentityId: IdSchema,
  memoryScopeId: IdSchema,
  operation: z.enum(["read", "write", "delete"]),
  correlationId: z.string().min(8).max(128),
  requestedAt: TimestampSchema,
});
export type MemoryAccessRequest = z.infer<typeof MemoryAccessRequestSchema>;
