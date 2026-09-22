/**
 * FSTS AI Hub — Emergency suspension and shutdown contracts.
 *
 * Owner: Full Stack Tech & Solutions LLC
 */

import { z } from "zod";
import {
  ContractVersionSchema,
  IdSchema,
  TimestampSchema,
} from "./primitives.js";

export const SUSPENSION_CONTRACT_VERSION = "v1" as const;

/** The scope of a suspension. */
export const SuspensionScopeSchema = z.enum([
  "agent",
  "tool",
  "provider",
  "system",
  "tenant",
  "global",
]);
export type SuspensionScope = z.infer<typeof SuspensionScopeSchema>;

/**
 * An emergency suspension request. Suspensions are fail-closed: once issued,
 * the affected scope is denied until explicitly lifted.
 */
export const EmergencySuspensionSchema = z.object({
  contractVersion: ContractVersionSchema,
  id: IdSchema,
  scope: SuspensionScopeSchema,
  /** The specific target ID for the scope (omitted for global). */
  targetId: IdSchema.optional(),
  tenantId: IdSchema.optional(),
  reason: z.string().min(1).max(2048),
  /** The human or service identity issuing the suspension. */
  issuedBy: IdSchema,
  /** Whether this is a global emergency stop. */
  globalEmergencyStop: z.boolean(),
  correlationId: z.string().min(8).max(128),
  issuedAt: TimestampSchema,
  /** Optional automatic expiry; absent means indefinite until lifted. */
  expiresAt: TimestampSchema.optional(),
});
export type EmergencySuspension = z.infer<typeof EmergencySuspensionSchema>;

/** A request to lift a suspension. */
export const SuspensionLiftSchema = z.object({
  contractVersion: ContractVersionSchema,
  suspensionId: IdSchema,
  liftedBy: IdSchema,
  reason: z.string().min(1).max(2048),
  correlationId: z.string().min(8).max(128),
  liftedAt: TimestampSchema,
});
export type SuspensionLift = z.infer<typeof SuspensionLiftSchema>;

/**
 * Guard: a global emergency stop denies everything. Returns true when the
 * given scope/target is denied by the provided active suspensions.
 */
export function isDeniedBySuspension(
  suspensions: Array<{
    scope: SuspensionScope;
    targetId?: string | undefined;
    tenantId?: string | undefined;
    globalEmergencyStop: boolean;
    expiresAt?: string | undefined;
  }>,
  context: {
    tenantId: string;
    agentVersionId?: string | undefined;
    toolId?: string | undefined;
    providerId?: string | undefined;
    connectedSystemId?: string | undefined;
  },
  now: Date = new Date(),
): boolean {
  for (const s of suspensions) {
    if (s.expiresAt && new Date(s.expiresAt).getTime() <= now.getTime()) {
      continue;
    }
    if (s.globalEmergencyStop) return true;
    switch (s.scope) {
      case "global":
        return true;
      case "tenant":
        if (s.targetId === context.tenantId) return true;
        break;
      case "agent":
        if (s.targetId && s.targetId === context.agentVersionId) return true;
        break;
      case "tool":
        if (s.targetId && s.targetId === context.toolId) return true;
        break;
      case "provider":
        if (s.targetId && s.targetId === context.providerId) return true;
        break;
      case "system":
        if (s.targetId && s.targetId === context.connectedSystemId) return true;
        break;
    }
  }
  return false;
}
