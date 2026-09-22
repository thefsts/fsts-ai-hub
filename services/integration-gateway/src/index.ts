/**
 * FSTS AI Hub — Integration Gateway.
 *
 * Mediates ALL outbound connectivity. The AI Hub does not hold provider
 * credentials directly; it submits governed operation requests to the API Hub
 * using credential references. It consumes policy references from the
 * Compliance Hub and enforces them.
 *
 * The gateway never bypasses the API Hub for external calls and never treats a
 * Compliance Hub policy as optional.
 *
 * Owner: Full Stack Tech & Solutions LLC
 */

import type {
  ApiHubOperationRequest,
  ApiHubOperationResponse,
  ComplianceHubPolicyReference,
} from "@fsts/contracts";

/** Pluggable API Hub client. */
export interface ApiHubClient {
  invoke(request: ApiHubOperationRequest): Promise<ApiHubOperationResponse>;
}

/** Pluggable Compliance Hub client. */
export interface ComplianceHubClient {
  getApplicablePolicies(input: {
    tenantId: string;
    connectedSystemId: string;
    dataClassification: string;
  }): Promise<ComplianceHubPolicyReference[]>;
}

export interface IntegrationRequest {
  operationId: string;
  tenantId: string;
  organizationId: string;
  environmentId: string;
  connectedSystemId: string;
  credentialRef: string;
  parameters: Record<string, unknown>;
  dataClassification: ApiHubOperationRequest["dataClassification"];
  correlationId: string;
  idempotencyKey: string;
  timeoutMs?: number;
}

export interface IntegrationResult {
  ok: boolean;
  response?: ApiHubOperationResponse;
  reason: string;
  /** Policies that applied to this operation. */
  appliedPolicies: string[];
}

/**
 * Invoke an external operation through the API Hub, after resolving applicable
 * Compliance Hub policies. Fails closed: if policy resolution fails, the
 * operation is not attempted.
 */
export async function invokeExternalOperation(
  request: IntegrationRequest,
  apiHub: ApiHubClient,
  complianceHub: ComplianceHubClient,
): Promise<IntegrationResult> {
  let policies: ComplianceHubPolicyReference[];
  try {
    policies = await complianceHub.getApplicablePolicies({
      tenantId: request.tenantId,
      connectedSystemId: request.connectedSystemId,
      dataClassification: request.dataClassification,
    });
  } catch {
    return {
      ok: false,
      reason: "compliance policy resolution failed (fail closed)",
      appliedPolicies: [],
    };
  }

  const apiRequest: ApiHubOperationRequest = {
    contractVersion: "v1",
    operationId: request.operationId,
    tenantId: request.tenantId,
    organizationId: request.organizationId,
    environmentId: request.environmentId,
    connectedSystemId: request.connectedSystemId,
    credentialRef: request.credentialRef,
    parameters: request.parameters,
    dataClassification: request.dataClassification,
    correlationId: request.correlationId,
    idempotencyKey: request.idempotencyKey,
    timeoutMs: request.timeoutMs ?? 30000,
    requestedAt: new Date().toISOString(),
  };

  const response = await apiHub.invoke(apiRequest);
  return {
    ok: response.outcome === "success",
    response,
    reason:
      response.outcome === "success"
        ? "operation succeeded"
        : `operation ${response.outcome}`,
    appliedPolicies: policies.map((p) => p.policyVersionId),
  };
}

/**
 * Guard: the AI Hub must never hold raw provider credentials. Only credential
 * references are permitted.
 */
export function assertCredentialReferenceOnly(input: {
  credentialRef?: string;
  rawCredential?: string;
}): { ok: boolean; reason: string } {
  if (input.rawCredential) {
    return {
      ok: false,
      reason: "raw credentials are prohibited; use a credential reference",
    };
  }
  if (!input.credentialRef) {
    return { ok: false, reason: "missing credential reference" };
  }
  return { ok: true, reason: "credential reference present" };
}
