/**
 * FSTS AI Hub — Cost optimization contracts.
 *
 * AI cost optimization is a primary AI Hub responsibility. These contracts
 * support measurement, governance, forecasting, and active cost reduction
 * across every FSTS-owned system and authorized client environment.
 *
 * Operating priority order (highest first):
 *   1. Security
 *   2. Legal and compliance requirements
 *   3. Data classification and residency
 *   4. Required model capability
 *   5. Output quality
 *   6. Reliability and availability
 *   7. Latency requirements
 *   8. Cost optimization
 *
 * Cost optimization must NEVER override items 1-7.
 *
 * Owner: Full Stack Tech & Solutions LLC
 */

import { z } from "zod";
import {
  ContractVersionSchema,
  DataClassificationSchema,
  DataRegionSchema,
  IdSchema,
  RiskLevelSchema,
  SystemOwnershipSchema,
  TimestampSchema,
} from "./primitives.js";

export const COST_CONTRACT_VERSION = "v1" as const;

/** Configurable routing tiers — never hardcode specific model names. */
export const RoutingTierSchema = z.enum([
  "tier_1_deterministic",
  "tier_2_small",
  "tier_3_standard",
  "tier_4_advanced",
  "tier_5_specialized",
]);
export type RoutingTier = z.infer<typeof RoutingTierSchema>;

/** Reason a routing decision was made. */
export const RoutingReasonSchema = z.enum([
  "deterministic_no_llm",
  "capability_match",
  "cost_optimized",
  "quality_floor",
  "compliance_required",
  "residency_required",
  "fallback_provider",
  "budget_threshold",
  "cache_hit",
  "no_compliant_provider",
  "approval_required",
]);
export type RoutingReason = z.infer<typeof RoutingReasonSchema>;

/** Budget period. */
export const BudgetPeriodSchema = z.enum([
  "per_request",
  "daily",
  "weekly",
  "monthly",
  "emergency",
]);
export type BudgetPeriod = z.infer<typeof BudgetPeriodSchema>;

/** Budget scope. */
export const BudgetScopeSchema = z.enum([
  "organization",
  "tenant",
  "customer",
  "system",
  "agent",
  "workflow",
  "feature",
  "user",
]);
export type BudgetScope = z.infer<typeof BudgetScopeSchema>;

/** Action taken when a budget limit is reached. */
export const BudgetActionSchema = z.enum([
  "warn",
  "throttle",
  "route_cheaper",
  "reduce_scope",
  "require_approval",
  "queue",
  "suspend_agent",
  "block",
]);
export type BudgetAction = z.infer<typeof BudgetActionSchema>;

/**
 * AiUsageRecord — normalized AI usage for a single execution.
 * Does NOT store unrestricted prompts, responses, secrets, or sensitive
 * customer content.
 */
export const AiUsageRecordSchema = z.object({
  contractVersion: ContractVersionSchema,
  id: IdSchema,
  organizationId: IdSchema,
  tenantId: IdSchema,
  customerId: IdSchema.optional(),
  connectedSystemId: IdSchema,
  systemOwnership: SystemOwnershipSchema,
  environmentId: IdSchema,
  aiIdentityId: IdSchema,
  agentId: IdSchema,
  agentVersionId: IdSchema,
  workflowId: IdSchema.optional(),
  workflowVersionId: IdSchema.optional(),
  promptId: IdSchema.optional(),
  promptVersionId: IdSchema.optional(),
  providerId: IdSchema,
  modelId: IdSchema,
  routingTier: RoutingTierSchema,
  routingReason: RoutingReasonSchema,
  inputTokens: z.number().int().nonnegative(),
  outputTokens: z.number().int().nonnegative(),
  cachedInputTokens: z.number().int().nonnegative().default(0),
  cacheHit: z.boolean().default(false),
  embeddingTokens: z.number().int().nonnegative().default(0),
  modalityUsage: z
    .object({
      image: z.number().nonnegative().default(0),
      audio: z.number().nonnegative().default(0),
      video: z.number().nonnegative().default(0),
      other: z.number().nonnegative().default(0),
    })
    .default({ image: 0, audio: 0, video: 0, other: 0 }),
  toolCalls: z.number().int().nonnegative().default(0),
  retrievalOperations: z.number().int().nonnegative().default(0),
  agentIterations: z.number().int().nonnegative().default(0),
  retries: z.number().int().nonnegative().default(0),
  latencyMs: z.number().int().nonnegative(),
  providerReportedUsage: z.record(z.unknown()).optional(),
  correlationId: z.string().min(8).max(128),
  occurredAt: TimestampSchema,
});
export type AiUsageRecord = z.infer<typeof AiUsageRecordSchema>;

