/**
 * FSTS AI Hub — Service request authentication contract tests.
 *
 * Owner: Full Stack Tech & Solutions LLC
 */

import { describe, expect, it } from "vitest";
import {
  ServiceRequestHeadersSchema,
  canonicalizeServiceRequest,
} from "./service-auth.js";

describe("service request headers", () => {
  it("accepts well-formed headers and coerces the timestamp", () => {
    const result = ServiceRequestHeadersSchema.parse({
      keyId: "svc_arma_360",
      timestamp: "1800000000000",
      nonce: "nonce_01JYFSTSAIHUB",
      signature: "a".repeat(64),
    });
    expect(result.timestamp).toBe(1_800_000_000_000);
  });

  it("rejects a non-hex signature", () => {
    expect(
      ServiceRequestHeadersSchema.safeParse({
        keyId: "svc_arma_360",
        timestamp: 1,
        nonce: "nonce_01JYFSTSAIHUB",
        signature: "not-a-signature",
      }).success,
    ).toBe(false);
  });

  it("rejects a short nonce", () => {
    expect(
      ServiceRequestHeadersSchema.safeParse({
        keyId: "svc_arma_360",
        timestamp: 1,
        nonce: "short",
        signature: "a".repeat(64),
      }).success,
    ).toBe(false);
  });

  it("rejects a short key id", () => {
    expect(
      ServiceRequestHeadersSchema.safeParse({
        keyId: "short",
        timestamp: 1,
        nonce: "nonce_01JYFSTSAIHUB",
        signature: "a".repeat(64),
      }).success,
    ).toBe(false);
  });
});

describe("service request canonicalization", () => {
  it("produces a deterministic signed representation", () => {
    expect(
      canonicalizeServiceRequest({
        method: "post",
        pathname: "/v1/executions/authorize",
        timestamp: 1_800_000_000_000,
        nonce: "nonce_01JYFSTSAIHUB",
        bodyDigest: "ABCDEF",
      }),
    ).toBe(
      "POST\n/v1/executions/authorize\n1800000000000\nnonce_01JYFSTSAIHUB\nabcdef",
    );
  });

  it("is stable across method case and digest case", () => {
    const upper = canonicalizeServiceRequest({
      method: "GET",
      pathname: "/v1/health",
      timestamp: 1,
      nonce: "nonce_01JYFSTSAIHUB",
      bodyDigest: "AB",
    });
    const lower = canonicalizeServiceRequest({
      method: "get",
      pathname: "/v1/health",
      timestamp: 1,
      nonce: "nonce_01JYFSTSAIHUB",
      bodyDigest: "ab",
    });
    expect(upper).toBe(lower);
  });

  it("changes when any signed field changes", () => {
    const base = {
      method: "GET",
      pathname: "/v1/health",
      timestamp: 1,
      nonce: "nonce_01JYFSTSAIHUB",
      bodyDigest: "ab",
    };
    expect(canonicalizeServiceRequest(base)).not.toBe(
      canonicalizeServiceRequest({ ...base, nonce: "nonce_01JYFSTSAIHUB2" }),
    );
  });
});
