/**
 * FSTS AI Hub — Agent Runtime.
 *
 * Executes versioned agents with enforced allowlists. An agent version may only
 * use the models, tools, providers, and memory scopes it was granted. Any
 * attempt to use something outside the version's allowlist is denied.
 *
 * The runtime never self-elevates: it cannot grant itself new permissions,
 * tools, models, or memory scopes.
 *
 * Owner: Full Stack Tech & Solutions LLC
 */

import type { AgentVersion } from "@fsts/contracts";

export interface AgentActionRequest {
  agentVersionId: string;
  modelId?: string;
  providerId?: string;
  toolId?: string;
  memoryScopeId?: string;
  /** Whether the action is on the restricted list. */
  restricted: boolean;
  /** Whether a valid approval is present for a restricted action. */
  approvalPresent: boolean;
}

export interface AgentActionDecision {
  allowed: boolean;
  reason: string;
  requiresApproval: boolean;
}

const DENY = (
  reason: string,
  requiresApproval = false,
): AgentActionDecision => ({
  allowed: false,
  reason,
  requiresApproval,
});

/**
 * Authorize an agent action against its version's allowlists. Fails closed on
 * any mismatch.
 */
export function authorizeAgentAction(
  request: AgentActionRequest,
  version: AgentVersion,
): AgentActionDecision {
  if (request.agentVersionId !== version.id) {
    return DENY("agent version mismatch");
  }
  if (version.status !== "active") {
    return DENY(`agent version is ${version.status}`);
  }
  if (request.modelId && !version.allowedModels.includes(request.modelId)) {
    return DENY("model not in agent version allowlist");
  }
  if (
    request.providerId &&
    !version.allowedProviders.includes(request.providerId)
  ) {
    return DENY("provider not in agent version allowlist");
  }
  if (request.toolId && !version.allowedTools.includes(request.toolId)) {
    return DENY("tool not in agent version allowlist");
  }
  if (
    request.memoryScopeId &&
    !version.memoryScopes.includes(request.memoryScopeId)
  ) {
    return DENY("memory scope not in agent version allowlist");
  }
  if (
    request.restricted &&
    version.requiresApprovalForRestricted &&
    !request.approvalPresent
  ) {
    return DENY("restricted action requires approval", true);
  }
  return {
    allowed: true,
    reason: "action authorized within agent version allowlist",
    requiresApproval: false,
  };
}

/**
 * Guard: an agent may never modify its own version's allowlists. Returns true
 * when the change is a self-elevation attempt.
 */
export function isSelfElevationAttempt(
  actorAgentVersionId: string,
  targetAgentVersionId: string,
): boolean {
  return actorAgentVersionId === targetAgentVersionId;
}
