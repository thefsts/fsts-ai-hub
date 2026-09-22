/**
 * FSTS AI Hub — Cost Optimization Engine: cost attribution.
 *
 * Client-owned environments (including PlayRaise) must have separate cost
 * attribution and must not be blended into FSTS-owned product costs.
 *
 * Owner: Full Stack Tech & Solutions LLC
 */

import type { AiCostRecord, SystemOwnership } from "@fsts/contracts";

export interface AttributionBucket {
  dimension: string;
  dimensionKey: string;
  systemOwnership: SystemOwnership;
  amount: number;
  currency: string;
}

/**
 * Attribute a set of cost records across dimensions. Client-owned and
 * FSTS-owned costs are always kept in separate buckets.
 */
export function attributeCosts(records: AiCostRecord[]): AttributionBucket[] {
  const buckets = new Map<string, AttributionBucket>();

  const add = (
    dimension: string,
    dimensionKey: string,
    ownership: SystemOwnership,
    amount: number,
    currency: string,
  ): void => {
    const key = `${dimension}::${dimensionKey}::${ownership}::${currency}`;
    const existing = buckets.get(key);
    if (existing) {
      existing.amount += amount;
    } else {
      buckets.set(key, {
        dimension,
        dimensionKey,
        systemOwnership: ownership,
        amount,
        currency,
      });
    }
  };

  for (const r of records) {
    const cost = r.actualBilledCost ?? r.estimatedCost;
    const ownership = r.systemOwnership;
    // System dimension distinguishes FSTS-owned from client-owned.
    add(
      ownership === "client_owned" ? "client_system" : "fsts_system",
      r.connectedSystemId,
      ownership,
      cost,
      r.currency,
    );
    add("tenant", r.tenantId, ownership, cost, r.currency);
    if (r.customerId)
      add("customer", r.customerId, ownership, cost, r.currency);
    add("ai_identity", r.aiIdentityId, ownership, cost, r.currency);
    add("agent", r.agentVersionId, ownership, cost, r.currency);
    if (r.workflowId)
      add("workflow", r.workflowId, ownership, cost, r.currency);
    add("provider", r.providerId, ownership, cost, r.currency);
    add("model", r.modelId, ownership, cost, r.currency);
    add("environment", r.environmentId, ownership, cost, r.currency);
    add(
      r.executionStatus === "success"
        ? "successful_execution"
        : "failed_execution",
      r.connectedSystemId,
      ownership,
      cost,
      r.currency,
    );
    if (r.businessOutcome) {
      add("business_outcome", r.businessOutcome, ownership, cost, r.currency);
    }
  }

  return [...buckets.values()];
}

/**
 * Compute waste attribution from usage signals. Returns cost attributed to
 * retries, agent loops, cache misses, excessive context, excessive retrieval,
 * and provider errors.
 */
export function attributeWaste(
  records: AiCostRecord[],
  signals: Map<
    string,
    {
      retryCost: number;
      agentLoopCost: number;
      cacheMissCost: number;
      excessiveContextCost: number;
      excessiveRetrievalCost: number;
      providerErrorCost: number;
    }
  >,
): AttributionBucket[] {
  const buckets: AttributionBucket[] = [];
  for (const r of records) {
    const s = signals.get(r.id);
    if (!s) continue;
    const push = (dimension: string, amount: number): void => {
      if (amount <= 0) return;
      buckets.push({
        dimension,
        dimensionKey: r.connectedSystemId,
        systemOwnership: r.systemOwnership,
        amount,
        currency: r.currency,
      });
    };
    push("retry_waste", s.retryCost);
    push("agent_loop_waste", s.agentLoopCost);
    push("cache_miss_waste", s.cacheMissCost);
    push("excessive_context_waste", s.excessiveContextCost);
    push("excessive_retrieval_waste", s.excessiveRetrievalCost);
    push("provider_error_waste", s.providerErrorCost);
  }
  return buckets;
}

/**
 * Guard: client-owned costs must never be blended into FSTS-owned totals.
 * Returns true when the two sets are properly separated.
 */
export function areOwnershipCostsSeparated(
  buckets: AttributionBucket[],
): boolean {
  for (const b of buckets) {
    if (b.dimension === "fsts_system" && b.systemOwnership === "client_owned") {
      return false;
    }
    if (
      b.dimension === "client_system" &&
      b.systemOwnership !== "client_owned"
    ) {
      return false;
    }
  }
  return true;
}
