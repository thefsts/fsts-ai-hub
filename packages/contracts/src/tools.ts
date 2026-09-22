/**
 * FSTS AI Hub — Tools, MCP servers, API operations, and permissions.
 *
 * Owner: Full Stack Tech & Solutions LLC
 */

import { z } from "zod";
import {
  ContractVersionSchema,
  DataClassificationSchema,
  IdSchema,
  LifecycleStatusSchema,
  RiskLevelSchema,
  TimestampSchema,
} from "./primitives.js";

export const TOOLS_CONTRACT_VERSION = "v1" as const;

/** The kind of tool. */
export const ToolKindSchema = z.enum([
  "mcp_tool",
  "api_operation",
  "internal_function",
  "human_task",
]);
export type ToolKind = z.infer<typeof ToolKindSchema>;

/** A tool that an AI may invoke, subject to authorization. */
export const ToolSchema = z.object({
  contractVersion: ContractVersionSchema,
  id: IdSchema,
  name: z.string().min(1).max(128),
  kind: ToolKindSchema,
  description: z.string().max(2048).optional(),
  /** Data classification of the data this tool can access. */
  dataClassification: DataClassificationSchema,
  riskLevel: RiskLevelSchema,
  /** Whether invoking this tool requires human approval. */
  requiresApproval: z.boolean(),
  /** Credential reference owned by the API Hub — never the value. */
  credentialRef: z.string().min(1).max(256).optional(),
  status: LifecycleStatusSchema,
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});
export type Tool = z.infer<typeof ToolSchema>;

/** An MCP server exposing one or more MCP tools. */
export const McpServerSchema = z.object({
  contractVersion: ContractVersionSchema,
  id: IdSchema,
  name: z.string().min(1).max(128),
  endpointRef: z.string().min(1).max(256),
  /** Credential reference owned by the API Hub — never the value. */
  credentialRef: z.string().min(1).max(256).optional(),
  approved: z.boolean(),
  status: LifecycleStatusSchema,
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});
export type McpServer = z.infer<typeof McpServerSchema>;

/** An MCP tool exposed by an MCP server. */
export const McpToolSchema = z.object({
  contractVersion: ContractVersionSchema,
  id: IdSchema,
  mcpServerId: IdSchema,
  name: z.string().min(1).max(128),
  /** JSON-schema-like description of accepted arguments. */
  inputSchema: z.record(z.unknown()),
  riskLevel: RiskLevelSchema,
  requiresApproval: z.boolean(),
  status: LifecycleStatusSchema,
});
export type McpTool = z.infer<typeof McpToolSchema>;

/** An API operation exposed through the API Hub. */
export const ApiOperationSchema = z.object({
  contractVersion: ContractVersionSchema,
  id: IdSchema,
  apiHubOperationId: IdSchema,
  name: z.string().min(1).max(128),
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
  pathTemplate: z.string().min(1).max(512),
  dataClassification: DataClassificationSchema,
  riskLevel: RiskLevelSchema,
  requiresApproval: z.boolean(),
  status: LifecycleStatusSchema,
});
export type ApiOperation = z.infer<typeof ApiOperationSchema>;

/** A permission grant binding an agent to a tool. */
export const PermissionSchema = z.object({
  contractVersion: ContractVersionSchema,
  id: IdSchema,
  tenantId: IdSchema,
  toolId: IdSchema,
  /** The agent version this permission applies to. */
  agentVersionId: IdSchema,
  /** The system this permission is scoped to. */
  connectedSystemId: IdSchema,
  allowed: z.boolean(),
  requiresApproval: z.boolean(),
  /** Optional expiry for the grant. */
  expiresAt: TimestampSchema.optional(),
  createdAt: TimestampSchema,
});
export type Permission = z.infer<typeof PermissionSchema>;

/**
 * Tool authorization request — evaluated by the policy engine before any tool
 * invocation. Deny by default.
 */
export const ToolAuthorizationRequestSchema = z.object({
  contractVersion: ContractVersionSchema,
  tenantId: IdSchema,
  organizationId: IdSchema,
  environmentId: IdSchema,
  connectedSystemId: IdSchema,
  aiIdentityId: IdSchema,
  agentVersionId: IdSchema,
  toolId: IdSchema,
  /** Validated tool arguments (schema-checked before execution). */
  arguments: z.record(z.unknown()),
  dataClassification: DataClassificationSchema,
  correlationId: z.string().min(8).max(128),
  idempotencyKey: z.string().min(8).max(256).optional(),
  requestedAt: TimestampSchema,
});
export type ToolAuthorizationRequest = z.infer<
  typeof ToolAuthorizationRequestSchema
>;

/** Tool authorization decision. */
export const ToolAuthorizationDecisionSchema = z.object({
  contractVersion: ContractVersionSchema,
  requestCorrelationId: z.string().min(8).max(128),
  allowed: z.boolean(),
  requiresApproval: z.boolean(),
  reason: z.string().min(1).max(1024),
  policyVersionId: IdSchema,
  decidedAt: TimestampSchema,
});
export type ToolAuthorizationDecision = z.infer<
  typeof ToolAuthorizationDecisionSchema
>;
