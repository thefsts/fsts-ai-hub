/**
 * FSTS AI Hub — Cost Optimization Engine: versioned provider pricing.
 *
 * Pricing is versioned so historical cost calculations remain reproducible
 * after providers change their prices. Historical pricing must never be
 * silently overwritten.
 *
 * Owner: Full Stack Tech & Solutions LLC
 */

import type { ProviderPriceVersion } from "@fsts/contracts";

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cachedInputTokens?: number;
  embeddingTokens?: number;
}

/**
 * Select the price version that was effective at a given time. This makes
 * historical cost calculations reproducible.
 */
export function selectPriceVersion(
  versions: ProviderPriceVersion[],
  at: Date,
): ProviderPriceVersion | undefined {
  const t = at.getTime();
  const applicable = versions.filter((v) => {
    const from = new Date(v.effectiveFrom).getTime();
    const to = v.effectiveTo ? new Date(v.effectiveTo).getTime() : Infinity;
    return from <= t && t < to;
  });
  // Choose the most recent effective version.
  return applicable.sort(
    (a, b) =>
      new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime(),
  )[0];
}

/**
 * Compute the estimated cost for a usage record against a specific price
 * version. Uses the version's rates exactly, so results are reproducible.
 */
export function computeCost(
  price: ProviderPriceVersion,
  usage: TokenUsage,
): number {
  const perMillion = 1_000_000;
  const inputCost =
    (usage.inputTokens / perMillion) * price.inputPerMillionTokens;
  const outputCost =
    (usage.outputTokens / perMillion) * price.outputPerMillionTokens;
  const cachedCost =
    price.cachedInputPerMillionTokens !== undefined
      ? ((usage.cachedInputTokens ?? 0) / perMillion) *
        price.cachedInputPerMillionTokens
      : 0;
  const embeddingCost =
    price.embeddingPerMillionTokens !== undefined
      ? ((usage.embeddingTokens ?? 0) / perMillion) *
        price.embeddingPerMillionTokens
      : 0;
  return (
    inputCost +
    outputCost +
    cachedCost +
    embeddingCost +
    price.toolOrRequestCharge
  );
}

/**
 * Guard: a new price version must not overwrite an existing version with the
 * same id. Returns true when it is safe to add.
 */
export function canAddPriceVersion(
  existing: ProviderPriceVersion[],
  incoming: ProviderPriceVersion,
): boolean {
  return !existing.some((v) => v.id === incoming.id);
}

/**
 * Detect a mismatch between estimated and actual billed cost.
 */
export function detectBillingMismatch(
  estimated: number,
  actual: number,
  tolerancePercent = 5,
): { mismatch: boolean; variance: number; variancePercent: number } {
  const variance = actual - estimated;
  const variancePercent = estimated === 0 ? 0 : (variance / estimated) * 100;
  return {
    mismatch: Math.abs(variancePercent) > tolerancePercent,
    variance,
    variancePercent,
  };
}
