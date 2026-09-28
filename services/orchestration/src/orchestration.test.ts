/**
 * Tests for the Orchestration Service.
 *
 * These tests prove fail-closed gating: suspension, policy denial, and missing
 * approval each stop execution.
 */

import { describe, expect, it } from "vitest";
import { buildExecutionContext } from "@fsts/testing";
import type { ExecutionRequest } from "@fsts/contracts";
import {
  evaluateExecutionGates,
  type OrchestrationGateInput,
} from "./index.js";

function request(): ExecutionRequest {
  return {
    contractVersion: "v1",
    context: buildExecutionContext(),
    intent: "test intent",
    stream: false,
    timeoutMs: 60000,
    requestedAt: "2026-01-01T00:00:00.000Z",
  };
}

function gate(
  overrides: Partial<OrchestrationGateInput> = {},
): OrchestrationGateInput {
  return {
    request: request(),
    suspensions: [],
    policyAllowed: true,
    approvalSatisfied: true,
    ...overrides,
  };
}

describe("evaluateExecutionGates", () => {
  it("proceeds when all gates pass", () => {
    expect(evaluateExecutionGates(gate()).proceed).toBe(true);
  });

  it("stops on a global emergency stop", () => {
    const result = evaluateExecutionGates(
      gate({
        suspensions: [{ scope: "global", globalEmergencyStop: true }],
      }),
    );
    expect(result.proceed).toBe(false);
    expect(result.reason).toContain("suspension");
  });

  it("stops when policy denies", () => {
    const result = evaluateExecutionGates(gate({ policyAllowed: false }));
    expect(result.proceed).toBe(false);
    expect(result.reason).toContain("policy");
  });

  it("stops when approval is unsatisfied", () => {
    const result = evaluateExecutionGates(gate({ approvalSatisfied: false }));
    expect(result.proceed).toBe(false);
    expect(result.reason).toContain("approval");
  });

  it("stops on a tenant-scoped suspension", () => {
    const result = evaluateExecutionGates(
      gate({
        suspensions: [
          {
            scope: "tenant",
            targetId: "tenant-test-a",
            globalEmergencyStop: false,
          },
        ],
      }),
    );
    expect(result.proceed).toBe(false);
  });
});