/** AiCostRecord — cost attribution for a single execution. */
export const AiCostRecordSchema = z.object({
  contractVersion: ContractVersionSchema,
  id: IdSchema,
  usageRecordId: IdSchema,
  organizationId: IdSchema,
  tenantId: IdSchema,
  customerId: IdSchema.optional(),
  connectedSystemId: IdSchema,
  systemOwnership: SystemOwnershipSchema,
  environmentId: IdSchema,
  aiIdentityId: IdSchema,
  agentId: IdSchema,
  agentVersionId: IdSchema,
  workflowId: IdSchema.optional(),
  providerId: IdSchema,
  modelId: IdSchema,
  routingTier: RoutingTierSchema,
  routingReason: RoutingReasonSchema,
  estimatedCost: z.number().nonnegative(),
  actualBilledCost: z.number().nonnegative().optional(),
  currency: z.string().length(3),
  priceVersionId: IdSchema,
  budgetBeforeExecution: z.number().nonnegative(),
  budgetRemaining: z.number().nonnegative(),
  policyDecisionId: IdSchema.optional(),
  approvalDecisionId: IdSchema.optional(),
  executionStatus: z.enum([
    "success",
    "error",
    "denied",
    "cancelled",
    "pending_approval",
  ]),
  businessOutcome: z.string().max(256).optional(),
  correlationId: z.string().min(8).max(128),
  occurredAt: TimestampSchema,
});
export type AiCostRecord = z.infer<typeof AiCostRecordSchema>;

/**
 * ProviderPriceVersion — versioned provider pricing. Pricing is versioned so
 * historical cost calculations remain reproducible after providers change
 * prices. Historical pricing must never be silently overwritten.
 */
export const ProviderPriceVersionSchema = z.object({
  contractVersion: ContractVersionSchema,
  id: IdSchema,
  providerId: IdSchema,
  modelId: IdSchema,
  version: z.string().min(1).max(64),
  inputPerMillionTokens: z.number().nonnegative(),
  outputPerMillionTokens: z.number().nonnegative(),
  cachedInputPerMillionTokens: z.number().nonnegative().optional(),
  embeddingPerMillionTokens: z.number().nonnegative().optional(),
  modalityPricing: z
    .object({
      imagePerUnit: z.number().nonnegative().optional(),
      audioPerUnit: z.number().nonnegative().optional(),
      videoPerUnit: z.number().nonnegative().optional(),
    })
    .optional(),
  toolOrRequestCharge: z.number().nonnegative().default(0),
  batchPricing: z
    .object({
      inputPerMillionTokens: z.number().nonnegative(),
      outputPerMillionTokens: z.number().nonnegative(),
    })
    .optional(),
  tieredPricing: z
    .array(
      z.object({
        upToTokens: z.number().int().positive(),
        inputPerMillionTokens: z.number().nonnegative(),
        outputPerMillionTokens: z.number().nonnegative(),
      }),
    )
    .max(32)
    .optional(),
  currency: z.string().length(3),
  region: DataRegionSchema,
  effectiveFrom: TimestampSchema,
  effectiveTo: TimestampSchema.optional(),
  source: z.string().min(1).max(256),
  lastVerifiedAt: TimestampSchema,
});
export type ProviderPriceVersion = z.infer<typeof ProviderPriceVersionSchema>;

