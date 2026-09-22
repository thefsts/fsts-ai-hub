/**
 * Tests for the Agent Runtime.
 *
 * These tests prove allowlist enforcement and self-elevation prevention.
 */

import { describe, expect, it } from "vitest";
import type { AgentVersion } from "@fsts/contracts";
import { authorizeAgentAction, isSelfElevationAttempt } from "./index.js";

function version(overrides: Partial<AgentVersion> = {}): AgentVersion {
  return {
    contractVersion: "v1",
    id: "av-1",
    agentId: "agent-1",
    version: "1.0.0",
    allowedModels: ["model-a"],
    allowedTools: ["tool-a"],
    allowedProviders: ["provider-a"],
    memoryScopes: ["scope-a"],
    requiresApprovalForRestricted: true,
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("authorizeAgentAction", () => {
  it("allows an action within the allowlist", () => {
    const result = authorizeAgentAction(
      {
        agentVersionId: "av-1",
        modelId: "model-a",
        restricted: false,
        approvalPresent: false,
      },
      version(),
    );
    expect(result.allowed).toBe(true);
  });

  it("denies a model outside the allowlist", () => {
    const result = authorizeAgentAction(
      {
        agentVersionId: "av-1",
        modelId: "model-x",
        restricted: false,
        approvalPresent: false,
      },
      version(),
    );
    expect(result.allowed).toBe(false);
  });

  it("denies a tool outside the allowlist", () => {
    const result = authorizeAgentAction(
      {
        agentVersionId: "av-1",
        toolId: "tool-x",
        restricted: false,
        approvalPresent: false,
      },
      version(),
    );
    expect(result.allowed).toBe(false);
  });

  it("denies a memory scope outside the allowlist", () => {
    const result = authorizeAgentAction(
      {
        agentVersionId: "av-1",
        memoryScopeId: "scope-x",
        restricted: false,
        approvalPresent: false,
      },
      version(),
    );
    expect(result.allowed).toBe(false);
  });

  it("requires approval for a restricted action", () => {
    const result = authorizeAgentAction(
      { agentVersionId: "av-1", restricted: true, approvalPresent: false },
      version(),
    );
    expect(result.allowed).toBe(false);
    expect(result.requiresApproval).toBe(true);
  });

  it("denies a non-active version", () => {
    const result = authorizeAgentAction(
      { agentVersionId: "av-1", restricted: false, approvalPresent: false },
      version({ status: "suspended" }),
    );
    expect(result.allowed).toBe(false);
  });
});

describe("isSelfElevationAttempt", () => {
  it("flags self-elevation", () => {
    expect(isSelfElevationAttempt("av-1", "av-1")).toBe(true);
  });

  it("allows changes to a different version", () => {
    expect(isSelfElevationAttempt("av-1", "av-2")).toBe(false);
  });
});
