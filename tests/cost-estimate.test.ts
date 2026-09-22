import { describe, expect, it } from "vitest";
import { estimateTokenCostMicros } from "../src/cost/estimate";

describe("token cost estimation", () => {
  it("separates cached and uncached input pricing", () => {
    const result = estimateTokenCostMicros(
      { inputTokens: 1_000_000, outputTokens: 500_000, cachedInputTokens: 250_000 },
      {
        inputMicrosPerMillionTokens: 2_000_000,
        outputMicrosPerMillionTokens: 8_000_000,
        cachedInputMicrosPerMillionTokens: 500_000,
      },
    );

    expect(result).toBe(5_625_000);
  });

  it("rejects invalid token counts", () => {
    expect(() =>
      estimateTokenCostMicros(
        { inputTokens: 10, outputTokens: 1, cachedInputTokens: 11 },
        { inputMicrosPerMillionTokens: 1, outputMicrosPerMillionTokens: 1 },
      ),
    ).toThrow("cachedInputTokens cannot exceed inputTokens");
  });
});