/** CostAllocation — a computed cost attribution bucket. */
export const CostAllocationSchema = z.object({
  contractVersion: ContractVersionSchema,
  id: IdSchema,
  dimension: z.enum([
    "fsts_system",
    "client_system",
    "tenant",
    "customer",
    "ai_identity",
    "agent",
    "workflow",
    "provider",
    "model",
    "feature",
    "environment",
    "successful_execution",
    "failed_execution",
    "business_outcome",
    "retry_waste",
    "agent_loop_waste",
    "unused_output_waste",
    "cache_miss_waste",
    "excessive_context_waste",
    "excessive_retrieval_waste",
    "provider_error_waste",
  ]),
  dimensionKey: z.string().min(1).max(256),
  systemOwnership: SystemOwnershipSchema,
  amount: z.number().nonnegative(),
  currency: z.string().length(3),
  periodStart: TimestampSchema,
  periodEnd: TimestampSchema,
});
export type CostAllocation = z.infer<typeof CostAllocationSchema>;

/** BudgetPolicy — configurable budget with soft and hard limits. */
export const BudgetPolicySchema = z.object({
  contractVersion: ContractVersionSchema,
  id: IdSchema,
  scope: BudgetScopeSchema,
  scopeKey: IdSchema,
  organizationId: IdSchema,
  tenantId: IdSchema.optional(),
  period: BudgetPeriodSchema,
  currency: z.string().length(3),
  softWarningThreshold: z.number().nonnegative(),
  hardLimit: z.number().nonnegative(),
  perRequestLimit: z.number().nonnegative().optional(),
  onSoftLimit: BudgetActionSchema.default("warn"),
  onHardLimit: BudgetActionSchema.default("block"),
  /** Whether expensive execution requires approval before proceeding. */
  requireApprovalAbove: z.number().nonnegative().optional(),
  enabled: z.boolean().default(true),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});
export type BudgetPolicy = z.infer<typeof BudgetPolicySchema>;

/** BudgetEvaluation — the result of evaluating spend against a budget. */
export const BudgetEvaluationSchema = z.object({
  contractVersion: ContractVersionSchema,
  budgetPolicyId: IdSchema,
  scope: BudgetScopeSchema,
  scopeKey: IdSchema,
  period: BudgetPeriodSchema,
  limit: z.number().nonnegative(),
  spent: z.number().nonnegative(),
  remaining: z.number().nonnegative(),
  projectedSpend: z.number().nonnegative(),
  softLimitReached: z.boolean(),
  hardLimitReached: z.boolean(),
  action: BudgetActionSchema,
  evaluatedAt: TimestampSchema,
});
export type BudgetEvaluation = z.infer<typeof BudgetEvaluationSchema>;

/** RoutingDecision — the outcome of capability/cost-aware routing. */
export const RoutingDecisionSchema = z.object({
  contractVersion: ContractVersionSchema,
  id: IdSchema,
  tenantId: IdSchema,
  connectedSystemId: IdSchema,
  aiIdentityId: IdSchema,
  agentVersionId: IdSchema,
  selectedProviderId: IdSchema.optional(),
  selectedModelId: IdSchema.optional(),
  selectedTier: RoutingTierSchema,
  reason: RoutingReasonSchema,
  /** Ordered list of candidates considered, with rejection reasons. */
  candidates: z
    .array(
      z.object({
        providerId: IdSchema,
        modelId: IdSchema,
        tier: RoutingTierSchema,
        eligible: z.boolean(),
        rejectionReason: z.string().max(512).optional(),
        estimatedCost: z.number().nonnegative().optional(),
      }),
    )
    .max(64),
  /** Whether the request was blocked because no compliant provider exists. */
  blocked: z.boolean().default(false),
  correlationId: z.string().min(8).max(128),
  decidedAt: TimestampSchema,
});
export type RoutingDecision = z.infer<typeof RoutingDecisionSchema>;

