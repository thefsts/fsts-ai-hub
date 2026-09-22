/**
 * FSTS AI Hub — Cost Optimization Engine: retry, loop, and idempotency guards.
 *
 * These guards stop runaway costs from retries, agent loops, and duplicate
 * requests.
 *
 * Owner: Full Stack Tech & Solutions LLC
 */

export interface RetryGuardConfig {
  maxRetries: number;
  /** Maximum cumulative retry cost allowed for a single execution. */
  maxRetryCost: number;
}

export interface AgentLoopGuardConfig {
  maxIterations: number;
  maxToolCalls: number;
  /** Maximum cumulative cost allowed for a single agent loop. */
  maxLoopCost: number;
}

export interface GuardResult {
  allowed: boolean;
  reason: string;
}

/** Enforce retry limits to stop runaway costs. */
export function enforceRetryGuard(
  config: RetryGuardConfig,
  currentRetries: number,
  cumulativeRetryCost: number,
): GuardResult {
  if (currentRetries >= config.maxRetries) {
    return { allowed: false, reason: "retry limit reached" };
  }
  if (cumulativeRetryCost >= config.maxRetryCost) {
    return { allowed: false, reason: "retry cost limit reached" };
  }
  return { allowed: true, reason: "within retry limits" };
}

/** Enforce agent-loop limits to stop runaway execution. */
export function enforceAgentLoopGuard(
  config: AgentLoopGuardConfig,
  currentIterations: number,
  currentToolCalls: number,
  cumulativeLoopCost: number,
): GuardResult {
  if (currentIterations >= config.maxIterations) {
    return { allowed: false, reason: "agent iteration limit reached" };
  }
  if (currentToolCalls >= config.maxToolCalls) {
    return { allowed: false, reason: "tool call limit reached" };
  }
  if (cumulativeLoopCost >= config.maxLoopCost) {
    return { allowed: false, reason: "agent loop cost limit reached" };
  }
  return { allowed: true, reason: "within agent loop limits" };
}

/**
 * Idempotency guard: a duplicate request with the same idempotency key must not
 * produce a duplicate charge.
 */
export class IdempotencyGuard {
  private readonly seen = new Map<string, string>();

  /**
   * Register a request. Returns the existing result reference when the key was
   * already seen (duplicate), or undefined when this is the first occurrence.
   */
  register(idempotencyKey: string, resultRef: string): string | undefined {
    const existing = this.seen.get(idempotencyKey);
    if (existing !== undefined) return existing;
    this.seen.set(idempotencyKey, resultRef);
    return undefined;
  }

  has(idempotencyKey: string): boolean {
    return this.seen.has(idempotencyKey);
  }
}

/**
 * Detect a direct provider bypass: a connected system calling a model provider
 * without going through the Model Gateway.
 */
export function detectProviderBypass(
  callOrigin: "model_gateway" | "direct",
  hasValidBypassException: boolean,
): { bypassDetected: boolean; reason: string } {
  if (callOrigin === "direct" && !hasValidBypassException) {
    return {
      bypassDetected: true,
      reason: "direct provider call without an approved bypass exception",
    };
  }
  return {
    bypassDetected: false,
    reason: "call routed through the Model Gateway",
  };
}
