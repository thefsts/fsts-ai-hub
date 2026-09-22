/**
 * FSTS AI Hub — Cost Optimization Engine: tenant-safe caching.
 *
 * Cache keys must prevent cross-tenant and cross-system leakage. Caching is
 * permitted only when allowed by tenant policy, data classification, privacy,
 * retention, product-system policy, prompt/workflow version, and model
 * constraints.
 *
 * Owner: Full Stack Tech & Solutions LLC
 */

import { createHash } from "node:crypto";
import type { DataClassification } from "@fsts/contracts";

export interface CachePolicy {
  tenantId: string;
  /** Whether caching is enabled for this tenant. */
  cachingEnabled: boolean;
  /** Data classifications that may be cached. */
  cacheableClassifications: DataClassification[];
  /** Whether personalized output may be cached. */
  allowPersonalized: boolean;
  /** Whether volatile output may be cached. */
  allowVolatile: boolean;
  /** Whether high-risk output may be cached. */
  allowHighRisk: boolean;
}

export interface CacheRequest {
  tenantId: string;
  connectedSystemId: string;
  environmentId: string;
  promptVersionId?: string;
  workflowVersionId?: string;
  modelOrCompatibilityClass: string;
  policyVersionId: string;
  dataClassification: DataClassification;
  isPersonalized: boolean;
  isVolatile: boolean;
  isHighRisk: boolean;
}

export interface CacheDecisionResult {
  allowed: boolean;
  reason: string;
  cacheKey?: string;
}

/**
 * Build a tenant-safe cache key. The key incorporates tenant, system, and
 * environment scope so that identical content in different scopes never
 * collides.
 */
export function buildCacheKey(request: CacheRequest): string {
  const material = [
    request.tenantId,
    request.connectedSystemId,
    request.environmentId,
    request.promptVersionId ?? "",
    request.workflowVersionId ?? "",
    request.modelOrCompatibilityClass,
    request.policyVersionId,
    request.dataClassification,
  ].join("|");
  return createHash("sha256").update(material).digest("hex");
}

/**
 * Decide whether a cache may be used. Fails closed: any disallowed condition
 * denies caching.
 */
export function decideCache(
  policy: CachePolicy,
  request: CacheRequest,
): CacheDecisionResult {
  if (!policy.cachingEnabled) {
    return { allowed: false, reason: "caching disabled for tenant" };
  }
  if (request.tenantId !== policy.tenantId) {
    return { allowed: false, reason: "tenant mismatch (cross-tenant denied)" };
  }
  if (!policy.cacheableClassifications.includes(request.dataClassification)) {
    return {
      allowed: false,
      reason: `data classification '${request.dataClassification}' is not cacheable`,
    };
  }
  if (request.isPersonalized && !policy.allowPersonalized) {
    return { allowed: false, reason: "personalized output may not be cached" };
  }
  if (request.isVolatile && !policy.allowVolatile) {
    return { allowed: false, reason: "volatile output may not be cached" };
  }
  if (request.isHighRisk && !policy.allowHighRisk) {
    return { allowed: false, reason: "high-risk output may not be cached" };
  }
  return {
    allowed: true,
    reason: "cache permitted by policy",
    cacheKey: buildCacheKey(request),
  };
}

/**
 * Verify that a cache key belongs to the requesting scope. Prevents
 * cross-tenant and cross-system cache leakage.
 */
export function verifyCacheKeyScope(
  cacheKey: string,
  request: CacheRequest,
): boolean {
  return cacheKey === buildCacheKey(request);
}