/** OptimizationDecision — a cost optimization action taken. */
export const OptimizationDecisionSchema = z.object({
  contractVersion: ContractVersionSchema,
  id: IdSchema,
  tenantId: IdSchema,
  connectedSystemId: IdSchema,
  aiIdentityId: IdSchema,
  action: z.enum([
    "no_change",
    "route_cheaper",
    "compress_context",
    "compress_history",
    "optimize_prompt",
    "semantic_cache",
    "exact_cache",
    "limit_retrieval",
    "limit_embeddings",
    "limit_vector_query",
    "deduplicate",
    "limit_retries",
    "limit_agent_loop",
    "limit_tool_calls",
    "reduce_scope",
    "throttle",
    "queue",
    "require_approval",
    "block",
  ]),
  reason: z.string().min(1).max(1024),
  estimatedSavings: z.number().nonnegative().optional(),
  /** Quality floor that must not be violated by this optimization. */
  qualityFloorId: IdSchema.optional(),
  correlationId: z.string().min(8).max(128),
  decidedAt: TimestampSchema,
});
export type OptimizationDecision = z.infer<typeof OptimizationDecisionSchema>;

/**
 * CacheDecision — whether a cache may be used, with tenant-safe keys.
 * Cache keys must prevent cross-tenant and cross-system leakage.
 */
export const CacheDecisionSchema = z.object({
  contractVersion: ContractVersionSchema,
  id: IdSchema,
  allowed: z.boolean(),
  reason: z.string().min(1).max(1024),
  cacheKey: z.string().min(1).max(512).optional(),
  cacheEntry: z
    .object({
      tenantScope: IdSchema,
      systemScope: IdSchema,
      environmentScope: IdSchema,
      promptVersionId: IdSchema.optional(),
      workflowVersionId: IdSchema.optional(),
      modelOrCompatibilityClass: z.string().min(1).max(128),
      policyVersionId: IdSchema,
      dataClassification: DataClassificationSchema,
      expiresAt: TimestampSchema,
      integrityRef: z.string().min(1).max(256),
    })
    .optional(),
  correlationId: z.string().min(8).max(128),
  decidedAt: TimestampSchema,
});
export type CacheDecision = z.infer<typeof CacheDecisionSchema>;

/** CostAnomaly — a detected cost anomaly. */
export const CostAnomalySchema = z.object({
  contractVersion: ContractVersionSchema,
  id: IdSchema,
  tenantId: IdSchema,
  connectedSystemId: IdSchema.optional(),
  aiIdentityId: IdSchema.optional(),
  type: z.enum([
    "sudden_spike",
    "unexpected_high_cost_model",
    "excessive_agent_loops",
    "excessive_retries",
    "abnormal_token_growth",
    "cache_hit_decline",
    "provider_price_change",
    "provider_billing_mismatch",
    "unattributed_usage",
    "direct_provider_bypass",
    "cost_per_outcome_increase",
    "customer_margin_risk",
    "forecasted_overrun",
  ]),
  severity: z.enum(["info", "low", "medium", "high", "critical"]),
  description: z.string().min(1).max(2048),
  observedValue: z.number(),
  expectedValue: z.number().optional(),
  detectedAt: TimestampSchema,
});
export type CostAnomaly = z.infer<typeof CostAnomalySchema>;

/** CostForecast — a projected spend forecast. */
export const CostForecastSchema = z.object({
  contractVersion: ContractVersionSchema,
  id: IdSchema,
  scope: BudgetScopeSchema,
  scopeKey: IdSchema,
  period: BudgetPeriodSchema,
  currency: z.string().length(3),
  projectedSpend: z.number().nonnegative(),
  confidence: z.number().min(0).max(1),
  basedOnDays: z.number().int().positive(),
  forecastedOverrun: z.boolean(),
  generatedAt: TimestampSchema,
});
export type CostForecast = z.infer<typeof CostForecastSchema>;

/** CostApprovalRequest — approval gate for expensive execution. */
export const CostApprovalRequestSchema = z.object({
  contractVersion: ContractVersionSchema,
  id: IdSchema,
  tenantId: IdSchema,
  connectedSystemId: IdSchema,
  requestingAiIdentityId: IdSchema,
  agentVersionId: IdSchema,
  estimatedCost: z.number().nonnegative(),
  currency: z.string().length(3),
  budgetPolicyId: IdSchema,
  reason: z.string().min(1).max(2048),
  correlationId: z.string().min(8).max(128),
  idempotencyKey: z.string().min(8).max(256),
  requestedAt: TimestampSchema,
});
export type CostApprovalRequest = z.infer<typeof CostApprovalRequestSchema>;

