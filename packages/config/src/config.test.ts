/**
 * FSTS AI Hub — Configuration tests.
 *
 * Owner: Full Stack Tech & Solutions LLC
 */

import { describe, expect, it } from "vitest";
import { ConfigError, approvedProviders, loadConfig } from "./index.js";

describe("loadConfig", () => {
  it("loads a minimal valid configuration with defaults", () => {
    const cfg = loadConfig({ SERVICE_NAME: "policy-engine" });
    expect(cfg.SERVICE_NAME).toBe("policy-engine");
    expect(cfg.NODE_ENV).toBe("development");
    expect(cfg.LOG_LEVEL).toBe("info");
  });

  it("fails closed when SERVICE_NAME is missing", () => {
    expect(() => loadConfig({})).toThrow(ConfigError);
  });

  it("fails closed on an invalid URL", () => {
    expect(() =>
      loadConfig({ SERVICE_NAME: "x", API_HUB_BASE_URL: "not-a-url" }),
    ).toThrow(ConfigError);
  });

  it("fails closed on an invalid NODE_ENV", () => {
    expect(() => loadConfig({ SERVICE_NAME: "x", NODE_ENV: "prod" })).toThrow(
      ConfigError,
    );
  });
});

describe("approvedProviders", () => {
  it("parses and normalizes a comma-separated list", () => {
    const cfg = loadConfig({
      SERVICE_NAME: "model-gateway",
      MODEL_GATEWAY_APPROVED_PROVIDERS: "openai, anthropic , google",
    });
    expect(approvedProviders(cfg)).toEqual(["openai", "anthropic", "google"]);
  });

  it("returns an empty list when unset", () => {
    const cfg = loadConfig({ SERVICE_NAME: "model-gateway" });
    expect(approvedProviders(cfg)).toEqual([]);
  });
});
