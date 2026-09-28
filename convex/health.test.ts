/**
 * FSTS AI Hub — Convex health function tests.
 *
 * Owner: Full Stack Tech & Solutions LLC
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { convexTest } from "convex-test";
import schema from "./schema";
import { internal } from "./_generated/api";

const modules = import.meta.glob(["./**/*.ts", "!./**/*.test.ts"]);

describe("convex health function", () => {
  it("reports the headless-convex architecture, service, and version", async () => {
    const t = convexTest(schema, modules);
    const health = await t.query(internal.health.status, {});
    expect(health).toEqual({
      service: "fsts-ai-hub",
      status: "ok",
      architecture: "headless-convex",
      version: "0.1.0",
    });
  });

  it("returns no secret material", async () => {
    const t = convexTest(schema, modules);
    const health = await t.query(internal.health.status, {});
    expect(JSON.stringify(health)).not.toMatch(
      /secret|token|password|credential|key/i,
    );
  });

  it("is declared as an internal query, not a public query", () => {
    // The only public production surface is GET /v1/health. The health query
    // must be declared with `internalQuery` so it is not callable as a public
    // Convex function. convex-test cannot distinguish visibility at runtime,
    // so this asserts the declaration directly.
    const source = readFileSync(
      fileURLToPath(new URL("./health.ts", import.meta.url)),
      "utf8",
    );
    expect(source).toMatch(/import\s*\{[^}]*\binternalQuery\b[^}]*\}/);
    expect(source).toMatch(/export const status = internalQuery\(/);
    expect(source).not.toMatch(/export const status = query\(/);
  });
});
