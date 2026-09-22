/**
 * FSTS AI Hub — Redaction tests.
 *
 * Owner: Full Stack Tech & Solutions LLC
 */

import { describe, expect, it } from "vitest";
import {
  REDACTED,
  containsSensitiveData,
  redact,
  redactString,
} from "./index.js";

describe("redact", () => {
  it("redacts sensitive keys regardless of case", () => {
    const out = redact({
      username: "alice",
      password: "hunter2",
      API_KEY: "abc123",
      Authorization: "Bearer xyz",
    }) as Record<string, unknown>;
    expect(out.username).toBe("alice");
    expect(out.password).toBe(REDACTED);
    expect(out.API_KEY).toBe(REDACTED);
    expect(out.Authorization).toBe(REDACTED);
  });

  it("redacts nested sensitive keys", () => {
    const out = redact({
      user: { name: "bob", credentials: { token: "t" } },
    }) as { user: { name: string; credentials: unknown } };
    expect(out.user.name).toBe("bob");
    // A sensitive key redacts its entire subtree, not just the leaf value.
    expect(out.user.credentials).toBe(REDACTED);
  });

  it("redacts a nested sensitive leaf key", () => {
    const out = redact({
      user: { name: "bob", profile: { token: "t", city: "NYC" } },
    }) as { user: { name: string; profile: { token: string; city: string } } };
    expect(out.user.name).toBe("bob");
    expect(out.user.profile.token).toBe(REDACTED);
    expect(out.user.profile.city).toBe("NYC");
  });

  it("redacts sensitive substrings inside strings", () => {
    const out = redactString("key is AKIAIOSFODNN7EXAMPLE ok");
    expect(out).toContain(REDACTED);
    expect(out).not.toContain("AKIAIOSFODNN7EXAMPLE");
  });

  it("redacts private key blocks", () => {
    const pem =
      "-----BEGIN RSA PRIVATE KEY-----\nMIIabc\n-----END RSA PRIVATE KEY-----";
    expect(redactString(pem)).toBe(REDACTED);
  });

  it("leaves non-sensitive data intact", () => {
    const out = redact({ status: "ok", count: 3, tags: ["a", "b"] });
    expect(out).toEqual({ status: "ok", count: 3, tags: ["a", "b"] });
  });

  it("bounds recursion depth", () => {
    let deep: Record<string, unknown> = { value: "leaf" };
    for (let i = 0; i < 30; i++) deep = { nested: deep };
    const out = redact(deep);
    expect(out).toBeDefined();
  });
});

describe("containsSensitiveData", () => {
  it("detects a sensitive key", () => {
    expect(containsSensitiveData({ password: "x" })).toBe(true);
  });

  it("detects a sensitive value", () => {
    expect(containsSensitiveData("token AKIAIOSFODNN7EXAMPLE")).toBe(true);
  });

  it("returns false for clean data", () => {
    expect(containsSensitiveData({ status: "ok" })).toBe(false);
  });
});
