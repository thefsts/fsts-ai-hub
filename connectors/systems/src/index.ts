/**
 * FSTS AI Hub — Product system connector.
 *
 * Product systems connect through versioned product-side adapters. They must
 * never receive unrestricted direct access to internal Hub services. This
 * connector defines the adapter boundary and enforces that product systems
 * revalidate actions before applying them.
 *
 * FSTS-owned products and authorized client systems (e.g. PlayRaise) are
 * classified separately and receive independent tenant boundaries.
 *
 * Owner: Full Stack Tech & Solutions LLC
 */

import {
  ProductAdapterRequestSchema,
  ProductAdapterResponseSchema,
  type ProductAdapterRequest,
  type ProductAdapterResponse,
} from "@fsts/contracts";

export interface ProductSystemAdapter {
  /** The adapter contract version this product implements. */
  readonly adapterContractVersion: string;
  /** Handle a request from the AI Hub. */
  handle(request: ProductAdapterRequest): Promise<ProductAdapterResponse>;
}

/**
 * Validate an inbound product adapter request before dispatch. Fails closed on
 * any contract violation.
 */
export function validateProductRequest(
  request: unknown,
):
  { ok: true; request: ProductAdapterRequest } | { ok: false; reason: string } {
  const parsed = ProductAdapterRequestSchema.safeParse(request);
  if (!parsed.success) {
    return {
      ok: false,
      reason: "product adapter request failed contract validation",
    };
  }
  return { ok: true, request: parsed.data };
}

/**
 * Validate an outbound product adapter response. Product systems must revalidate
 * actions before applying them; the response contract carries that flag.
 */
export function validateProductResponse(
  response: unknown,
):
  | { ok: true; response: ProductAdapterResponse }
  | { ok: false; reason: string } {
  const parsed = ProductAdapterResponseSchema.safeParse(response);
  if (!parsed.success) {
    return {
      ok: false,
      reason: "product adapter response failed contract validation",
    };
  }
  return { ok: true, response: parsed.data };
}
