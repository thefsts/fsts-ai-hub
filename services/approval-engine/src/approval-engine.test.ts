/**
 * Tests for the Approval Engine.
 *
 * These tests prove the approval lifecycle, self-approval prohibition, expiry
 * rejection, and parameter-binding (no approval reuse for a different action).
 */

import { describe, expect, it } from "vitest";
import { buildApprovalRequest } from "@fsts/testing";
import {
  requiresHumanApproval,
  transitionApproval,
  validateApprovalForExecution,
} from "./index.js";

const HASH_A = "a".repeat(64);
const HASH_B = "b".repeat(64);

describe("transitionApproval", () => {
  it("allows pending -> approved", () => {
    expect(transitionApproval("pending", "approved").ok).toBe(true);
  });

  it("rejects approved -> pending", () => {
    expect(transitionApproval("approved", "pending").ok).toBe(false);
  });

  it("rejects any transition out of a terminal state", () => {
    expect(transitionApproval("executed", "approved").ok).toBe(false);
    expect(transitionApproval("rejected", "approved").ok).toBe(false);
  });
});

describe("validateApprovalForExecution", () => {
  it("rejects an approval not in approved state", () => {
    const request = buildApprovalRequest({ state: "pending" });
    const result = validateApprovalForExecution({
      request,
      approverIdentityId: "human-1",
      actionParametersIntegrityHash: HASH_A,
    });
    expect(result.valid).toBe(false);
  });

  it("rejects self-approval", () => {
    const request = buildApprovalRequest({
      state: "approved",
      requestingAiIdentityId: "ai-1",
      parametersIntegrityHash: HASH_A,
    });
    const result = validateApprovalForExecution({
      request,
      approverIdentityId: "ai-1",
      actionParametersIntegrityHash: HASH_A,
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("self-approval");
  });

  it("rejects an expired approval", () => {
    const request = buildApprovalRequest({
      state: "approved",
      parametersIntegrityHash: HASH_A,
      expiresAt: "2020-01-01T00:00:00.000Z",
    });
    const result = validateApprovalForExecution({
      request,
      approverIdentityId: "human-1",
      actionParametersIntegrityHash: HASH_A,
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("expired");
  });

  it("rejects an approval reused for a different action", () => {
    const request = buildApprovalRequest({
      state: "approved",
      parametersIntegrityHash: HASH_A,
      expiresAt: "2999-01-01T00:00:00.000Z",
    });
    const result = validateApprovalForExecution({
      request,
      approverIdentityId: "human-1",
      actionParametersIntegrityHash: HASH_B,
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("does not apply");
  });

  it("accepts a valid, applicable, unexpired approval", () => {
    const request = buildApprovalRequest({
      state: "approved",
      parametersIntegrityHash: HASH_A,
      expiresAt: "2999-01-01T00:00:00.000Z",
    });
    const result = validateApprovalForExecution({
      request,
      approverIdentityId: "human-1",
      actionParametersIntegrityHash: HASH_A,
    });
    expect(result.valid).toBe(true);
  });
});

describe("requiresHumanApproval", () => {
  it("requires approval for restricted categories", () => {
    expect(requiresHumanApproval("financial")).toBe(true);
    expect(requiresHumanApproval("destructive")).toBe(true);
  });

  it("does not require approval for unknown categories", () => {
    expect(requiresHumanApproval("read_only")).toBe(false);
  });
});
