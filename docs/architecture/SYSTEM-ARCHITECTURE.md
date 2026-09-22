# FSTS AI Hub — System Architecture

Owner: Full Stack Tech & Solutions LLC
Status: Foundation (Phase 1)
License: FSTS Source-Available License v1.0

## 1. Purpose

The FSTS AI Hub is the centralized governance, orchestration, security, routing,
audit, memory, cost-optimization, and lifecycle platform for approved AI
operating throughout FSTS systems and authorized client environments. It is not
a product feature and not a single application. It is the control plane that
every approved AI action passes through before it can affect a real system.

The Hub exists to answer, for every material AI action, a small set of
non-negotiable questions:

1. Who is acting (tenant, organization, environment, AI identity, agent version)?
2. On whose behalf, and against which connected system?
3. Is the action authorized by policy, and does it require human approval?
4. Which approved model, provider, and tool may be used?
5. What data classification and residency constraints apply?
6. What did the action cost, and was it within budget?
7. What is the tamper-evident record of the decision and its outcome?

If the Hub cannot answer these questions, the action does not proceed. The
default is deny.

## 2. Architectural Principles

- **Deny by default.** Nothing is permitted unless a policy explicitly allows it.
- **Fail closed.** Any error, ambiguity, timeout, or missing context results in a
  denial, never a silent allow.
- **Tenant, system, and environment isolation.** Every contract carries tenant,
  organization, environment, and connected-system identifiers. Cross-boundary
  access is rejected at the contract and authorization layers.
- **Credential references, never values.** The Hub never stores or transmits raw
  provider credentials. It carries references owned by the API Hub.
- **No AI self-elevation.** An AI identity can never grant itself permissions,
  approve its own restricted actions, or change its own budget.
- **Honest capability classification.** Every capability is labeled as
  implemented-and-tested, implemented-but-not-integrated, interface-only,
  mock-or-simulation, blocked, or not-started. No attractive placeholders.
- **Cost optimization is subordinate to safety.** Cost is the last consideration
  in routing, never the first.

## 3. Layered View

```
+---------------------------------------------------------------+
|  Headless Convex Backend (convex/*)                            |
|  Schema | functions | HTTP actions | scheduler                 |
|  Public surface: GET /v1/health (no frontend in Phase 1)       |
+---------------------------------------------------------------+
|  Product Adapters (connectors/systems)                         |
|  Versioned product-side adapter boundary                       |
+---------------------------------------------------------------+
|  Orchestration & Services (services/*)                         |
|  orchestration | model-gateway | agent-runtime | policy-engine |
|  approval-engine | audit-service | memory-service |            |
|  cost-optimization | integration-gateway                      |
+---------------------------------------------------------------+
|  Shared Packages (packages/*)                                  |
|  contracts | security | policy | auth | redaction | telemetry  |
|  config | testing | sdk                                        |
+---------------------------------------------------------------+
|  External Connectors (connectors/*)                            |
|  api-hub | compliance-hub                                      |
+---------------------------------------------------------------+
```

### 3.1 Shared packages

- **`@fsts/contracts`** — the canonical, versioned, runtime-validated domain
  model. Every cross-system boundary is defined here as a Zod schema with a
  matching TypeScript type. Contracts are the single source of truth.
- **`@fsts/security`** — deny-by-default authorization primitives: tenant,
  system, and environment isolation checks; allowlist enforcement; data
  classification enforcement; ownership-boundary enforcement; self-elevation
  prevention; and decision combination.
- **`@fsts/policy`** — the deterministic policy evaluation engine with baseline
  rules and tenant-supplied rules.
- **`@fsts/auth`** — principal verification and execution-context derivation.
  Tenant and organization are always taken from the verified principal, never
  from request input.
- **`@fsts/redaction`** — defense-in-depth redaction of sensitive keys and
  values before anything is logged, audited, or exported.
- **`@fsts/telemetry`** — structured logging with correlation and trace IDs.
- **`@fsts/config`** — typed, validated configuration loading.
- **`@fsts/testing`** — deterministic, tenant-scoped fixtures that conform to
  the contracts.
