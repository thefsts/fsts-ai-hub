/**
 * FSTS AI Hub — Token cost estimation tests.
 *
 * Owner: Full Stack Tech & Solutions LLC
 */

import { describe, expect, it } from "vitest";
import { estimateTokenCostMicros } from "./estimate.js";

describe("token cost estimation", () => {
  it("separates cached and uncached input pricing", () => {
    const result = estimateTokenCostMicros(
      {
        inputTokens: 1_000_000,
        outputTokens: 500_000,
        cachedInputTokens: 250_000,
      },
      {
        inputMicrosPerMillionTokens: 2_000_000,
        outputMicrosPerMillionTokens: 8_000_000,
        cachedInputMicrosPerMillionTokens: 500_000,
      },
    );
    expect(result).toBe(5_625_000);
  });

  it("bills cached input at the standard rate when no cached rate is set", () => {
    const result = estimateTokenCostMicros(
      {
        inputTokens: 1_000_000,
        outputTokens: 0,
        cachedInputTokens: 1_000_000,
      },
      {
        inputMicrosPerMillionTokens: 2_000_000,
        outputMicrosPerMillionTokens: 8_000_000,
      },
    );
    expect(result).toBe(2_000_000);
  });

  it("rounds up so the Hub never under-counts cost", () => {
    const result = estimateTokenCostMicros(
      { inputTokens: 1, outputTokens: 0, cachedInputTokens: 0 },
      { inputMicrosPerMillionTokens: 1, outputMicrosPerMillionTokens: 1 },
    );
    expect(result).toBe(1);
  });

  it("rejects cached input exceeding total input", () => {
    expect(() =>
      estimateTokenCostMicros(
        { inputTokens: 10, outputTokens: 1, cachedInputTokens: 11 },
        { inputMicrosPerMillionTokens: 1, outputMicrosPerMillionTokens: 1 },
      ),
    ).toThrow("cachedInputTokens cannot exceed inputTokens");
  });

  it("rejects negative token counts", () => {
    expect(() =>
      estimateTokenCostMicros(
        { inputTokens: -1, outputTokens: 0, cachedInputTokens: 0 },
        { inputMicrosPerMillionTokens: 1, outputMicrosPerMillionTokens: 1 },
      ),
    ).toThrow("inputTokens must be a nonnegative safe integer");
  });

  it("rejects non-integer token counts", () => {
    expect(() =>
      estimateTokenCostMicros(
        { inputTokens: 1.5, outputTokens: 0, cachedInputTokens: 0 },
        { inputMicrosPerMillionTokens: 1, outputMicrosPerMillionTokens: 1 },
      ),
    ).toThrow("inputTokens must be a nonnegative safe integer");
  });
});
