/**
 * Tests for the typed client SDK.
 *
 * These tests prove that invalid requests are rejected before transmission and
 * that invalid responses are rejected before use.
 */

import { describe, expect, it } from "vitest";
import { HubClient, HubClientError, type HubTransport } from "./index.js";

function makeTransport(
  responder: (path: string, body: unknown) => { status: number; body: unknown },
): { transport: HubTransport; calls: Array<{ path: string; body: unknown }> } {
  const calls: Array<{ path: string; body: unknown }> = [];
  const transport: HubTransport = {
    send: async (path, body) => {
      calls.push({ path, body });
      return responder(path, body);
    },
  };
  return { transport, calls };
}

const validRequest = {
  contractVersion: "v1" as const,
  adapterContractVersion: "v1" as const,
  tenantId: "tenant-a",
  organizationId: "org-a",
  environmentId: "env-1",
  connectedSystemId: "sys-1",
  actorIdentityId: "actor-1",
  aiIdentityId: "ai-1",
  operation: "chat",
  payload: {},
  correlationId: "corr-12345678",
  idempotencyKey: "idem-12345678",
  requestedAt: "2026-01-01T00:00:00.000Z",
};

describe("HubClient", () => {
  it("rejects an invalid request without a network call", async () => {
    const { transport, calls } = makeTransport(() => ({
      status: 200,
      body: {},
    }));
    const client = new HubClient({
      baseUrl: "https://hub.example",
      transport,
      getToken: async () => "token",
    });
    await expect(
      client.submitProductRequest({ ...validRequest, tenantId: "" }),
    ).rejects.toBeInstanceOf(HubClientError);
    expect(calls.length).toBe(0);
  });

  it("rejects an invalid response", async () => {
    const { transport } = makeTransport(() => ({
      status: 200,
      body: { nope: true },
    }));
    const client = new HubClient({
      baseUrl: "https://hub.example",
      transport,
      getToken: async () => "token",
    });
    await expect(
      client.submitProductRequest(validRequest),
    ).rejects.toBeInstanceOf(HubClientError);
  });

  it("returns a validated response", async () => {
    const { transport } = makeTransport(() => ({
      status: 200,
      body: {
        contractVersion: "v1",
        correlationId: "corr-12345678",
        outcome: "success",
        requiresProductRevalidation: true,
        completedAt: "2026-01-01T00:00:01.000Z",
      },
    }));
    const client = new HubClient({
      baseUrl: "https://hub.example",
      transport,
      getToken: async () => "token",
    });
    const response = await client.submitProductRequest(validRequest);
    expect(response.outcome).toBe("success");
  });

  it("builds a well-formed request with a correlation ID", () => {
    const { transport } = makeTransport(() => ({ status: 200, body: {} }));
    const client = new HubClient({
      baseUrl: "https://hub.example",
      transport,
      getToken: async () => "token",
      newCorrelationId: () => "corr-fixed-0001",
    });
    const request = client.buildProductRequest({
      adapterContractVersion: "v1",
      tenantId: "tenant-a",
      organizationId: "org-a",
      environmentId: "env-1",
      connectedSystemId: "sys-1",
      actorIdentityId: "actor-1",
      aiIdentityId: "ai-1",
      operation: "chat",
      payload: {},
      idempotencyKey: "idem-12345678",
    });
    expect(request.correlationId).toBe("corr-fixed-0001");
    expect(request.contractVersion).toBe("v1");
  });
});
