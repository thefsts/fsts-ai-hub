/**
 * FSTS AI Hub — API Hub connector.
 *
 * The AI Hub does NOT recreate the API Hub. External connectivity, provider
 * credentials, and outbound integrations are owned by the API Hub. This
 * connector is the AI Hub's governed client: it submits operation requests
 * carrying credential REFERENCES (never values) and validates responses.
 *
 * Owner: Full Stack Tech & Solutions LLC
 */

import {
  ApiHubOperationRequestSchema,
  ApiHubOperationResponseSchema,
  type ApiHubOperationRequest,
  type ApiHubOperationResponse,
} from "@fsts/contracts";

export interface ApiHubTransport {
  post(
    path: string,
    body: unknown,
    headers: Record<string, string>,
  ): Promise<{ status: number; body: unknown }>;
}

export interface ApiHubConnectorOptions {
  baseUrl: string;
  transport: ApiHubTransport;
  getServiceToken: () => Promise<string>;
}

export class ApiHubConnectorError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "ApiHubConnectorError";
    this.code = code;
  }
}

export class ApiHubConnector {
  private readonly options: ApiHubConnectorOptions;

  constructor(options: ApiHubConnectorOptions) {
    this.options = options;
  }

  async invoke(
    request: ApiHubOperationRequest,
  ): Promise<ApiHubOperationResponse> {
    const parsed = ApiHubOperationRequestSchema.safeParse(request);
    if (!parsed.success) {
      throw new ApiHubConnectorError(
        "invalid_request",
        "API Hub request failed contract validation",
      );
    }
    const token = await this.options.getServiceToken();
    const { body } = await this.options.transport.post(
      "/v1/operations",
      parsed.data,
      {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
        "x-correlation-id": parsed.data.correlationId,
      },
    );
    const response = ApiHubOperationResponseSchema.safeParse(body);
    if (!response.success) {
      throw new ApiHubConnectorError(
        "invalid_response",
        "API Hub response failed contract validation",
      );
    }
    return response.data;
  }
}
