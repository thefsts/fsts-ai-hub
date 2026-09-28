/**
 * Tests for the Memory Service.
 *
 * These tests prove memory-scope isolation: cross-tenant, cross-system, and
 * cross-agent access is denied, and deleted scopes are never readable.
 */

import { describe, expect, it } from "vitest";
import type { MemoryAccessRequest, MemoryScope } from "@fsts/contracts";
import { authorizeMemoryAccess, verifyMemoryScopeBoundary } from "./index.js";

function scope(overrides: Partial<MemoryScope> = {}): MemoryScope {
  return {
    contractVersion: "v1",
    id: "scope-1",
    tenantId: "tenant-a",
    connectedSystemId: "sys-1",
    aiIdentityId: "ai-1",
    name: "Test Scope",
    dataClassification: "internal",
    retentionPolicy: { policyId: "ret-1", retentionDays: 30, legalHold: false },
    readEnabled: true,
    writeEnabled: true,
    deletionState: "active",
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function request(
  overrides: Partial<MemoryAccessRequest> = {},
): MemoryAccessRequest {
  return {
    contractVersion: "v1",
    tenantId: "tenant-a",
    connectedSystemId: "sys-1",
    aiIdentityId: "ai-1",
    memoryScopeId: "scope-1",
    operation: "read",
    correlationId: "corr-12345678",
    requestedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("authorizeMemoryAccess", () => {
  it("allows access within the same scope", () => {
    expect(authorizeMemoryAccess(request(), scope()).allowed).toBe(true);
  });

  it("denies cross-tenant access", () => {
    const result = authorizeMemoryAccess(
      request({ tenantId: "tenant-b" }),
      scope(),
    );
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("cross-tenant");
  });

  it("denies cross-system access", () => {
    const result = authorizeMemoryAccess(
      request({ connectedSystemId: "sys-2" }),
      scope(),
    );
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("cross-system");
  });

  it("denies cross-agent access", () => {
    const result = authorizeMemoryAccess(
      request({ aiIdentityId: "ai-2" }),
      scope(),
    );
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("cross-agent");
  });

  it("denies access to a deleted scope", () => {
    const result = authorizeMemoryAccess(
      request(),
      scope({ deletionState: "deleted" }),
    );
    expect(result.allowed).toBe(false);
  });

  it("denies writes when writes are disabled", () => {
    const result = authorizeMemoryAccess(
      request({ operation: "write" }),
      scope({ writeEnabled: false }),
    );
    expect(result.allowed).toBe(false);
  });
});

describe("verifyMemoryScopeBoundary", () => {
  it("verifies a matching boundary", () => {
    const result = verifyMemoryScopeBoundary(scope(), {
      tenantId: "tenant-a",
      connectedSystemId: "sys-1",
      aiIdentityId: "ai-1",
    });
    expect(result.allowed).toBe(true);
  });

  it("rejects a mismatched boundary", () => {
    const result = verifyMemoryScopeBoundary(scope(), {
      tenantId: "tenant-b",
      connectedSystemId: "sys-1",
      aiIdentityId: "ai-1",
    });
    expect(result.allowed).toBe(false);
  });
});
