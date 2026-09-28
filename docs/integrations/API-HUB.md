# FSTS AI Hub — API Hub Integration

Owner: Full Stack Tech & Solutions LLC
Status: Foundation (Phase 1)

## 1. Purpose

This document defines the boundary between the FSTS AI Hub and the API Hub. The
AI Hub does **not** recreate the API Hub. External connectivity, provider
credentials, and outbound integrations are owned by the API Hub. The AI Hub is a
governed client of the API Hub.

## 2. Division of Responsibility

| Concern                 | Owner   |
| ----------------------- | ------- |
| External connectivity   | API Hub |
| Provider credentials    | API Hub |
| Outbound integrations   | API Hub |
| Governance and policy   | AI Hub  |
| Approval and audit      | AI Hub  |
| Model routing decisions | AI Hub  |
| Cost accounting         | AI Hub  |

## 3. The Connector

The AI Hub consumes the API Hub through `connectors/api-hub`. The connector:

- validates the operation request against `ApiHubOperationRequestSchema`,
- obtains a short-lived service token,
- submits the request to the API Hub,
- validates the response against `ApiHubOperationResponseSchema`,
- fails closed on any contract violation.

## 4. Request Contract

An API Hub operation request carries:

- contract version
- operation ID
- tenant, organization, environment, connected system
- a **credential reference** (never a value)
- validated operation parameters
- data classification
- correlation ID and idempotency key
- timeout
- request timestamp

## 5. Response Contract

An API Hub operation response carries:

- contract version
- correlation ID
- outcome (success, error, timeout, rate_limited)
- status code
- redacted payload
- error code
- retryable flag
- completion timestamp

## 6. Security Properties

- The AI Hub never holds provider credentials; it holds references.
- The AI Hub never sends an unvalidated request.
- The AI Hub never trusts an unvalidated response.
- Correlation IDs propagate end to end.
- Idempotency keys prevent duplicate operations.

## 7. Current Implementation Status

The connector interface and contract validation are **implemented and tested**.
The connector is **not yet integrated** with a live API Hub; the transport is
injected, so tests use a mock transport. A live integration requires API Hub
endpoint configuration and service credentials.

## 8. Dependencies on the API Hub

- A stable `/v1/operations` endpoint.
- Service-to-service authentication.
- Credential reference resolution.
- Response redaction guarantees.
