/**
 * FSTS AI Hub — Orchestration Service.
 *
 * Plans and coordinates governed AI executions. The orchestrator produces an
 * execution plan, then gates each step through policy, approval, suspension,
 * and the model gateway. It never executes a step that has not passed every
 * gate.
 *
 * Owner: Full Stack Tech & Solutions LLC
 */

import type {
  ExecutionPlan,
  ExecutionPlanStep,
  ExecutionRequest,
} from "@fsts/contracts";
import { isDeniedBySuspension } from "@fsts/contracts";

export interface OrchestrationGateInput {
  request: ExecutionRequest;
  /** Active suspensions that may deny the execution. */
  suspensions: Array<{
    scope: "agent" | "tool" | "provider" | "system" | "tenant" | "global";
    targetId?: string | undefined;
    tenantId?: string | undefined;
    globalEmergencyStop: boolean;
    expiresAt?: string | undefined;
  }>;
  /** Whether policy allowed the request. */
  policyAllowed: boolean;
  /** Whether a required approval is present and valid. */
  approvalSatisfied: boolean;
}

export interface OrchestrationGateResult {
  proceed: boolean;
  reason: string;
}

/**
 * Evaluate the pre-execution gates. Fails closed: any failed gate stops the
 * execution.
 */
export function evaluateExecutionGates(
  input: OrchestrationGateInput,
): OrchestrationGateResult {
  const { request } = input;

  // Emergency suspension / global stop takes precedence over everything.
  const denied = isDeniedBySuspension(input.suspensions, {
    tenantId: request.context.tenantId,
    agentVersionId: request.context.agentVersionId,
    connectedSystemId: request.context.connectedSystemId,
  });
  if (denied) {
    return { proceed: false, reason: "execution denied by active suspension" };
  }

  if (!input.policyAllowed) {
    return { proceed: false, reason: "execution denied by policy" };
  }

  if (!input.approvalSatisfied) {
    return {
      proceed: false,
      reason: "execution requires an unsatisfied approval",
    };
  }

  return { proceed: true, reason: "all execution gates passed" };
}

/**
 * Build an execution plan from a request. The plan is a deterministic sequence
 * of steps; it does not execute anything.
 */
export function buildExecutionPlan(
  request: ExecutionRequest,
  steps: ExecutionPlanStep[],
  planId: string,
): ExecutionPlan {
  return {
    contractVersion: "v1",
    id: planId,
    requestCorrelationId: request.context.correlationId,
    steps,
    createdAt: new Date().toISOString(),
  };
}
