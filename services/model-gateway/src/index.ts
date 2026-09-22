/**
 * FSTS AI Hub — Model Gateway.
 *
 * The Model Gateway is the MANDATORY boundary for every model call. No service
 * may call a model provider directly. The gateway:
 *   - Enforces the approved-provider and approved-model registry.
 *   - Applies the mandatory operating priority order via the cost-optimization
 *     router (security > compliance > classification > capability > quality >
 *     reliability > latency > cost).
 *   - Normalizes errors and outcomes across providers.
 *   - Accounts for tokens and cost.
 *   - Supports cancellation, timeouts, and safe retry.
 *   - Never silently routes to an unapproved provider or model.
 *
 * Direct provider bypass is a policy violation and is detected and reported.
 *
 * Owner: Full Stack Tech & Solutions LLC
 */

import type {
  DataClassification,
  DataRegion,
  RoutingTier,
} from "@fsts/contracts";
import {
  routeRequest,
  type RoutingCandidate,
  type RoutingResult,
} from "@fsts/cost-optimization";

/** A registered, approved provider/model pair. */
export interface ApprovedModel {
  providerId: string;
  modelId: string;
  tier: RoutingTier;
  /** Capabilities this model supports. */
  capabilities: string[];
  /** Data classifications this model is approved to process. */
  approvedClassifications: DataClassification[];
  /** Regions where this model may process data. */
  approvedRegions: DataRegion[];
  /** Whether the provider is currently healthy. */
  healthy: boolean;
  /** Whether the provider is currently suspended. */
  suspended: boolean;
  /** Estimated cost for the request (provider-neutral units). */
  estimatedCost: number;
  /** Estimated latency in ms. */
  estimatedLatencyMs: number;
  /** Quality score 0..1 used against quality floors. */
  qualityScore: number;
}

export interface ModelGatewayRequest {
  requiredCapability: string;
  dataClassification: DataClassification;
  requiredRegion: DataRegion;
  maxLatencyMs?: number;
  qualityFloor?: number;
  deterministicPossible: boolean;
  cacheAvailable: boolean;
  budgetRequiresCheaper: boolean;
}

export interface ModelGatewayDecision {
  allowed: boolean;
  routing: RoutingResult;
  /** The selected approved model, when routing succeeded. */
  selected?: ApprovedModel;
  reason: string;
}

/**
 * Build routing candidates from the approved registry. Only registered models
 * become candidates; unregistered models are never considered.
 */
function buildCandidates(
  registry: ApprovedModel[],
  request: ModelGatewayRequest,
): RoutingCandidate[] {
  return registry.map((m) => ({
    providerId: m.providerId,
    modelId: m.modelId,
    tier: m.tier,
    approved: true,
    compliantForClassification: m.approvedClassifications.includes(
      request.dataClassification,
    ),
    residencySatisfied: m.approvedRegions.includes(request.requiredRegion),
    capabilityMatch: m.capabilities.includes(request.requiredCapability),
    meetsQualityFloor:
      request.qualityFloor === undefined ||
      m.qualityScore >= request.qualityFloor,
    healthy: m.healthy,
    meetsLatency:
      request.maxLatencyMs === undefined ||
      m.estimatedLatencyMs <= request.maxLatencyMs,
    estimatedCost: m.estimatedCost,
    suspended: m.suspended,
  }));
}

/**
 * Decide how to route a model request. Fails closed: if no approved, compliant,
 * capable model is available, the request is blocked rather than routed to an
 * unapproved provider.
 */
export function decideModelRoute(
  request: ModelGatewayRequest,
  registry: ApprovedModel[],
): ModelGatewayDecision {
  const candidates = buildCandidates(registry, request);
  const routing = routeRequest(
    {
      requiredCapability: request.requiredCapability,
      dataClassification: request.dataClassification,
      requiredRegion: request.requiredRegion,
      ...(request.maxLatencyMs !== undefined
        ? { maxLatencyMs: request.maxLatencyMs }
        : {}),
      deterministicPossible: request.deterministicPossible,
      cacheAvailable: request.cacheAvailable,
      budgetRequiresCheaper: request.budgetRequiresCheaper,
    },
    candidates,
  );

  if (routing.blocked) {
    return {
      allowed: false,
      routing,
      reason: "no approved, compliant, capable model available",
    };
  }

  if (routing.selectedProviderId && routing.selectedModelId) {
    const selected = registry.find(
      (m) =>
        m.providerId === routing.selectedProviderId &&
        m.modelId === routing.selectedModelId,
    );
    return {
      allowed: true,
      routing,
      ...(selected ? { selected } : {}),
      reason: routing.reason,
    };
  }

  // Deterministic or cache path — no model call required.
  return { allowed: true, routing, reason: routing.reason };
}

/**
 * Detect a direct provider bypass: a model call that did not pass through the
 * gateway. Any such call is a policy violation.
 */
export interface ModelCallProvenance {
  gatewayDecisionId?: string;
  providerId: string;
  modelId: string;
}

export function detectModelGatewayBypass(provenance: ModelCallProvenance): {
  bypass: boolean;
  reason: string;
} {
  if (!provenance.gatewayDecisionId) {
    return {
      bypass: true,
      reason:
        "model call has no gateway decision; direct provider access is prohibited",
    };
  }
  return { bypass: false, reason: "routed through model gateway" };
}

/** Normalized provider error codes. */
export type NormalizedModelError =
  | "rate_limited"
  | "timeout"
  | "provider_error"
  | "content_filtered"
  | "invalid_request"
  | "cancelled"
  | "unknown";

export function normalizeProviderError(
  statusCode: number | undefined,
): NormalizedModelError {
  if (statusCode === undefined) return "unknown";
  if (statusCode === 429) return "rate_limited";
  if (statusCode === 408 || statusCode === 504) return "timeout";
  if (statusCode === 400 || statusCode === 422) return "invalid_request";
  if (statusCode === 451) return "content_filtered";
  if (statusCode >= 500) return "provider_error";
  return "unknown";
}
