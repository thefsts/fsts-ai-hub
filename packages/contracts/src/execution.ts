/**
 * FSTS AI Hub — Execution requests, plans, results, and related records.
 *
 * Owner: Full Stack Tech & Solutions LLC
 */

import { z } from "zod";
import {
  ContractVersionSchema,
  ContractErrorSchema,
  DataClassificationSchema,
  DecisionOutcomeSchema,
  ExecutionContextSchema,
  IdSchema,
  TimestampSchema,
} from "./primitives.js";

export const EXECUTION_CONTRACT_VERSION = "v1" as const;

/** An execution request submitted by a product system adapter. */
export const ExecutionRequestSchema = z.object({
  contractVersion: ContractVersionSchema,
  context: ExecutionContextSchema,
  /** The intent or task to execute. */
  intent: z.string().min(1).max(4096),
  /** Optional structured input. */
  input: z.record(z.unknown()).optional(),
  /** Whether streaming output is requested. */
  stream: z.boolean().default(false),
  /** Requested timeout in milliseconds. */
  timeoutMs: z.number().int().positive().max(600000).default(60000),
  requestedAt: TimestampSchema,
});
export type ExecutionRequest = z.infer<typeof ExecutionRequestSchema>;

/** A single step in an execution plan. */
export const ExecutionPlanStepSchema = z.object({
  stepId: IdSchema,
  kind: z.enum(["model_call", "tool_call", "approval", "memory_access"]),
  targetId: IdSchema,
  dependsOn: z.array(IdSchema).max(64).default([]),
});
export type ExecutionPlanStep = z.infer<typeof ExecutionPlanStepSchema>;

/** An execution plan produced by the orchestration service. */
export const ExecutionPlanSchema = z.object({
  contractVersion: ContractVersionSchema,
  id: IdSchema,
  requestCorrelationId: z.string().min(8).max(128),
  steps: z.array(ExecutionPlanStepSchema).max(512),
  createdAt: TimestampSchema,
});
export type ExecutionPlan = z.infer<typeof ExecutionPlanSchema>;

/** A model call record. */
export const ModelCallSchema = z.object({
  contractVersion: ContractVersionSchema,
  id: IdSchema,
  executionId: IdSchema,
  providerId: IdSchema,
  modelId: IdSchema,
  inputTokens: z.number().int().nonnegative(),
  outputTokens: z.number().int().nonnegative(),
  latencyMs: z.number().int().nonnegative(),
  outcome: z.enum(["success", "error", "timeout", "cancelled"]),
  correlationId: z.string().min(8).max(128),
  occurredAt: TimestampSchema,
});
export type ModelCall = z.infer<typeof ModelCallSchema>;

/** A tool call record. */
export const ToolCallSchema = z.object({
  contractVersion: ContractVersionSchema,
  id: IdSchema,
  executionId: IdSchema,
  toolId: IdSchema,
  /** Hash of the validated arguments (not the raw arguments). */
  argumentsHash: z.string().regex(/^[a-f0-9]{64}$/),
  outcome: z.enum(["success", "error", "denied", "timeout", "cancelled"]),
  correlationId: z.string().min(8).max(128),
  occurredAt: TimestampSchema,
});
export type ToolCall = z.infer<typeof ToolCallSchema>;

/** An execution result returned to the product system. */
export const ExecutionResultSchema = z.object({
  contractVersion: ContractVersionSchema,
  executionId: IdSchema,
  requestCorrelationId: z.string().min(8).max(128),
  outcome: z.enum([
    "success",
    "error",
    "denied",
    "cancelled",
    "pending_approval",
  ]),
  output: z.record(z.unknown()).optional(),
  error: ContractErrorSchema.optional(),
  dataClassification: DataClassificationSchema,
  completedAt: TimestampSchema,
});
export type ExecutionResult = z.infer<typeof ExecutionResultSchema>;

/** A retry record. */
export const RetryRecordSchema = z.object({
  contractVersion: ContractVersionSchema,
  id: IdSchema,
  executionId: IdSchema,
  attempt: z.number().int().positive(),
  reason: z.string().min(1).max(1024),
  occurredAt: TimestampSchema,
});
export type RetryRecord = z.infer<typeof RetryRecordSchema>;

/** A cancellation record. */
export const CancellationRecordSchema = z.object({
  contractVersion: ContractVersionSchema,
  id: IdSchema,
  executionId: IdSchema,
  requestedBy: IdSchema,
  reason: z.string().min(1).max(1024),
  occurredAt: TimestampSchema,
});
export type CancellationRecord = z.infer<typeof CancellationRecordSchema>;

/** A policy decision record. */
export const PolicyDecisionSchema = z.object({
  contractVersion: ContractVersionSchema,
  id: IdSchema,
  requestCorrelationId: z.string().min(8).max(128),
  outcome: DecisionOutcomeSchema,
  policyVersionId: IdSchema,
  reason: z.string().min(1).max(2048),
  /** Obligations the caller must satisfy (e.g. redaction, approval). */
  obligations: z.array(z.string().min(1).max(256)).max(64).default([]),
  decidedAt: TimestampSchema,
});
export type PolicyDecision = z.infer<typeof PolicyDecisionSchema>;
