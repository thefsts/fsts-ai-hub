/**
 * FSTS AI Hub — Compliance Hub connector tests.
 *
 * Verifies the connector validates every policy reference and fails closed on
 * malformed responses. The Compliance Hub supplies policies; the AI Hub
 * enforces them.
 *
 * Owner: Full Stack Tech & Solutions LLC
 */

import { describe, expect, it, vi } from "vitest";
import {
  ComplianceHubConnector,
  ComplianceHubConnectorError,
  type ComplianceHubTransport,
} from "./index.js";

const FIXED_TIMESTAMP = "2026-01-01T00:00:00.000Z";

function validPolicy() {
  return {
    contractVersion: "v1" as const,
    policyId: "policy_1",
    policyVersionId: "policyver_1",
    controlIds: ["ctrl_1"],
    appliesTo: {
      tenantIds: ["tenant_1"],
      systemIds: ["sys_1"],
      dataClassifications: ["internal" as const],
    },
    evidenceRequirements: ["evidence_1"],
    effectiveFrom: FIXED_TIMESTAMP,
  };
}

function makeConnector(transport: ComplianceHubTransport) {
  return new ComplianceHubConnector({
    baseUrl: "https://compliance-hub.internal",
    transport,
    getServiceToken: async () => "service-token",
  });
}

describe("ComplianceHubConnector", () => {
  it("returns validated applicable policies", async () => {
    const get = vi.fn(async () => ({ status: 200, body: [validPolicy()] }));
    const connector = makeConnector({ get });
    const policies = await connector.getApplicablePolicies({
      tenantId: "tenant_1",
      connectedSystemId: "sys_1",
      dataClassification: "internal",
    });
    expect(policies).toHaveLength(1);
    expect(policies[0]!.policyId).toBe("policy_1");
  });

  it("passes tenant and system scope as query parameters", async () => {
    const get = vi.fn(async () => ({ status: 200, body: [] }));
    const connector = makeConnector({ get });
    await connector.getApplicablePolicies({
      tenantId: "tenant_1",
      connectedSystemId: "sys_1",
      dataClassification: "internal",
    });
    const [, query] = get.mock.calls[0]!;
    expect(query.tenantId).toBe("tenant_1");
    expect(query.connectedSystemId).toBe("sys_1");
  });

  it("fails closed when the response is not an array", async () => {
    const get = vi.fn(async () => ({ status: 200, body: { nope: true } }));
    const connector = makeConnector({ get });
    await expect(
      connector.getApplicablePolicies({
        tenantId: "tenant_1",
        connectedSystemId: "sys_1",
        dataClassification: "internal",
      }),
    ).rejects.toMatchObject({ code: "invalid_response" });
  });

  it("fails closed when a policy reference is malformed", async () => {
    const get = vi.fn(async () => ({
      status: 200,
      body: [{ policyId: "policy_1" }],
    }));
    const connector = makeConnector({ get });
    await expect(
      connector.getApplicablePolicies({
        tenantId: "tenant_1",
        connectedSystemId: "sys_1",
        dataClassification: "internal",
      }),
    ).rejects.toBeInstanceOf(ComplianceHubConnectorError);
  });
});
