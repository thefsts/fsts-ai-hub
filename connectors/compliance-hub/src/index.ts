/**
 * FSTS AI Hub — Compliance Hub connector.
 *
 * The Compliance Hub supplies applicable policies and control references. The
 * AI Hub enforces them. The Compliance Hub does not execute product actions and
 * the AI Hub does not recreate compliance logic.
 *
 * Owner: Full Stack Tech & Solutions LLC
 */

import {
  ComplianceHubPolicyReferenceSchema,
  type ComplianceHubPolicyReference,
} from "@fsts/contracts";

export interface ComplianceHubTransport {
  get(
    path: string,
    query: Record<string, string>,
    headers: Record<string, string>,
  ): Promise<{ status: number; body: unknown }>;
}

export interface ComplianceHubConnectorOptions {
  baseUrl: string;
  transport: ComplianceHubTransport;
  getServiceToken: () => Promise<string>;
}

export class ComplianceHubConnectorError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "ComplianceHubConnectorError";
    this.code = code;
  }
}

export class ComplianceHubConnector {
  private readonly options: ComplianceHubConnectorOptions;

  constructor(options: ComplianceHubConnectorOptions) {
    this.options = options;
  }

  async getApplicablePolicies(input: {
    tenantId: string;
    connectedSystemId: string;
    dataClassification: string;
  }): Promise<ComplianceHubPolicyReference[]> {
    const token = await this.options.getServiceToken();
    const { body } = await this.options.transport.get(
      "/v1/policies/applicable",
      {
        tenantId: input.tenantId,
        connectedSystemId: input.connectedSystemId,
        dataClassification: input.dataClassification,
      },
      {
        authorization: `Bearer ${token}`,
      },
    );
    if (!Array.isArray(body)) {
      throw new ComplianceHubConnectorError(
        "invalid_response",
        "Compliance Hub response was not an array",
      );
    }
    const policies: ComplianceHubPolicyReference[] = [];
    for (const item of body) {
      const parsed = ComplianceHubPolicyReferenceSchema.safeParse(item);
      if (!parsed.success) {
        throw new ComplianceHubConnectorError(
          "invalid_policy",
          "Compliance Hub policy failed contract validation",
        );
      }
      policies.push(parsed.data);
    }
    return policies;
  }
}
