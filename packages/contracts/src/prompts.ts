/**
 * FSTS AI Hub — Prompts, prompt versions, workflows, and evaluations.
 *
 * Owner: Full Stack Tech & Solutions LLC
 */

import { z } from "zod";
import {
  ContractVersionSchema,
  IdSchema,
  LifecycleStatusSchema,
  TimestampSchema,
} from "./primitives.js";

export const PROMPTS_CONTRACT_VERSION = "v1" as const;

/** A prompt is a named, versioned instruction set. */
export const PromptSchema = z.object({
  contractVersion: ContractVersionSchema,
  id: IdSchema,
  tenantId: IdSchema,
  name: z.string().min(1).max(128),
  description: z.string().max(2048).optional(),
  currentVersionId: IdSchema,
  status: LifecycleStatusSchema,
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});
export type Prompt = z.infer<typeof PromptSchema>;

/**
 * A prompt version is an immutable snapshot. The system instruction is stored
 * as a content hash plus a protected reference — production prompts containing
 * sensitive information must never be committed to this public repository.
 */
export const PromptVersionSchema = z.object({
  contractVersion: ContractVersionSchema,
  id: IdSchema,
  promptId: IdSchema,
  version: z.string().min(1).max(64),
  /** SHA-256 hash of the system instruction content. */
  systemInstructionHash: z.string().regex(/^[a-f0-9]{64}$/),
  /** Protected reference to the instruction content (not the content itself). */
  systemInstructionRef: z.string().min(1).max(256),
  approvalState: z.enum(["draft", "pending", "approved", "rejected"]),
  rollbackVersionId: IdSchema.optional(),
  createdAt: TimestampSchema,
});
export type PromptVersion = z.infer<typeof PromptVersionSchema>;

/** A workflow is a named, versioned orchestration of steps. */
export const WorkflowSchema = z.object({
  contractVersion: ContractVersionSchema,
  id: IdSchema,
  tenantId: IdSchema,
  name: z.string().min(1).max(128),
  currentVersionId: IdSchema,
  status: LifecycleStatusSchema,
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});
export type Workflow = z.infer<typeof WorkflowSchema>;

/** A workflow version is an immutable snapshot of a workflow definition. */
export const WorkflowVersionSchema = z.object({
  contractVersion: ContractVersionSchema,
  id: IdSchema,
  workflowId: IdSchema,
  version: z.string().min(1).max(64),
  /** Ordered step references. */
  steps: z.array(IdSchema).max(512),
  approvalState: z.enum(["draft", "pending", "approved", "rejected"]),
  rollbackVersionId: IdSchema.optional(),
  createdAt: TimestampSchema,
});
export type WorkflowVersion = z.infer<typeof WorkflowVersionSchema>;

/** An evaluation result for a prompt or workflow version. */
export const EvaluationResultSchema = z.object({
  contractVersion: ContractVersionSchema,
  id: IdSchema,
  subjectType: z.enum(["prompt_version", "workflow_version", "agent_version"]),
  subjectId: IdSchema,
  evaluator: z.string().min(1).max(128),
  score: z.number().min(0).max(1),
  passed: z.boolean(),
  notes: z.string().max(4096).optional(),
  evaluatedAt: TimestampSchema,
});
export type EvaluationResult = z.infer<typeof EvaluationResultSchema>;
