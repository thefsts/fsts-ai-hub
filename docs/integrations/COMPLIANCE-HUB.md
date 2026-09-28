# FSTS AI Hub — Compliance Hub Integration

Owner: Full Stack Tech & Solutions LLC
Status: Foundation (Phase 1)

## 1. Purpose

This document defines the boundary between the FSTS AI Hub and the Compliance
Hub. The Compliance Hub supplies applicable policies and control references. The
AI Hub enforces them. The Compliance Hub does not execute product actions, and
the AI Hub does not recreate compliance logic.

## 2. Division of Responsibility

| Concern                      | Owner          |
| ---------------------------- | -------------- |
| Regulatory policy definition | Compliance Hub |
| Control references           | Compliance Hub |
| Evidence requirements        | Compliance Hub |
| Policy enforcement           | AI Hub         |
| Evidence production          | AI Hub         |
| Audit records                | AI Hub         |

## 3. The Connector

The AI Hub consumes the Compliance Hub through `connectors/compliance-hub`. The
connector:

- requests applicable policies for a tenant, connected system, and data
  classification,
- validates every policy reference against
  `ComplianceHubPolicyReferenceSchema`,
- fails closed on any malformed response.

## 4. Policy Reference Contract

A Compliance Hub policy reference carries:

- contract version
- policy ID and policy version ID
- control IDs the policy maps to
- applicability scope (tenant IDs, system IDs, data classifications)
- evidence requirements
- effective-from and effective-to timestamps

## 5. Enforcement

The AI Hub enforces the policies the Compliance Hub supplies. Enforcement
happens in the policy engine and the approval engine. Evidence requirements
drive what the audit service must produce.

## 6. Security Properties

- The AI Hub validates every policy reference.
- The Compliance Hub never executes product actions.
- The AI Hub never recreates compliance logic; it enforces supplied policy.
- Correlation IDs propagate end to end.

## 7. Current Implementation Status

The connector interface and contract validation are **implemented and tested**.
The connector is **not yet integrated** with a live Compliance Hub; the
transport is injected, so tests use a mock transport. A live integration
requires Compliance Hub endpoint configuration and service credentials.

## 8. Dependencies on the Compliance Hub

- A stable `/v1/policies/applicable` endpoint.
- Service-to-service authentication.
- Stable control and evidence identifiers.
