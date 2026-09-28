/**
 * FSTS AI Hub — Authentication and identity verification primitives.
 *
 * This package does NOT implement a token issuer. It defines the trusted
 * identity model and the verification boundary that every service must use
 * before acting on a request. It is deliberately deny-by-default: an
 * unverified, ambiguous, or expired identity is rejected.
 *
 * Two identity classes are supported:
 *   - Human/actor identities (users, operators, approvers).
 *   - Service identities (service-to-service calls between AI Hub services).
 *
 * Credentials are never handled as raw values here. Token material is passed
 * to a pluggable verifier; the AI Hub stores only references to credentials
 * owned by the API Hub.
 *
 * Owner: Full Stack Tech & Solutions LLC
 */

import { z } from "zod";
import type { DataClassification } from "@fsts/contracts";

/** Identity class for an authenticated principal. */
export const PrincipalKindSchema = z.enum(["human", "service", "ai_agent"]);
export type PrincipalKind = z.infer<typeof PrincipalKindSchema>;

/**
 * A verified principal. This is only ever produced by a successful
 * verification step — never constructed from user-supplied input directly.
 */
export const VerifiedPrincipalSchema = z.object({
  principalId: z.string().min(1).max(128),
  kind: PrincipalKindSchema,
  tenantId: z.string().min(1).max(128),
  organizationId: z.string().min(1).max(128),
  /** Roles granted to this principal (RBAC). */
  roles: z.array(z.string().min(1).max(128)).default([]),
  /** Attribute claims used for ABAC decisions. */
  attributes: z.record(z.string()).default({}),
  /** Issuer that vouched for this identity. */
  issuer: z.string().min(1).max(256),
  /** Expiry of the verified session, ISO-8601. */
  expiresAt: z.string().datetime({ offset: true }),
});
export type VerifiedPrincipal = z.infer<typeof VerifiedPrincipalSchema>;

/** Raw, unverified token material presented by a caller. */
export interface PresentedCredential {
  /** Bearer token or signed assertion. Never logged, never persisted. */
  token: string;
  /** Optional audience the caller claims. */
  audience?: string;
}

/**
 * A pluggable verifier. Implementations wrap a real identity provider (e.g. an
 * OIDC/JWKS verifier). The AI Hub ships no default that trusts unsigned input.
 */
export interface IdentityVerifier {
  verify(credential: PresentedCredential): Promise<VerifiedPrincipal>;
}

export interface AuthResult {
  authenticated: boolean;
  principal?: VerifiedPrincipal;
  reason: string;
}

const DENY = (reason: string): AuthResult => ({
  authenticated: false,
  reason,
});

/**
 * Verify a presented credential using the supplied verifier. Fails closed on
 * any error, missing token, or malformed principal.
 */
export async function authenticate(
  credential: PresentedCredential | undefined,
  verifier: IdentityVerifier,
  now: Date = new Date(),
): Promise<AuthResult> {
  if (!credential || !credential.token || credential.token.length === 0) {
    return DENY("missing credential");
  }
  let principal: VerifiedPrincipal;
  try {
    principal = await verifier.verify(credential);
  } catch {
    return DENY("credential verification failed");
  }
  const parsed = VerifiedPrincipalSchema.safeParse(principal);
  if (!parsed.success) {
    return DENY("verified principal failed contract validation");
  }
  const expiresAt = new Date(parsed.data.expiresAt);
  if (
    Number.isNaN(expiresAt.getTime()) ||
    expiresAt.getTime() <= now.getTime()
  ) {
    return DENY("credential expired");
  }
  return {
    authenticated: true,
    principal: parsed.data,
    reason: "authenticated",
  };
}

/**
 * Verify a service-to-service identity. Service identities must present a
 * short-lived credential and must declare the calling service. Anonymous or
 * long-lived service calls are rejected.
 */
export interface ServiceIdentityClaim {
  serviceName: string;
  tenantId: string;
  organizationId: string;
  /** Short-lived credential reference (not the secret value). */
  credentialRef: string;
  expiresAt: string;
}

export function verifyServiceIdentity(
  claim: ServiceIdentityClaim | undefined,
  now: Date = new Date(),
): AuthResult {
  if (!claim) {
    return DENY("missing service identity");
  }
  if (!claim.serviceName || !claim.credentialRef) {
    return DENY("incomplete service identity");
  }
  const expiresAt = new Date(claim.expiresAt);
  if (
    Number.isNaN(expiresAt.getTime()) ||
    expiresAt.getTime() <= now.getTime()
  ) {
    return DENY("service credential expired");
  }
  return {
    authenticated: true,
    principal: {
      principalId: claim.serviceName,
      kind: "service",
      tenantId: claim.tenantId,
      organizationId: claim.organizationId,
      roles: [],
      attributes: {},
      issuer: "fsts-service-identity",
      expiresAt: claim.expiresAt,
    },
    reason: "service identity verified",
  };
}

/**
 * Derive a trusted execution context from a verified principal plus the
 * request's declared scope. The tenant and organization are ALWAYS taken from
 * the verified principal — never from the request body — to prevent tenant
 * spoofing.
 */
export interface ExecutionScopeInput {
  environmentId: string;
  environmentKind: "development" | "test" | "staging" | "production";
  connectedSystemId: string;
  aiIdentityId: string;
  agentVersionId: string;
  policyVersionId: string;
  promptVersionId?: string;
  workflowVersionId?: string;
  correlationId: string;
  idempotencyKey?: string;
  dataClassification: DataClassification;
}

export interface DerivedExecutionContext {
  tenantId: string;
  organizationId: string;
  environmentId: string;
  environmentKind: ExecutionScopeInput["environmentKind"];
  connectedSystemId: string;
  aiIdentityId: string;
  agentVersionId: string;
  policyVersionId: string;
  promptVersionId?: string;
  workflowVersionId?: string;
  correlationId: string;
  idempotencyKey?: string;
  actorIdentityId: string;
  dataClassification: DataClassification;
  timestamp: string;
}

export function deriveExecutionContext(
  principal: VerifiedPrincipal,
  scope: ExecutionScopeInput,
  now: Date = new Date(),
): DerivedExecutionContext {
  const ctx: DerivedExecutionContext = {
    tenantId: principal.tenantId,
    organizationId: principal.organizationId,
    environmentId: scope.environmentId,
    environmentKind: scope.environmentKind,
    connectedSystemId: scope.connectedSystemId,
    aiIdentityId: scope.aiIdentityId,
    agentVersionId: scope.agentVersionId,
    policyVersionId: scope.policyVersionId,
    correlationId: scope.correlationId,
    actorIdentityId: principal.principalId,
    dataClassification: scope.dataClassification,
    timestamp: now.toISOString(),
  };
  if (scope.promptVersionId !== undefined) {
    ctx.promptVersionId = scope.promptVersionId;
  }
  if (scope.workflowVersionId !== undefined) {
    ctx.workflowVersionId = scope.workflowVersionId;
  }
  if (scope.idempotencyKey !== undefined) {
    ctx.idempotencyKey = scope.idempotencyKey;
  }
  return ctx;
}
