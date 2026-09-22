/**
 * FSTS AI Hub — Shared test fixtures and builders.
 *
 * Deterministic, tenant-scoped fixtures used across contract, isolation, and
 * security tests. Fixtures are explicitly labeled as test data and never
 * contain real credentials, customer data, or production identifiers.
 *
 * Owner: Full Stack Tech & Solutions LLC
 */

import type {
  ExecutionContext,
  ConnectedSystem,
  ProductSystemRegistration,
  AiIdentity,
  ToolAuthorizationRequest,
  ApprovalRequest,
} from "@fsts/contracts";

/** A fixed timestamp so tests are deterministic. */
export const FIXED_TIMESTAMP = "2026-01-01T00:00:00.000Z";

/** Build a valid execution context for a given tenant. */
export function buildExecutionContext(
  overrides: Partial<ExecutionContext> = {},
): ExecutionContext {
  return {
    tenantId: "tenant-test-a",
    organizationId: "org-test-a",
    environmentId: "env-test-1",
    environmentKind: "test",
    connectedSystemId: "sys-test-1",
    aiIdentityId: "ai-test-1",
    agentVersionId: "agentver-test-1",
    policyVersionId: "policyver-test-1",
    correlationId: "corr-test-00000001",
    actorIdentityId: "actor-test-1",
    dataClassification: "internal",
    timestamp: FIXED_TIMESTAMP,
    ...overrides,
  };
}

/** Build a connected system fixture. */
export function buildConnectedSystem(
  overrides: Partial<ConnectedSystem> = {},
): ConnectedSystem {
  return {
    contractVersion: "v1",
    id: "sys-test-1",
    tenantId: "tenant-test-a",
    organizationId: "org-test-a",
    name: "Test System",
    ownership: "fsts_first_party",
    dataRegion: "us",
    retentionPolicy: {
      policyId: "ret-test-1",
      retentionDays: 365,
      legalHold: false,
    },
    adapterContractVersion: "v1",
    authorized: true,
    status: "active",
    createdAt: FIXED_TIMESTAMP,
    updatedAt: FIXED_TIMESTAMP,
    ...overrides,
  };
}

/** Build a product system registration fixture. */
export function buildProductSystemRegistration(
  overrides: Partial<ProductSystemRegistration> = {},
): ProductSystemRegistration {
  return {
    contractVersion: "v1",
    tenantId: "tenant-test-a",
    organizationId: "org-test-a",
    systemName: "Test System",
    ownership: "fsts_first_party",
    dataRegion: "us",
    adapterContractVersion: "v1",
    requestedCapabilities: ["chat"],
    correlationId: "corr-test-00000001",
    idempotencyKey: "idem-test-00000001",
    requestedAt: FIXED_TIMESTAMP,
    ...overrides,
  };
}

/** Build an AI identity fixture. */
export function buildAiIdentity(
  overrides: Partial<AiIdentity> = {},
): AiIdentity {
  return {
    contractVersion: "v1",
    id: "ai-test-1",
    tenantId: "tenant-test-a",
    organizationId: "org-test-a",
    name: "Test Assistant",
    kind: "conversational_assistant",
    ownerIdentityId: "actor-test-1",
    systemAssignments: ["sys-test-1"],
    allowedEnvironments: ["test"],
    status: "active",
    createdAt: FIXED_TIMESTAMP,
    updatedAt: FIXED_TIMESTAMP,
    ...overrides,
  };
}

/** Build a tool authorization request fixture. */
export function buildToolAuthorizationRequest(
  overrides: Partial<ToolAuthorizationRequest> = {},
): ToolAuthorizationRequest {
  return {
    contractVersion: "v1",
    tenantId: "tenant-test-a",
    organizationId: "org-test-a",
    environmentId: "env-test-1",
    connectedSystemId: "sys-test-1",
    aiIdentityId: "ai-test-1",
    agentVersionId: "agentver-test-1",
    toolId: "tool-test-1",
    arguments: {},
    dataClassification: "internal",
    correlationId: "corr-test-00000001",
    requestedAt: FIXED_TIMESTAMP,
    ...overrides,
  };
}

/** Build an approval request fixture. */
export function buildApprovalRequest(
  overrides: Partial<ApprovalRequest> = {},
): ApprovalRequest {
  return {
    contractVersion: "v1",
    id: "approval-test-1",
    tenantId: "tenant-test-a",
    organizationId: "org-test-a",
    environmentId: "env-test-1",
    connectedSystemId: "sys-test-1",
    requestingAiIdentityId: "ai-test-1",
    agentVersionId: "agentver-test-1",
    category: "financial",
    riskLevel: "high",
    requestedAction: "Test action",
    parametersIntegrityHash:
      "0000000000000000000000000000000000000000000000000000000000000000",
    parametersRef: "params-ref-test-1",
    requiredByPolicyVersionId: "policyver-test-1",
    state: "pending",
    expiresAt: "2026-01-02T00:00:00.000Z",
    correlationId: "corr-test-00000001",
    idempotencyKey: "idem-test-00000001",
    requestedAt: FIXED_TIMESTAMP,
    ...overrides,
  };
}
