/**
 * Tests for the Audit Service.
 *
 * These tests prove audit events are redacted, integrity-protected, and that
 * tampering is detectable.
 */

import { describe, expect, it } from "vitest";
import {
  buildAuditEvent,
  verifyAuditChain,
  type AuditEventInput,
} from "./index.js";

function input(overrides: Partial<AuditEventInput> = {}): AuditEventInput {
  return {
    id: "audit-1",
    type: "model_request",
    tenantId: "tenant-a",
    organizationId: "org-a",
    environmentId: "env-1",
    connectedSystemId: "sys-1",
    aiIdentityId: "ai-1",
    agentVersionId: "av-1",
    actorIdentityId: "actor-1",
    correlationId: "corr-12345678",
    traceId: "trace-12345678",
    dataClassification: "internal",
    retentionClass: "standard",
    payload: { model: "model-a" },
    occurredAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("buildAuditEvent", () => {
  it("redacts sensitive payload fields", () => {
    const event = buildAuditEvent(
      input({ payload: { apiKey: "sk-secret-value", model: "model-a" } }),
      "GENESIS",
    );
    expect(JSON.stringify(event.payload)).not.toContain("sk-secret-value");
  });

  it("produces a 64-char integrity hash", () => {
    const event = buildAuditEvent(input(), "GENESIS");
    expect(event.integrityHash).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe("verifyAuditChain", () => {
  it("verifies an intact chain", () => {
    const e1 = buildAuditEvent(input({ id: "a1" }), "GENESIS");
    const e2 = buildAuditEvent(input({ id: "a2" }), e1.integrityHash);
    expect(verifyAuditChain([e1, e2])).toBe(-1);
  });

  it("detects tampering", () => {
    const e1 = buildAuditEvent(input({ id: "a1" }), "GENESIS");
    const e2 = buildAuditEvent(input({ id: "a2" }), e1.integrityHash);
    const tampered = { ...e2, actorIdentityId: "attacker" };
    expect(verifyAuditChain([e1, tampered])).toBe(1);
  });
});