- **`@fsts/sdk`** — the client SDK product systems use to submit governed
  requests.

### 3.2 Services

- **`orchestration`** — evaluates the ordered execution gates and builds the
  execution plan for a request.
- **`model-gateway`** — the mandatory, provider-neutral routing layer. No model
  call may bypass it. It selects an approved model/provider using the mandatory
  priority order and records provenance.
- **`agent-runtime`** — authorizes individual agent actions and detects
  self-elevation attempts.
- **`policy-engine`** — wraps the policy package for service-level evaluation.
- **`approval-engine`** — manages approval state transitions and validates that
  an approval is applicable, unexpired, and not reusable for a materially
  different action.
- **`audit-service`** — builds tamper-evident audit events with integrity hashes
  and verifies the audit chain.
- **`memory-service`** — authorizes memory access and enforces memory-scope
  boundaries.
- **`cost-optimization`** — measures, governs, forecasts, and actively reduces
  AI costs, always subordinate to security, compliance, capability, quality,
  reliability, and latency.
- **`integration-gateway`** — the governed boundary for invoking external
  operations through the API Hub and Compliance Hub.

### 3.3 Connectors

- **`connectors/api-hub`** — the Hub's governed client to the API Hub. External
  connectivity and provider credentials are owned by the API Hub; the Hub
  submits operation requests carrying credential references.
- **`connectors/compliance-hub`** — consumes applicable policies and control
  references from the Compliance Hub. The Compliance Hub supplies policy; the
  Hub enforces it.
- **`connectors/systems`** — the product-side adapter boundary. Product systems
  connect through versioned adapters and must revalidate actions before applying
  them.

## 4. Request Lifecycle

A governed request flows through the following stages. Each stage can deny.

1. **Authentication.** The principal is verified. Tenant and organization are
   derived from the verified principal, never from the request body.
2. **Contract validation.** The request is validated against its versioned
   contract. Invalid requests fail closed.
3. **Isolation checks.** Tenant, system, and environment boundaries are
   enforced. Cross-boundary requests are rejected.
4. **Policy evaluation.** Baseline and tenant policies are evaluated. Restricted
   actions require a valid human approval.
5. **Approval validation.** If approval is required, the approval is checked for
   applicability, expiry, and integrity. An approval for one action is never
   reusable for a materially different action.
6. **Model routing.** The model gateway selects an approved model/provider using
   the mandatory priority order.
7. **Budget evaluation.** The cost-optimization engine evaluates the budget and
   fails closed if the action would exceed a hard limit.
8. **Execution.** The action is executed through the appropriate connector or
   adapter, with timeouts, cancellation, and idempotency enforced.
9. **Audit.** A tamper-evident audit event is written with correlation and trace
   IDs, redacted payloads, and a retention classification.

## 5. The Mandatory Priority Order

Every routing and optimization decision respects this order. A later
consideration may never override an earlier one.

1. Security
2. Legal and compliance
3. Data classification and residency
4. Required model capability
5. Output quality
6. Reliability and availability
7. Latency
8. Cost optimization

The Hub never selects a cheaper option that is unauthorized, unsafe,
non-compliant, or incapable of the required task.

## 6. What the Hub Does Not Do

- It does not recreate the API Hub. External connectivity is owned by the API
  Hub.
- It does not recreate the Compliance Hub. Compliance logic is owned by the
  Compliance Hub; the Hub enforces the policies it supplies.
- It does not hold provider credentials. It holds references.
- It does not execute product actions directly. Product systems apply actions
  through their own adapters after revalidation.

## 7. Deployment Topology (target)

The Hub is designed as a set of independently deployable services behind a
single authenticated control plane. Phase 1 is a **headless Convex backend**: the
Convex deployment hosts the database, function runtime, scheduler, and HTTP API,
and the only public production surface is `GET /v1/health`. Services are Node.js
24 TypeScript packages. The monorepo uses pnpm workspaces and Turborepo. There is
no frontend, no Clerk, and no Vercel in Phase 1; a future admin frontend is
**deferred — not implemented and not deployed**. This document describes the
target topology; the current Phase 1 deliverable is the foundation, contracts,
and the Convex backend, not a production deployment.
