/**
 * Tests for authentication and identity verification primitives.
 *
 * These tests prove fail-closed behavior: missing, malformed, expired, or
 * unverifiable credentials are rejected, and tenant identity is always derived
 * from the verified principal rather than the request.
 */

import { describe, expect, it } from "vitest";
import {
  authenticate,
  deriveExecutionContext,
  verifyServiceIdentity,
  type IdentityVerifier,
  type VerifiedPrincipal,
} from "./index.js";

const future = new Date(Date.now() + 60_000).toISOString();
const past = new Date(Date.now() - 60_000).toISOString();

function principal(
  overrides: Partial<VerifiedPrincipal> = {},
): VerifiedPrincipal {
  return {
    principalId: "user-1",
    kind: "human",
    tenantId: "tenant-a",
    organizationId: "org-a",
    roles: ["operator"],
    attributes: {},
    issuer: "https://idp.example",
    expiresAt: future,
    ...overrides,
  };
}

const okVerifier: IdentityVerifier = {
  verify: async () => principal(),
};

describe("authenticate", () => {
  it("rejects a missing credential", async () => {
    const result = await authenticate(undefined, okVerifier);
    expect(result.authenticated).toBe(false);
  });

  it("rejects an empty token", async () => {
    const result = await authenticate({ token: "" }, okVerifier);
    expect(result.authenticated).toBe(false);
  });

  it("rejects when the verifier throws", async () => {
    const failing: IdentityVerifier = {
      verify: async () => {
        throw new Error("bad signature");
      },
    };
    const result = await authenticate({ token: "abc" }, failing);
    expect(result.authenticated).toBe(false);
    expect(result.reason).toContain("verification failed");
  });

  it("rejects an expired principal", async () => {
    const expired: IdentityVerifier = {
      verify: async () => principal({ expiresAt: past }),
    };
    const result = await authenticate({ token: "abc" }, expired);
    expect(result.authenticated).toBe(false);
    expect(result.reason).toContain("expired");
  });

  it("accepts a valid principal", async () => {
    const result = await authenticate({ token: "abc" }, okVerifier);
    expect(result.authenticated).toBe(true);
    expect(result.principal?.tenantId).toBe("tenant-a");
  });
});

describe("verifyServiceIdentity", () => {
  it("rejects a missing service identity", () => {
    expect(verifyServiceIdentity(undefined).authenticated).toBe(false);
  });

  it("rejects an expired service credential", () => {
    const result = verifyServiceIdentity({
      serviceName: "svc",
      tenantId: "t",
      organizationId: "o",
      credentialRef: "ref",
      expiresAt: past,
    });
    expect(result.authenticated).toBe(false);
  });

  it("accepts a valid short-lived service identity", () => {
    const result = verifyServiceIdentity({
      serviceName: "svc",
      tenantId: "t",
      organizationId: "o",
      credentialRef: "ref",
      expiresAt: future,
    });
    expect(result.authenticated).toBe(true);
    expect(result.principal?.kind).toBe("service");
  });
});

describe("deriveExecutionContext", () => {
  it("takes tenant and organization from the verified principal, not the request", () => {
    const ctx = deriveExecutionContext(principal(), {
      environmentId: "env-1",
      environmentKind: "production",
      connectedSystemId: "sys-1",
      aiIdentityId: "ai-1",
      agentVersionId: "av-1",
      policyVersionId: "pv-1",
      correlationId: "corr-12345678",
      dataClassification: "internal",
    });
    expect(ctx.tenantId).toBe("tenant-a");
    expect(ctx.organizationId).toBe("org-a");
    expect(ctx.actorIdentityId).toBe("user-1");
  });
});
