/**
 * FSTS AI Hub — Convex health function tests.
 *
 * Owner: Full Stack Tech & Solutions LLC
 */

import { describe, expect, it } from "vitest";
import { convexTest } from "convex-test";
import schema from "./schema";
import { api } from "./_generated/api";

const modules = import.meta.glob(["./**/*.ts", "!./**/*.test.ts"]);

describe("convex health function", () => {
  it("reports the headless-convex architecture, service, and version", async () => {
    const t = convexTest(schema, modules);
    const health = await t.query(api.health.status, {});
    expect(health).toEqual({
      service: "fsts-ai-hub",
      status: "ok",
      architecture: "headless-convex",
      version: "0.1.0",
    });
  });

  it("returns no secret material", async () => {
    const t = convexTest(schema, modules);
    const health = await t.query(api.health.status, {});
    expect(JSON.stringify(health)).not.toMatch(
      /secret|token|password|credential|key/i,
    );
  });
});
