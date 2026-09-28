/**
 * FSTS AI Hub — Product system connector tests.
 *
 * Verifies product adapter request/response validation fails closed and that
 * responses require product-side revalidation before actions are applied.
 *
 * Owner: Full Stack Tech & Solutions LLC
 */

import { describe, expect, it } from "vitest";
import { validateProductRequest, validateProductResponse } from "./index.js";

const FIXED_TIMESTAMP = "2026-01-01T00:00:00.000Z";

function validRequest() {
  return {
    contractVersion: "v1" as const,
    adapterContractVersion: "v1" as const,
    tenantId: "tenant_1",
    organizationId: "org_1",
    environmentId: "env_prod",
    connectedSystemId: "sys_1",
    actorIdentityId: "actor_1",
    aiIdentityId: "ai_1",
    operation: "create_record",
    payload: { name: "example" },
    correlationId: "corr_12345678",
    idempotencyKey: "idem_12345678",
    requestedAt: FIXED_TIMESTAMP,
  };
}

function validResponse() {
  return {
    contractVersion: "v1" as const,
    correlationId: "corr_12345678",
    outcome: "success" as const,
    payload: { id: "rec_1" },
    requiresProductRevalidation: true,
    completedAt: FIXED_TIMESTAMP,
  };
}

describe("validateProductRequest", () => {
  it("accepts a valid product adapter request", () => {
    const result = validateProductRequest(validRequest());
    expect(result.ok).toBe(true);
  });

  it("fails closed on a missing tenant boundary", () => {
    const { tenantId: _omit, ...rest } = validRequest();
    const result = validateProductRequest(rest);
    expect(result.ok).toBe(false);
  });

  it("fails closed on a missing idempotency key", () => {
    const { idempotencyKey: _omit, ...rest } = validRequest();
    const result = validateProductRequest(rest);
    expect(result.ok).toBe(false);
  });
});

describe("validateProductResponse", () => {
  it("accepts a valid product adapter response", () => {
    const result = validateProductResponse(validResponse());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.response.requiresProductRevalidation).toBe(true);
    }
  });

  it("fails closed on an unknown outcome", () => {
    const result = validateProductResponse({
      ...validResponse(),
      outcome: "maybe",
    });
    expect(result.ok).toBe(false);
  });
});
