/**
 * FSTS AI Hub — Memory Service.
 *
 * Enforces memory-scope isolation. Memory is scoped by tenant, connected
 * system, and AI identity. Cross-tenant, cross-system, and cross-agent access
 * is denied by default. Deleted or pending-deletion scopes are never readable.
 *
 * Owner: Full Stack Tech & Solutions LLC
 */

import type { MemoryAccessRequest, MemoryScope } from "@fsts/contracts";

export interface MemoryAccessDecision {
  allowed: boolean;
  reason: string;
}

const DENY = (reason: string): MemoryAccessDecision => ({
  allowed: false,
  reason,
});
const ALLOW = (reason: string): MemoryAccessDecision => ({
  allowed: true,
  reason,
});

/**
 * Authorize a memory access request against a scope. Fails closed on any
 * mismatch or missing context.
 */
export function authorizeMemoryAccess(
  request: MemoryAccessRequest,
  scope: MemoryScope,
): MemoryAccessDecision {
  if (
    !request.tenantId ||
    !request.connectedSystemId ||
    !request.aiIdentityId
  ) {
    return DENY("missing memory access context");
  }
  if (scope.tenantId !== request.tenantId) {
    return DENY("cross-tenant memory access denied");
  }
  if (scope.connectedSystemId !== request.connectedSystemId) {
    return DENY("cross-system memory access denied");
  }
  if (scope.aiIdentityId !== request.aiIdentityId) {
    return DENY("cross-agent memory access denied");
  }
  if (scope.deletionState !== "active") {
    return DENY(`memory scope is not active (${scope.deletionState})`);
  }
  if (scope.status !== "active") {
    return DENY(`memory scope status is ${scope.status}`);
  }
  if (request.operation === "read" && !scope.readEnabled) {
    return DENY("reads are disabled for this scope");
  }
  if (request.operation === "write" && !scope.writeEnabled) {
    return DENY("writes are disabled for this scope");
  }
  return ALLOW("memory access authorized within scope");
}

/**
 * Verify that a memory scope belongs to the expected tenant/system/agent
 * boundary. Used when registering or validating scopes.
 */
export function verifyMemoryScopeBoundary(
  scope: MemoryScope,
  expected: {
    tenantId: string;
    connectedSystemId: string;
    aiIdentityId: string;
  },
): MemoryAccessDecision {
  if (
    scope.tenantId !== expected.tenantId ||
    scope.connectedSystemId !== expected.connectedSystemId ||
    scope.aiIdentityId !== expected.aiIdentityId
  ) {
    return DENY("memory scope boundary mismatch");
  }
  return ALLOW("memory scope boundary verified");
}
