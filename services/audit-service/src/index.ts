/**
 * FSTS AI Hub — Audit Service.
 *
 * Produces normalized, tamper-evident audit events. Every material execution
 * emits an audit event carrying tenant, system, environment, AI identity,
 * agent version, correlation ID, trace ID, actor, timestamp, data
 * classification, and a redacted payload.
 *
 * Audit events are redacted before persistence and carry a retention
 * classification. A chained integrity hash makes tampering detectable.
 *
 * Owner: Full Stack Tech & Solutions LLC
 */

import { createHash } from "node:crypto";
import type {
  AuditEvent,
  AuditEventType,
  DataClassification,
} from "@fsts/contracts";
import { redact } from "@fsts/redaction";

export type RetentionClass = "short" | "standard" | "long" | "legal_hold";

export interface AuditEventInput {
  id: string;
  type: AuditEventType;
  tenantId: string;
  organizationId: string;
  environmentId: string;
  connectedSystemId: string;
  aiIdentityId?: string;
  agentVersionId?: string;
  actorIdentityId: string;
  correlationId: string;
  traceId: string;
  dataClassification: DataClassification;
  retentionClass: RetentionClass;
  /** Structured detail; redacted before persistence. */
  payload?: Record<string, unknown>;
  occurredAt?: string;
}

/** Compute the integrity hash for an audit event, chained to the prior hash. */
export function computeAuditIntegrityHash(
  event: Omit<AuditEvent, "integrityHash">,
  previousHash: string,
): string {
  const canonical = JSON.stringify({
    id: event.id,
    type: event.type,
    tenantId: event.tenantId,
    organizationId: event.organizationId,
    environmentId: event.environmentId,
    connectedSystemId: event.connectedSystemId,
    aiIdentityId: event.aiIdentityId ?? null,
    agentVersionId: event.agentVersionId ?? null,
    actorIdentityId: event.actorIdentityId,
    correlationId: event.correlationId,
    traceId: event.traceId,
    dataClassification: event.dataClassification,
    retentionClass: event.retentionClass,
    payload: event.payload,
    occurredAt: event.occurredAt,
    previousHash,
  });
  return createHash("sha256").update(canonical).digest("hex");
}

/**
 * Build a normalized, redacted, integrity-protected audit event.
 */
export function buildAuditEvent(
  input: AuditEventInput,
  previousHash: string,
): AuditEvent {
  const occurredAt = input.occurredAt ?? new Date().toISOString();
  const redactedPayload = input.payload
    ? (redact(input.payload) as Record<string, unknown>)
    : {};

  const base: Omit<AuditEvent, "integrityHash"> = {
    contractVersion: "v1",
    id: input.id,
    type: input.type,
    tenantId: input.tenantId,
    organizationId: input.organizationId,
    environmentId: input.environmentId,
    connectedSystemId: input.connectedSystemId,
    ...(input.aiIdentityId !== undefined
      ? { aiIdentityId: input.aiIdentityId }
      : {}),
    ...(input.agentVersionId !== undefined
      ? { agentVersionId: input.agentVersionId }
      : {}),
    actorIdentityId: input.actorIdentityId,
    correlationId: input.correlationId,
    traceId: input.traceId,
    dataClassification: input.dataClassification,
    payload: redactedPayload,
    retentionClass: input.retentionClass,
    occurredAt,
  };

  return {
    ...base,
    integrityHash: computeAuditIntegrityHash(base, previousHash),
  };
}

/**
 * Verify a chain of audit events. Returns the index of the first event whose
 * integrity hash does not match, or -1 when the chain is intact.
 */
export function verifyAuditChain(events: AuditEvent[]): number {
  let previousHash = "GENESIS";
  for (let i = 0; i < events.length; i++) {
    const event = events[i]!;
    const { integrityHash, ...rest } = event;
    const expected = computeAuditIntegrityHash(rest, previousHash);
    if (expected !== integrityHash) return i;
    previousHash = integrityHash;
  }
  return -1;
}