/** CostGuardAlert — a cost guard alert. */
export const CostGuardAlertSchema = z.object({
  contractVersion: ContractVersionSchema,
  id: IdSchema,
  tenantId: IdSchema,
  connectedSystemId: IdSchema.optional(),
  type: z.enum([
    "budget_threshold_reached",
    "sudden_cost_spike",
    "unexpected_high_cost_model_use",
    "excessive_agent_loops",
    "excessive_retries",
    "abnormal_token_growth",
    "cache_hit_decline",
    "provider_price_change",
    "provider_billing_mismatch",
    "unattributed_usage",
    "direct_provider_bypass",
    "cost_per_successful_outcome_increase",
    "customer_margin_risk",
    "forecasted_budget_overrun",
  ]),
  severity: z.enum(["info", "low", "medium", "high", "critical"]),
  message: z.string().min(1).max(2048),
  assigneeIdentityId: IdSchema.optional(),
  acknowledged: z.boolean().default(false),
  correlationId: z.string().min(8).max(128),
  raisedAt: TimestampSchema,
});
export type CostGuardAlert = z.infer<typeof CostGuardAlertSchema>;

/** ProviderBillingReconciliation — estimated vs actual billing comparison. */
export const ProviderBillingReconciliationSchema = z.object({
  contractVersion: ContractVersionSchema,
  id: IdSchema,
  providerId: IdSchema,
  tenantId: IdSchema,
  periodStart: TimestampSchema,
  periodEnd: TimestampSchema,
  currency: z.string().length(3),
  estimatedCost: z.number().nonnegative(),
  actualBilledCost: z.number().nonnegative(),
  variance: z.number(),
  variancePercent: z.number(),
  mismatchDetected: z.boolean(),
  reconciledAt: TimestampSchema,
});
export type ProviderBillingReconciliation = z.infer<
  typeof ProviderBillingReconciliationSchema
>;

/**
 * Model Gateway bypass exception. Connected systems must not bypass the AI Hub
 * by calling model providers directly unless an explicitly documented
 * emergency exception exists.
 */
export const ModelGatewayBypassExceptionSchema = z.object({
  contractVersion: ContractVersionSchema,
  id: IdSchema,
  approvedSystemId: IdSchema,
  approvedProviderId: IdSchema,
  approvedModelId: IdSchema,
  businessReason: z.string().min(1).max(2048),
  policyReference: z.string().min(1).max(256),
  ownerIdentityId: IdSchema,
  startDate: TimestampSchema,
  expirationDate: TimestampSchema,
  spendingLimit: z.number().nonnegative(),
  currency: z.string().length(3),
  auditRequirements: z.array(z.string().min(1).max(256)).max(64),
  revocationControl: z.string().min(1).max(256),
  revoked: z.boolean().default(false),
  createdAt: TimestampSchema,
});
export type ModelGatewayBypassException = z.infer<
  typeof ModelGatewayBypassExceptionSchema
>;

/** Quality floor for a workflow — cost optimization must not degrade these. */
export const QualityFloorSchema = z.object({
  contractVersion: ContractVersionSchema,
  id: IdSchema,
  workflowId: IdSchema,
  workflowVersionId: IdSchema,
  /** Dimensions that must not degrade. */
  protectedDimensions: z
    .array(
      z.enum([
        "safety",
        "legal_accuracy",
        "regulatory_accuracy",
        "security_analysis",
        "evidence_handling",
        "customer_facing_quality",
        "structured_output_validity",
        "tool_selection_accuracy",
      ]),
    )
    .min(1),
  minSuccessRate: z.number().min(0).max(1),
  maxValidationFailureRate: z.number().min(0).max(1),
  maxHumanCorrectionRate: z.number().min(0).max(1),
  maxRetryRate: z.number().min(0).max(1),
  maxEscalationRate: z.number().min(0).max(1),
  createdAt: TimestampSchema,
});
export type QualityFloor = z.infer<typeof QualityFloorSchema>;

/** Risk level re-export helper for cost approvals. */
export const CostRiskLevelSchema = RiskLevelSchema;
