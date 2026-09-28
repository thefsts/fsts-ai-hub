/**
 * FSTS AI Hub — Typed client SDK.
 *
 * Product systems and internal services use this SDK to submit governed
 * requests through versioned contracts. The SDK never holds provider
 * credentials; it carries credential references and correlation metadata.
 *
 * The transport is pluggable so the SDK can be tested without a live Hub and
 * so product adapters can supply their own HTTP client.
 *
 * Owner: Full Stack Tech & Solutions LLC
 */

import {
  ProductAdapterRequestSchema,
  ProductAdapterResponseSchema,
  type ProductAdapterRequest,
  type ProductAdapterResponse,
} from "@fsts/contracts";

/** Pluggable transport used to reach the AI Hub. */
export interface HubTransport {
  send(
    path: string,
    body: unknown,
    headers: Record<string, string>,
  ): Promise<{ status: number; body: unknown }>;
}

export interface HubClientOptions {
  baseUrl: string;
  transport: HubTransport;
  /** Bearer token supplier. Called per request; never cached in the SDK. */
  getToken: () => Promise<string>;
  /** Default correlation ID factory. */
  newCorrelationId?: () => string;
}

export class HubClientError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "HubClientError";
    this.status = status;
    this.code = code;
  }
}

function defaultCorrelationId(): string {
  return `corr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Typed client for the product adapter surface. All requests are validated
 * against the versioned contract before transmission, and all responses are
 * validated before use.
 */
export class HubClient {
  private readonly options: HubClientOptions;

  constructor(options: HubClientOptions) {
    this.options = options;
  }

  /**
   * Submit a product adapter request. The request is validated locally before
   * transmission; an invalid request is rejected without a network call.
   */
  async submitProductRequest(
    request: ProductAdapterRequest,
  ): Promise<ProductAdapterResponse> {
    const parsed = ProductAdapterRequestSchema.safeParse(request);
    if (!parsed.success) {
      throw new HubClientError(
        400,
        "invalid_request",
        `request failed contract validation: ${parsed.error.issues
          .map((i) => i.path.join("."))
          .join(", ")}`,
      );
    }
    const token = await this.options.getToken();
    const { status, body } = await this.options.transport.send(
      "/v1/product-adapter",
      parsed.data,
      {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
        "x-correlation-id": parsed.data.correlationId,
      },
    );
    const response = ProductAdapterResponseSchema.safeParse(body);
    if (!response.success) {
      throw new HubClientError(
        status,
        "invalid_response",
        "response failed contract validation",
      );
    }
    return response.data;
  }

  /** Build a well-formed product adapter request with a fresh correlation ID. */
  buildProductRequest(
    input: Omit<
      ProductAdapterRequest,
      "contractVersion" | "correlationId" | "requestedAt"
    > & {
      correlationId?: string;
      requestedAt?: string;
    },
  ): ProductAdapterRequest {
    const correlationId =
      input.correlationId ??
      (this.options.newCorrelationId ?? defaultCorrelationId)();
    return {
      contractVersion: "v1",
      adapterContractVersion: input.adapterContractVersion,
      tenantId: input.tenantId,
      organizationId: input.organizationId,
      environmentId: input.environmentId,
      connectedSystemId: input.connectedSystemId,
      actorIdentityId: input.actorIdentityId,
      aiIdentityId: input.aiIdentityId,
      operation: input.operation,
      payload: input.payload,
      correlationId,
      idempotencyKey: input.idempotencyKey,
      requestedAt: input.requestedAt ?? new Date().toISOString(),
    };
  }
}
