/**
 * FSTS AI Hub — Cost Optimization Engine: capability- and cost-aware routing.
 *
 * Routing follows the mandatory operating priority order:
 *   1. Security
 *   2. Legal and compliance requirements
 *   3. Data classification and residency
 *   4. Required model capability
 *   5. Output quality
 *   6. Reliability and availability
 *   7. Latency requirements
 *   8. Cost optimization
 *
 * The router must NEVER select a cheaper provider or model that is
 * unauthorized, unsafe, noncompliant, unavailable for the data classification,
 * or incapable of completing the work reliably. It must not automatically
 * escalate every request to the most expensive model.
 *
 * Owner: Full Stack Tech & Solutions LLC
 */

import type {
  DataClassification,
  DataRegion,
  RoutingTier,
} from "@fsts/contracts";

export interface RoutingCandidate {
  providerId: string;
  modelId: string;
  tier: RoutingTier;
  /** Whether the provider/model is on the approved allowlist. */
  approved: boolean;
  /** Whether the provider is compliant for the required data classification. */
  compliantForClassification: boolean;
  /** Whether the provider satisfies the required data residency. */
  residencySatisfied: boolean;
  /** Whether the model supports the required capability. */
  capabilityMatch: boolean;
  /** Whether the model meets the workflow's quality floor. */
  meetsQualityFloor: boolean;
  /** Whether the provider is currently healthy. */
  healthy: boolean;
  /** Whether the provider meets the latency requirement. */
  meetsLatency: boolean;
  /** Estimated cost for this request. */
  estimatedCost: number;
  /** Whether the provider is currently suspended. */
  suspended: boolean;
}

export interface RoutingRequest {
  requiredCapability: string;
  dataClassification: DataClassification;
  requiredRegion: DataRegion;
  /** Maximum acceptable latency in ms, if any. */
  maxLatencyMs?: number;
  /** Whether the request can be handled deterministically without an LLM. */
  deterministicPossible: boolean;
  /** Whether a valid cache entry exists and policy permits its use. */
  cacheAvailable: boolean;
  /** Whether the budget requires routing to a cheaper approved model. */
  budgetRequiresCheaper: boolean;
}

export interface RoutingResult {
  selectedProviderId?: string;
  selectedModelId?: string;
  selectedTier: RoutingTier;
  reason:
    | "deterministic_no_llm"
    | "cache_hit"
    | "capability_match"
    | "cost_optimized"
    | "quality_floor"
    | "compliance_required"
    | "residency_required"
    | "fallback_provider"
    | "budget_threshold"
    | "no_compliant_provider";
  blocked: boolean;
  candidates: Array<{
    providerId: string;
    modelId: string;
    tier: RoutingTier;
    eligible: boolean;
    rejectionReason?: string;
    estimatedCost?: number;
  }>;
}

const TIER_ORDER: RoutingTier[] = [
  "tier_1_deterministic",
  "tier_2_small",
  "tier_3_standard",
  "tier_4_advanced",
  "tier_5_specialized",
];

function tierRank(tier: RoutingTier): number {
  return TIER_ORDER.indexOf(tier);
}

/**
 * Evaluate a candidate against the mandatory priority order. Returns an
 * eligibility decision with a rejection reason when ineligible.
 */
function evaluateCandidate(
  candidate: RoutingCandidate,
  _request: RoutingRequest,
): { eligible: boolean; rejectionReason?: string } {
  // 1. Security — suspended or unapproved candidates are never eligible.
  if (candidate.suspended) {
    return { eligible: false, rejectionReason: "provider suspended" };
  }
  if (!candidate.approved) {
    return { eligible: false, rejectionReason: "provider/model not approved" };
  }
  // 2. Legal and compliance.
  if (!candidate.compliantForClassification) {
    return {
      eligible: false,
      rejectionReason: "not compliant for required data classification",
    };
  }
  // 3. Data classification and residency.
  if (!candidate.residencySatisfied) {
    return { eligible: false, rejectionReason: "data residency not satisfied" };
  }
  // 4. Required model capability.
  if (!candidate.capabilityMatch) {
    return { eligible: false, rejectionReason: "capability mismatch" };
  }
  // 5. Output quality.
  if (!candidate.meetsQualityFloor) {
    return { eligible: false, rejectionReason: "below quality floor" };
  }
  // 6. Reliability and availability.
  if (!candidate.healthy) {
    return { eligible: false, rejectionReason: "provider unhealthy" };
  }
  // 7. Latency requirements.
  if (!candidate.meetsLatency) {
    return { eligible: false, rejectionReason: "latency requirement not met" };
  }
  // 8. Cost optimization is applied only after all of the above.
  return { eligible: true };
}

/**
 * Route a request. Deterministic processing and safe cache hits are preferred
 * when possible. Otherwise, the cheapest eligible candidate is selected, but
 * never at the expense of security, compliance, capability, quality,
 * reliability, or latency.
 */
export function routeRequest(
  request: RoutingRequest,
  candidates: RoutingCandidate[],
): RoutingResult {
  const evaluated = candidates.map((c) => {
    const { eligible, rejectionReason } = evaluateCandidate(c, request);
    return {
      providerId: c.providerId,
      modelId: c.modelId,
      tier: c.tier,
      eligible,
      ...(rejectionReason ? { rejectionReason } : {}),
      estimatedCost: c.estimatedCost,
    };
  });

  // Tier 1 — deterministic/non-AI processing when safely possible.
  if (request.deterministicPossible) {
    return {
      selectedTier: "tier_1_deterministic",
      reason: "deterministic_no_llm",
      blocked: false,
      candidates: evaluated,
    };
  }

  // Repeated safe request — validated cache when policy permits.
  if (request.cacheAvailable) {
    return {
      selectedTier: "tier_2_small",
      reason: "cache_hit",
      blocked: false,
      candidates: evaluated,
    };
  }

  const eligible = candidates
    .map((c, i) => ({ candidate: c, evaluation: evaluated[i]! }))
    .filter((x) => x.evaluation.eligible);

  // No compliant provider available — stop and report the blocked execution.
  if (eligible.length === 0) {
    return {
      selectedTier: "tier_3_standard",
      reason: "no_compliant_provider",
      blocked: true,
      candidates: evaluated,
    };
  }

  // Cost optimization: choose the cheapest eligible candidate. When the budget
  // requires cheaper routing, prefer the lowest tier available.
  const sorted = [...eligible].sort((a, b) => {
    if (request.budgetRequiresCheaper) {
      const tierDiff = tierRank(a.candidate.tier) - tierRank(b.candidate.tier);
      if (tierDiff !== 0) return tierDiff;
    }
    return a.candidate.estimatedCost - b.candidate.estimatedCost;
  });

  const chosen = sorted[0]!;
  const reason = request.budgetRequiresCheaper
    ? "budget_threshold"
    : "cost_optimized";

  return {
    selectedProviderId: chosen.candidate.providerId,
    selectedModelId: chosen.candidate.modelId,
    selectedTier: chosen.candidate.tier,
    reason,
    blocked: false,
    candidates: evaluated,
  };
}
