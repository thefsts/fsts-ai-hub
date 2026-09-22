/**
 * FSTS AI Hub — Convex HTTP health endpoint tests.
 *
 * The only public production surface in Phase 1 is `GET /v1/health`. These
 * tests assert the response is cache-disabled, content-type-sniffing-protected,
 * and free of secret material.
 *
 * Owner: Full Stack Tech & Solutions LLC
 */

import { describe, expect, it } from "vitest";
import { convexTest } from "convex-test";
import schema from "./schema";

const modules = import.meta.glob(["./**/*.ts", "!./**/*.test.ts"]);

describe("convex HTTP health endpoint", () => {
  it("returns 200 with the health payload", async () => {
    const t = convexTest(schema, modules);
    const res = await t.fetch("/v1/health", { method: "GET" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      service: "fsts-ai-hub",
      status: "ok",
      architecture: "headless-convex",
      version: "0.1.0",
    });
  });

  it("sets Cache-Control: no-store and X-Content-Type-Options: nosniff", async () => {
    const t = convexTest(schema, modules);
    const res = await t.fetch("/v1/health", { method: "GET" });
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(res.headers.get("Content-Type")).toContain("application/json");
  });

  it("does not expose secrets", async () => {
    const t = convexTest(schema, modules);
    const res = await t.fetch("/v1/health", { method: "GET" });
    const text = await res.text();
    expect(text).not.toMatch(/secret|token|password|credential|api[_-]?key/i);
  });
});
