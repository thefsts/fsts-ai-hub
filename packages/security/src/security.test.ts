/**
 * FSTS AI Hub — Security and isolation tests.
 *
 * These tests assert fail-closed behavior at trust boundaries.
 *
 * Owner: Full Stack Tech & Solutions LLC
 */

import { describe, expect, it } from "vitest";
import {
  combineDecisions,
  enforceAllowlist,
  enforceDataClassification,
  enforceEnvironmentIsolation,
  enforceOwnershipBoundary,
  enforceSystemIsolation,
  enforceTenantIsolation,
  preventSelfElevation,
  verifyEnvironment,
  verifySystem,
  verifyTenant,
} from "./index.js";

describe("tenant verification", () => {
  it("denies when tenant context is missing", () => {
    expect(verifyTenant(undefined, "t1").allowed).toBe(false);
    expect(verifyTenant("t1", undefined).allowed).toBe(false);
  });

  it("denies on tenant mismatch", () => {
    expect(verifyTenant("t1", "t2").allowed).toBe(false);
  });

  it("allows when tenant matches", () => {
    expect(verifyTenant("t1", "t1").allowed).toBe(true);
  });
});

describe("system and environment verification", () => {
  it("denies on system mismatch", () => {
    expect(verifySystem("s1", "s2").allowed).toBe(false);
  });
  it("denies on environment mismatch", () => {
    expect(verifyEnvironment("e1", "e2").allowed).toBe(false);
  });
});

describe("tenant isolation", () => {
  it("denies cross-tenant access", () => {
    expect(
      enforceTenantIsolation({ tenantId: "t1" }, { tenantId: "t2" }).allowed,
    ).toBe(false);
  });
  it("allows same-tenant access", () => {
    expect(
      enforceTenantIsolation({ tenantId: "t1" }, { tenantId: "t1" }).allowed,
    ).toBe(true);
  });
  it("fails closed on missing tenant", () => {
    expect(
      enforceTenantIsolation({ tenantId: "" }, { tenantId: "t1" }).allowed,
    ).toBe(false);
  });
});

describe("system isolation", () => {
  it("denies cross-system access", () => {
    expect(
      enforceSystemIsolation(
        { connectedSystemId: "s1" },
        { connectedSystemId: "s2" },
      ).allowed,
    ).toBe(false);
  });
});

describe("environment isolation", () => {
  it("denies cross-environment access", () => {
    expect(
      enforceEnvironmentIsolation(
        { environmentId: "prod" },
        { environmentId: "dev" },
      ).allowed,
    ).toBe(false);
  });
});

describe("allowlist enforcement", () => {
  it("denies when the allowlist is empty (deny by default)", () => {
    expect(enforceAllowlist("m1", [], "model").allowed).toBe(false);
  });
  it("denies an unapproved model", () => {
    expect(enforceAllowlist("m2", ["m1"], "model").allowed).toBe(false);
  });
  it("allows an approved provider", () => {
    expect(enforceAllowlist("p1", ["p1", "p2"], "provider").allowed).toBe(true);
  });
  it("denies a missing identifier", () => {
    expect(enforceAllowlist(undefined, ["m1"], "tool").allowed).toBe(false);
  });
});

describe("data classification enforcement", () => {
  it("denies data above the allowed classification", () => {
    expect(enforceDataClassification("restricted", "internal").allowed).toBe(
      false,
    );
  });
  it("allows data at or below the allowed classification", () => {
    expect(enforceDataClassification("internal", "confidential").allowed).toBe(
      true,
    );
  });
});

describe("ownership boundary", () => {
  it("denies client-owned access to FSTS-owned systems", () => {
    expect(
      enforceOwnershipBoundary("client_owned", "fsts_first_party").allowed,
    ).toBe(false);
  });
  it("allows client-owned access to client-owned systems", () => {
    expect(
      enforceOwnershipBoundary("client_owned", "client_owned").allowed,
    ).toBe(true);
  });
});

describe("self-elevation prevention", () => {
  it("denies an AI granting itself a permission", () => {
    expect(
      preventSelfElevation("ai_1", "ai_1", "grant_permission").allowed,
    ).toBe(false);
  });
  it("denies an AI approving its own restricted action", () => {
    expect(
      preventSelfElevation("ai_1", "ai_1", "approve_restricted").allowed,
    ).toBe(false);
  });
  it("allows a distinct actor", () => {
    expect(
      preventSelfElevation("ai_1", "user_1", "grant_permission").allowed,
    ).toBe(true);
  });
});

describe("combineDecisions (deny by default)", () => {
  it("denies when any decision denies", () => {
    const result = combineDecisions([
      { allowed: true, reason: "ok" },
      { allowed: false, reason: "nope" },
    ]);
    expect(result.allowed).toBe(false);
  });
  it("denies when there are no decisions", () => {
    expect(combineDecisions([]).allowed).toBe(false);
  });
  it("allows only when all decisions allow", () => {
    expect(
      combineDecisions([
        { allowed: true, reason: "a" },
        { allowed: true, reason: "b" },
      ]).allowed,
    ).toBe(true);
  });
});
