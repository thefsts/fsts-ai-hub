/**
 * FSTS AI Hub — API Hub connector tests.
 *
 * Verifies the connector fails closed on invalid requests/responses, carries
 * credential REFERENCES (never values), and propagates correlation IDs.
 *
 * Owner: Full Stack Tech & Solutions LLC
 */

import { describe, expect, it, vi } from "vitest";
import {
  ApiHubConnector,
  ApiHubConnectorError,
  type ApiHubTransport,
} from "./index.js";

const FIXED_TIMESTAMP = "2026-01-01T00:00:00.000Z";

function validRequest() {
  return {
    contractVersion: "v1" as const,
    operationId: "op_12345678",
    tenantId: "tenant_1",
    organizationId: "org_1",
    environmentId: "env_prod",
    connectedSystemId: "sys_1",
    credentialRef: "credref_api_hub_1",
    parameters: { query: "hello" },
    dataClassification: "internal" as const,
    correlationId: "corr_12345678",
    idempotencyKey: "idem_12345678",
    timeoutMs: 30000,
    requestedAt: FIXED_TIMESTAMP,
  };
}

function validResponse() {
  return {
    contractVersion: "v1" as const,
    correlationId: "corr_12345678",
    outcome: "success" as const,
    statusCode: 200,
    payload: { ok: true },
    retryable: false,
    completedAt: FIXED_TIMESTAMP,
  };
}

function makeConnector(transport: ApiHubTransport) {
  return new ApiHubConnector({
    baseUrl: "https://api-hub.internal",
    transport,
    getServiceToken: async () => "service-token",
  });
}

describe("ApiHubConnector", () => {
  it("invokes a valid operation and returns a validated response", async () => {
    const post = vi.fn(async () => ({ status: 200, body: validResponse() }));
    const connector = makeConnector({ post });
    const result = await connector.invoke(validRequest());
    expect(result.outcome).toBe("success");
    expect(post).toHaveBeenCalledOnce();
  });

  it("sends a credential reference, never a credential value", async () => {
    const post = vi.fn(async () => ({ status: 200, body: validResponse() }));
    const connector = makeConnector({ post });
    await connector.invoke(validRequest());
    const [, body] = post.mock.calls[0]!;
    expect((body as Record<string, unknown>).credentialRef).toBe(
      "credref_api_hub_1",
    );
    expect(JSON.stringify(body)).not.toContain("secret");
  });

  it("propagates the correlation id as a header", async () => {
    const post = vi.fn(async () => ({ status: 200, body: validResponse() }));
    const connector = makeConnector({ post });
    await connector.invoke(validRequest());
    const [, , headers] = post.mock.calls[0]!;
    expect(headers["x-correlation-id"]).toBe("corr_12345678");
  });

  it("fails closed on an invalid request", async () => {
    const post = vi.fn(async () => ({ status: 200, body: validResponse() }));
    const connector = makeConnector({ post });
    await expect(
      connector.invoke({ ...validRequest(), operationId: "" } as never),
    ).rejects.toBeInstanceOf(ApiHubConnectorError);
    expect(post).not.toHaveBeenCalled();
  });

  it("fails closed on an invalid response", async () => {
    const post = vi.fn(async () => ({ status: 200, body: { nope: true } }));
    const connector = makeConnector({ post });
    await expect(connector.invoke(validRequest())).rejects.toMatchObject({
      code: "invalid_response",
    });
  });
});
