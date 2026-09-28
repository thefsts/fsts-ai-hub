/**
 * FSTS AI Hub — Security primitives.
 *
 * Deny-by-default authorization, tenant/system/environment isolation, and
 * allowlist enforcement. Every function fails closed: on missing or ambiguous
 * context, access is denied.
 *
 * Owner: Full Stack Tech & Solutions LLC
 */

import type { DataClassification, SystemOwnership } from "@fsts/contracts";

export interface AuthzContext {
  tenantId: string;
  organizationId: string;
  environmentId: string;
  connectedSystemId: string;
  aiIdentityId: string;
  agentVersionId: string;
  dataClassification: DataClassification;
}

export interface AuthzDecision {
  allowed: boolean;
  reason: string;
}

const DENY = (reason: string): AuthzDecision => ({ allowed: false, reason });
const ALLOW = (reason: string): AuthzDecision => ({ allowed: true, reason });

/**
 * Verify that a user-supplied tenant ID matches the authenticated identity's
 * tenant. User-supplied tenant IDs must never be trusted on their own.
 */
export function verifyTenant(
  suppliedTenantId: string | undefined,
  authenticatedTenantId: string | undefined,
): AuthzDecision {
  if (!suppliedTenantId || !authenticatedTenantId) {
    return DENY("missing tenant context");
  }
  if (suppliedTenantId !== authenticatedTenantId) {
    return DENY("tenant mismatch between request and authenticated identity");
  }
  return ALLOW("tenant verified");
}

/** Verify that the request's system matches the authorized system context. */
export function verifySystem(
  suppliedSystemId: string | undefined,
  authorizedSystemId: string | undefined,
): AuthzDecision {
  if (!suppliedSystemId || !authorizedSystemId) {
    return DENY("missing system context");
  }
  if (suppliedSystemId !== authorizedSystemId) {
    return DENY("system mismatch between request and authorized context");
  }
  return ALLOW("system verified");
}

/** Verify that the request's environment matches the authorized environment. */
export function verifyEnvironment(
  suppliedEnvironmentId: string | undefined,
  authorizedEnvironmentId: string | undefined,
): AuthzDecision {
  if (!suppliedEnvironmentId || !authorizedEnvironmentId) {
    return DENY("missing environment context");
  }
  if (suppliedEnvironmentId !== authorizedEnvironmentId) {
    return DENY("environment mismatch");
  }
  return ALLOW("environment verified");
}

/**
 * Enforce tenant isolation between two contexts. Cross-tenant access is denied
 * by default.
 */
export function enforceTenantIsolation(
  requester: Pick<AuthzContext, "tenantId">,
  resource: Pick<AuthzContext, "tenantId">,
): AuthzDecision {
  if (!requester.tenantId || !resource.tenantId) {
    return DENY("missing tenant context for isolation check");
  }
  if (requester.tenantId !== resource.tenantId) {
    return DENY("cross-tenant access denied");
  }
  return ALLOW("same tenant");
}

/**
 * Enforce product-system isolation. A request from one connected system may not
 * access resources owned by another system.
 */
export function enforceSystemIsolation(
  requester: Pick<AuthzContext, "connectedSystemId">,
  resource: Pick<AuthzContext, "connectedSystemId">,
): AuthzDecision {
  if (!requester.connectedSystemId || !resource.connectedSystemId) {
    return DENY("missing system context for isolation check");
  }
  if (requester.connectedSystemId !== resource.connectedSystemId) {
    return DENY("cross-system access denied");
  }
  return ALLOW("same system");
}

/** Enforce environment isolation (e.g. production vs development). */
export function enforceEnvironmentIsolation(
  requester: Pick<AuthzContext, "environmentId">,
  resource: Pick<AuthzContext, "environmentId">,
): AuthzDecision {
  if (!requester.environmentId || !resource.environmentId) {
    return DENY("missing environment context for isolation check");
  }
  if (requester.environmentId !== resource.environmentId) {
    return DENY("cross-environment access denied");
  }
  return ALLOW("same environment");
}

/** Allowlist check for models, providers, or tools. Deny by default. */
export function enforceAllowlist(
  requestedId: string | undefined,
  allowlist: readonly string[],
  kind: "model" | "provider" | "tool",
): AuthzDecision {
  if (!requestedId) return DENY(`missing ${kind} identifier`);
  if (allowlist.length === 0) {
    return DENY(`no ${kind}s are approved for this agent version`);
  }
  if (!allowlist.includes(requestedId)) {
    return DENY(`${kind} '${requestedId}' is not on the approved allowlist`);
  }
  return ALLOW(`${kind} approved`);
}

const CLASSIFICATION_RANK: Record<DataClassification, number> = {
  public: 0,
  internal: 1,
  confidential: 2,
  restricted: 3,
  regulated: 4,
};

/**
 * Enforce data-classification handling. A destination may only handle data at
 * or below its maximum approved classification.
 */
export function enforceDataClassification(
  dataClassification: DataClassification,
  maxAllowed: DataClassification,
): AuthzDecision {
  if (
    CLASSIFICATION_RANK[dataClassification] > CLASSIFICATION_RANK[maxAllowed]
  ) {
    return DENY(
      `data classification '${dataClassification}' exceeds allowed '${maxAllowed}'`,
    );
  }
  return ALLOW("data classification permitted");
}

/**
 * Enforce that a client-owned system does not receive implicit access to
 * FSTS-owned products.
 */
export function enforceOwnershipBoundary(
  requesterOwnership: SystemOwnership,
  resourceOwnership: SystemOwnership,
): AuthzDecision {
  if (
    requesterOwnership === "client_owned" &&
    resourceOwnership !== "client_owned"
  ) {
    return DENY(
      "client-owned systems have no implicit access to FSTS-owned systems",
    );
  }
  return ALLOW("ownership boundary satisfied");
}

/**
 * Prevent self-elevation: an AI may not grant itself permissions, expand its
 * own tool scope, or approve its own restricted action.
 */
export function preventSelfElevation(
  actorIdentityId: string,
  targetIdentityId: string,
  action: "grant_permission" | "expand_scope" | "approve_restricted",
): AuthzDecision {
  if (actorIdentityId === targetIdentityId) {
    return DENY(`self-elevation denied: an AI may not ${action} for itself`);
  }
  return ALLOW("no self-elevation detected");
}

/**
 * Combine multiple decisions with deny-by-default semantics: the result is
 * allowed only if every decision is allowed.
 */
export function combineDecisions(decisions: AuthzDecision[]): AuthzDecision {
  if (decisions.length === 0) return DENY("no decisions to evaluate");
  const denied = decisions.find((d) => !d.allowed);
  if (denied) return denied;
  return ALLOW("all checks passed");
}

export * from "./service-identity.js";
