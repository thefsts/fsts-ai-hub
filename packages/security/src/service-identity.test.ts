/**
 * FSTS AI Hub — Service identity tests.
 *
 * Machine-to-machine service identity verification. These tests assert
 * fail-closed behavior for status, expiration, tenant/system/environment, and
 * scope authorization, and that plaintext secrets are never accepted in place
 * of a digest. No human identity provider (Clerk) is involved.
 *
 * Owner: Full Stack Tech & Solutions LLC
 */

import { describe, expect, it } from "vitest";
import {
  isSecretDigest,
  markServiceIdentityUsed,
  registerServiceIdentity,
  revokeServiceIdentity,
  rotateServiceIdentity,
  verifyServiceIdentityAccess,
  type ServiceIdentityRecord,
  type ServiceIdentityRequest,
} from "./service-identity.js";

const DIGEST_A = "a".repeat(64);
const DIGEST_B = "b".repeat(64);

function baseIdentity(
  overrides: Partial<ServiceIdentityRecord> = {},
): ServiceIdentityRecord {
  return {
    keyId: "svc_playraise_prod",
    secretDigest: DIGEST_A,
    scopes: ["ai:invoke", "usage:write"],
    status: "active",
    allowedTenantIds: ["tenant_playraise"],
    allowedConnectedSystemIds: ["sys_playraise"],
    allowedEnvironments: ["production"],
    createdAt: 1_000,
    updatedAt: 1_000,
    ...overrides,
  };
}

function baseRequest(
  overrides: Partial<ServiceIdentityRequest> = {},
): ServiceIdentityRequest {
  return {
    keyId: "svc_playraise_prod",
    tenantId: "tenant_playraise",
    connectedSystemId: "sys_playraise",
    environment: "production",
    requiredScope: "ai:invoke",
    ...overrides,
  };
}

describe("secret digest validation", () => {
  it("accepts a 64-character hex digest", () => {
    expect(isSecretDigest(DIGEST_A)).toBe(true);
    expect(isSecretDigest(DIGEST_B.toUpperCase())).toBe(true);
  });

  it("rejects plaintext secrets and short values", () => {
    expect(isSecretDigest("super-secret-password")).toBe(false);
    expect(isSecretDigest("abc123")).toBe(false);
    expect(isSecretDigest("")).toBe(false);
  });
});

describe("service identity access verification", () => {
  it("allows an active, in-scope, correctly-scoped identity", () => {
    const decision = verifyServiceIdentityAccess(baseIdentity(), baseRequest());
    expect(decision.allowed).toBe(true);
  });

  it("denies an unknown identity (fail closed)", () => {
    const decision = verifyServiceIdentityAccess(undefined, baseRequest());
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toMatch(/unknown/i);
  });

  it("denies a key id mismatch", () => {
    const decision = verifyServiceIdentityAccess(
      baseIdentity(),
      baseRequest({ keyId: "svc_other" }),
    );
    expect(decision.allowed).toBe(false);
  });

  it("denies an identity whose stored secret is not a digest", () => {
    const decision = verifyServiceIdentityAccess(
      baseIdentity({ secretDigest: "plaintext-secret" }),
      baseRequest(),
    );
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toMatch(/digest/i);
  });

  it("denies a suspended identity", () => {
    const decision = verifyServiceIdentityAccess(
      baseIdentity({ status: "suspended" }),
      baseRequest(),
    );
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toMatch(/suspended/i);
  });

  it("denies a disabled (revoked) identity", () => {
    const decision = verifyServiceIdentityAccess(
      baseIdentity({ status: "disabled" }),
      baseRequest(),
    );
    expect(decision.allowed).toBe(false);
  });

  it("denies an expired identity", () => {
    const decision = verifyServiceIdentityAccess(
      baseIdentity({ expiresAt: 5_000 }),
      baseRequest(),
      5_000,
    );
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toMatch(/expired/i);
  });

  it("allows an identity whose expiry is still in the future", () => {
    const decision = verifyServiceIdentityAccess(
      baseIdentity({ expiresAt: 10_000 }),
      baseRequest(),
      5_000,
    );
    expect(decision.allowed).toBe(true);
  });

  it("denies a tenant that is not allowed", () => {
    const decision = verifyServiceIdentityAccess(
      baseIdentity(),
      baseRequest({ tenantId: "tenant_other" }),
    );
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toMatch(/tenant/i);
  });

  it("denies a connected system that is not allowed", () => {
    const decision = verifyServiceIdentityAccess(
      baseIdentity(),
      baseRequest({ connectedSystemId: "sys_other" }),
    );
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toMatch(/system/i);
  });

  it("denies an environment that is not allowed", () => {
    const decision = verifyServiceIdentityAccess(
      baseIdentity(),
      baseRequest({ environment: "development" }),
    );
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toMatch(/environment/i);
  });

  it("denies a request missing a required scope", () => {
    const decision = verifyServiceIdentityAccess(
      baseIdentity(),
      baseRequest({ requiredScope: "admin:write" }),
    );
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toMatch(/scope/i);
  });
});

describe("service identity lifecycle", () => {
  it("registers an active identity from a digest", () => {
    const record = registerServiceIdentity(
      {
        keyId: "svc_new",
        secretDigest: DIGEST_A,
        scopes: ["ai:invoke"],
        allowedTenantIds: ["t1"],
        allowedConnectedSystemIds: ["s1"],
        allowedEnvironments: ["production"],
      },
      1_000,
    );
    expect(record.status).toBe("active");
    expect(record.createdAt).toBe(1_000);
    expect(record.updatedAt).toBe(1_000);
  });

  it("rejects registration with a plaintext secret", () => {
    expect(() =>
      registerServiceIdentity({
        keyId: "svc_new",
        secretDigest: "plaintext",
        scopes: ["ai:invoke"],
        allowedTenantIds: ["t1"],
        allowedConnectedSystemIds: ["s1"],
        allowedEnvironments: ["production"],
      }),
    ).toThrow(/digest/i);
  });

  it("rejects registration with no declared scope", () => {
    expect(() =>
      registerServiceIdentity({
        keyId: "svc_new",
        secretDigest: DIGEST_A,
        scopes: [],
        allowedTenantIds: ["t1"],
        allowedConnectedSystemIds: ["s1"],
        allowedEnvironments: ["production"],
      }),
    ).toThrow(/scope/i);
  });

  it("rotates the secret digest and updates the timestamp", () => {
    const rotated = rotateServiceIdentity(baseIdentity(), DIGEST_B, 2_000);
    expect(rotated.secretDigest).toBe(DIGEST_B);
    expect(rotated.updatedAt).toBe(2_000);
    expect(rotated.createdAt).toBe(1_000);
  });

  it("rejects rotation to a plaintext secret", () => {
    expect(() =>
      rotateServiceIdentity(baseIdentity(), "plaintext", 2_000),
    ).toThrow(/digest/i);
  });

  it("revokes an identity terminally", () => {
    const revoked = revokeServiceIdentity(baseIdentity(), 3_000);
    expect(revoked.status).toBe("disabled");
    expect(revoked.updatedAt).toBe(3_000);
    const decision = verifyServiceIdentityAccess(revoked, baseRequest(), 3_000);
    expect(decision.allowed).toBe(false);
  });

  it("records last-used without changing status", () => {
    const used = markServiceIdentityUsed(baseIdentity(), 4_000);
    expect(used.lastUsedAt).toBe(4_000);
    expect(used.status).toBe("active");
  });
});
