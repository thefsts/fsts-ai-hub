/**
 * FSTS AI Hub — Service identity verification.
 *
 * Machine-to-machine authentication for connected systems. No human identity
 * provider (e.g. Clerk) is involved. A service identity is identified by a key
 * ID and authenticated with a secret whose digest (never the plaintext secret)
 * is stored server-side. Every check fails closed.
 *
 * This is the foundation for registration, key ID, secret digest / public-key
 * reference, allowed system/environment/tenant/scopes, status, expiration,
 * rotation, revocation, last-used, and audit history. It does not itself
 * persist anything; the Convex `serviceIdentities` table is the store.
 *
 * Owner: Full Stack Tech & Solutions LLC
 */

import type { AuthzDecision } from "./index.js";

export type ServiceIdentityStatus = "active" | "suspended" | "disabled";

/** A service identity record as persisted by the Convex backend. */
export interface ServiceIdentityRecord {
  keyId: string;
  /** A hex-encoded digest of the secret. Never the plaintext secret. */
  secretDigest: string;
  scopes: readonly string[];
  status: ServiceIdentityStatus;
  /** Epoch milliseconds. Absent means no expiry. */
  expiresAt?: number;
  allowedTenantIds: readonly string[];
  allowedConnectedSystemIds: readonly string[];
  allowedEnvironments: readonly string[];
  createdAt: number;
  updatedAt: number;
  lastUsedAt?: number;
}

/** A request presented by a connected system. */
export interface ServiceIdentityRequest {
  keyId: string;
  tenantId: string;
  connectedSystemId: string;
  environment: string;
  requiredScope: string;
}

const DENY = (reason: string): AuthzDecision => ({ allowed: false, reason });
const ALLOW = (reason: string): AuthzDecision => ({ allowed: true, reason });

/**
 * A secret digest must be a hex-encoded hash (e.g. SHA-256). This rejects
 * plaintext secrets and short/opaque values so a raw credential can never be
 * stored in place of a digest.
 */
export function isSecretDigest(value: string): boolean {
  return /^[a-f0-9]{64}$/i.test(value);
}

/**
 * Verify that a service identity may perform a request. Denies when the
 * identity is unknown, mismatched, not active, expired, or lacks the required
 * tenant, system, environment, or scope authorization.
 */
export function verifyServiceIdentityAccess(
  identity: ServiceIdentityRecord | undefined,
  request: ServiceIdentityRequest,
  now: number = Date.now(),
): AuthzDecision {
  if (!identity) return DENY("unknown service identity");
  if (identity.keyId !== request.keyId) {
    return DENY("service identity key mismatch");
  }
  if (!isSecretDigest(identity.secretDigest)) {
    return DENY("service identity has no valid secret digest");
  }
  if (identity.status !== "active") {
    return DENY(`service identity is ${identity.status}`);
  }
  if (identity.expiresAt !== undefined && identity.expiresAt <= now) {
    return DENY("service identity expired");
  }
  if (!identity.allowedTenantIds.includes(request.tenantId)) {
    return DENY("tenant not allowed for service identity");
  }
  if (!identity.allowedConnectedSystemIds.includes(request.connectedSystemId)) {
    return DENY("connected system not allowed for service identity");
  }
  if (!identity.allowedEnvironments.includes(request.environment)) {
    return DENY("environment not allowed for service identity");
  }
  if (!identity.scopes.includes(request.requiredScope)) {
    return DENY(`missing required scope '${request.requiredScope}'`);
  }
  return ALLOW("service identity authorized");
}

/** Input for registering a new service identity. */
export interface ServiceIdentityRegistration {
  keyId: string;
  secretDigest: string;
  scopes: readonly string[];
  allowedTenantIds: readonly string[];
  allowedConnectedSystemIds: readonly string[];
  allowedEnvironments: readonly string[];
  expiresAt?: number;
}

/**
 * Register a new service identity. Rejects plaintext secrets and identities
 * with no declared scope. The returned record is active and ready to persist.
 */
export function registerServiceIdentity(
  registration: ServiceIdentityRegistration,
  now: number = Date.now(),
): ServiceIdentityRecord {
  if (!isSecretDigest(registration.secretDigest)) {
    throw new Error(
      "service identity secret must be stored as a hex-encoded digest, never plaintext",
    );
  }
  if (registration.scopes.length === 0) {
    throw new Error("service identity must declare at least one scope");
  }
  const record: ServiceIdentityRecord = {
    keyId: registration.keyId,
    secretDigest: registration.secretDigest,
    scopes: registration.scopes,
    status: "active",
    allowedTenantIds: registration.allowedTenantIds,
    allowedConnectedSystemIds: registration.allowedConnectedSystemIds,
    allowedEnvironments: registration.allowedEnvironments,
    createdAt: now,
    updatedAt: now,
  };
  if (registration.expiresAt !== undefined) {
    record.expiresAt = registration.expiresAt;
  }
  return record;
}

/** Rotate a service identity's secret digest. Rejects plaintext secrets. */
export function rotateServiceIdentity(
  identity: ServiceIdentityRecord,
  newSecretDigest: string,
  now: number = Date.now(),
): ServiceIdentityRecord {
  if (!isSecretDigest(newSecretDigest)) {
    throw new Error("rotated secret must be stored as a hex-encoded digest");
  }
  return { ...identity, secretDigest: newSecretDigest, updatedAt: now };
}

/** Revoke a service identity. Revocation is terminal until re-registration. */
export function revokeServiceIdentity(
  identity: ServiceIdentityRecord,
  now: number = Date.now(),
): ServiceIdentityRecord {
  return { ...identity, status: "disabled", updatedAt: now };
}

/** Record that a service identity was used. */
export function markServiceIdentityUsed(
  identity: ServiceIdentityRecord,
  now: number = Date.now(),
): ServiceIdentityRecord {
  return { ...identity, lastUsedAt: now, updatedAt: now };
}
