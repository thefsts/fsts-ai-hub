/**
 * FSTS AI Hub — Cost Optimization Engine: token cost estimation.
 *
 * Micros-denominated token cost estimation used by the Convex backend's
 * `aiUsageRecords`. Prices are expressed in micros (1e-6 currency units) per
 * million tokens so that integer arithmetic stays exact and reproducible.
 *
 * This complements `pricing.ts`: `computeCost` works against a versioned
 * `ProviderPriceVersion`, while `estimateTokenCostMicros` works against a
 * lightweight `TokenPrice` and rounds up so the Hub never under-counts cost.
 *
 * Owner: Full Stack Tech & Solutions LLC
 */

import type { TokenUsage } from "./pricing.js";

/** Token prices in micros per million tokens. */
export interface TokenPrice {
  inputMicrosPerMillionTokens: number;
  outputMicrosPerMillionTokens: number;
  cachedInputMicrosPerMillionTokens?: number;
}

function assertTokenCount(value: number, field: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${field} must be a nonnegative safe integer`);
  }
}

/**
 * Estimate the cost, in micros, of a token usage record against a price.
 *
 * Cached input tokens are billed at the cached rate when present, otherwise at
 * the standard input rate. The result is rounded up to the nearest micro so the
 * Hub never under-counts cost. Invalid token counts (negative, non-integer, or
 * cached input exceeding total input) are rejected.
 */
export function estimateTokenCostMicros(
  usage: TokenUsage,
  price: TokenPrice,
): number {
  const inputTokens = usage.inputTokens;
  const outputTokens = usage.outputTokens;
  const cachedInputTokens = usage.cachedInputTokens ?? 0;

  assertTokenCount(inputTokens, "inputTokens");
  assertTokenCount(outputTokens, "outputTokens");
  assertTokenCount(cachedInputTokens, "cachedInputTokens");

  if (cachedInputTokens > inputTokens) {
    throw new Error("cachedInputTokens cannot exceed inputTokens");
  }

  const uncachedInputTokens = inputTokens - cachedInputTokens;
  const cachedRate =
    price.cachedInputMicrosPerMillionTokens ??
    price.inputMicrosPerMillionTokens;
  const rawCost =
    (uncachedInputTokens * price.inputMicrosPerMillionTokens +
      cachedInputTokens * cachedRate +
      outputTokens * price.outputMicrosPerMillionTokens) /
    1_000_000;

  return Math.ceil(rawCost);
}
