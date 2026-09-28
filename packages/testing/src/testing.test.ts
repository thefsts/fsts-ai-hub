/**
 * FSTS AI Hub — Shared test fixture tests.
 *
 * Every fixture builder must produce data that passes its contract schema. This
 * guards against fixtures drifting away from the canonical contracts.
 *
 * Owner: Full Stack Tech & Solutions LLC
 */

import { describe, expect, it } from "vitest";
import {
  AiIdentitySchema,
  ApprovalRequestSchema,
  ConnectedSystemSchema,
  ExecutionContextSchema,
  ProductSystemRegistrationSchema,
  ToolAuthorizationRequestSchema,
} from "@fsts/contracts";
import {
  buildAiIdentity,
  buildApprovalRequest,
  buildConnectedSystem,
  buildExecutionContext,
  buildProductSystemRegistration,
  buildToolAuthorizationRequest,
} from "./index.js";

describe("test fixtures conform to contracts", () => {
  it("execution context fixture is valid", () => {
    expect(
      ExecutionContextSchema.safeParse(buildExecutionContext()).success,
    ).toBe(true);
  });

  it("connected system fixture is valid", () => {
    expect(
      ConnectedSystemSchema.safeParse(buildConnectedSystem()).success,
    ).toBe(true);
  });

  it("product system registration fixture is valid", () => {
    expect(
      ProductSystemRegistrationSchema.safeParse(
        buildProductSystemRegistration(),
      ).success,
    ).toBe(true);
  });

  it("ai identity fixture is valid", () => {
    expect(AiIdentitySchema.safeParse(buildAiIdentity()).success).toBe(true);
  });

  it("tool authorization request fixture is valid", () => {
    expect(
      ToolAuthorizationRequestSchema.safeParse(buildToolAuthorizationRequest())
        .success,
    ).toBe(true);
  });

  it("approval request fixture is valid", () => {
    expect(
      ApprovalRequestSchema.safeParse(buildApprovalRequest()).success,
    ).toBe(true);
  });

  it("fixtures are tenant-scoped and deterministic", () => {
    const a = buildExecutionContext();
    const b = buildExecutionContext();
    expect(a.tenantId).toBe("tenant-test-a");
    expect(a).toEqual(b);
  });

  it("overrides are applied", () => {
    const ctx = buildExecutionContext({ tenantId: "tenant-test-b" });
    expect(ctx.tenantId).toBe("tenant-test-b");
  });
});
