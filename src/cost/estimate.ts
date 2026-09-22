export interface TokenPrice {
  inputMicrosPerMillionTokens: number;
  outputMicrosPerMillionTokens: number;
  cachedInputMicrosPerMillionTokens?: number;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cachedInputTokens: number;
}

function assertTokenCount(value: number, field: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${field} must be a nonnegative safe integer`);
  }
}

export function estimateTokenCostMicros(usage: TokenUsage, price: TokenPrice): number {
  assertTokenCount(usage.inputTokens, "inputTokens");
  assertTokenCount(usage.outputTokens, "outputTokens");
  assertTokenCount(usage.cachedInputTokens, "cachedInputTokens");

  if (usage.cachedInputTokens > usage.inputTokens) {
    throw new Error("cachedInputTokens cannot exceed inputTokens");
  }

  const uncachedInputTokens = usage.inputTokens - usage.cachedInputTokens;
  const cachedRate = price.cachedInputMicrosPerMillionTokens ?? price.inputMicrosPerMillionTokens;
  const rawCost =
    (uncachedInputTokens * price.inputMicrosPerMillionTokens +
      usage.cachedInputTokens * cachedRate +
      usage.outputTokens * price.outputMicrosPerMillionTokens) /
    1_000_000;

  return Math.ceil(rawCost);
}
