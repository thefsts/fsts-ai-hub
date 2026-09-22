# FSTS AI Hub — Convex Backend

Owner: Full Stack Tech & Solutions LLC
Status: Foundation (Phase 1)
License: FSTS Source-Available License v1.0

## 1. Purpose

Phase 1 of the FSTS AI Hub is a **headless Convex backend**. Convex hosts the
database, the function runtime, the scheduler, and the HTTP API. There is no
frontend, no Clerk, and no Vercel in Phase 1. The only public production surface
is `GET /v1/health`.

This document describes the Convex schema, the function and HTTP surface, the
isolation and ownership model, the service-identity model, and the cost
persistence model. It is the operational companion to
`docs/architecture/SYSTEM-ARCHITECTURE.md`.

## 2. Deployment

The backend is bound to a single, pre-existing Convex deployment. It must never
create a second project, database, or deployment, and it must never rename,
reset, or wipe tables.

| Property         | Value                                        |
| ---------------- | -------------------------------------------- |
| Team             | ARMA                                         |
| Project          | `fsts-ai-hub`                                |
| Dev deployment   | `standing-dotterel-776`                      |
| Client URL       | `https://standing-dotterel-776.convex.cloud` |
| HTTP actions URL | `https://standing-dotterel-776.convex.site`  |

The deployment is linked locally with `convex dev`, which writes the link into
`.convex/` (gitignored). The deployment key is a secret supplied by the
environment and is never committed.

## 3. Schema

The schema is defined in `convex/schema.ts` using `defineSchema` / `defineTable`.
Every read path is backed by an index; there are no unbounded scans and no
`.filter()` used in place of an index. Optional fields are modeled with
`v.optional(...)`; `undefined` is never stored.

### 3.1 Tables and indexes

| Table                   | Purpose                                                      | Indexes                                                                                                                           |
| ----------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `organizations`         | Top-level owning organization                                | `by_external_key`                                                                                                                 |
| `tenants`               | Tenant within an organization, with ownership classification | `by_organization_id`, `by_organization_id_and_external_key`                                                                       |
| `connectedSystems`      | A connected product/system within a tenant                   | `by_tenant_id`, `by_tenant_id_and_external_key`                                                                                   |
| `serviceIdentities`     | Machine-to-machine identities (key ID + secret digest)       | `by_key_id`, `by_connected_system_id`                                                                                             |
| `providerPriceVersions` | Versioned provider/model pricing                             | `by_provider_key_and_model_key_and_effective_at`                                                                                  |
| `budgetPolicies`        | Budget limits and enforcement actions                        | `by_tenant_id`, `by_tenant_id_and_scope_kind_and_scope_key`                                                                       |
| `aiUsageRecords`        | Per-call AI usage and cost attribution                       | `by_tenant_id_and_occurred_at`, `by_connected_system_id_and_occurred_at`, `by_tenant_id_and_idempotency_key`, `by_correlation_id` |
| `auditEvents`           | Tamper-evident decision records                              | `by_correlation_id`, `by_tenant_id_and_occurred_at`                                                                               |

### 3.2 Ownership classification

Every tenant and connected system carries an `ownershipKind`:

- `fsts_owned` — owned by Full Stack Tech & Solutions.
- `client_owned` — owned by a client. **PlayRaise is `client_owned`.**
- `partner_owned` — owned by a partner.

Ownership is a first-class field, not a derived label. A client-owned system
never receives implicit access to an FSTS-owned system.

### 3.3 Status and environment

- `status`: `active` | `suspended` | `disabled`.
- `environment`: `development` | `staging` | `production`.

## 4. Functions and HTTP surface

### 4.1 Functions

Functions are written in object form with explicit `args` and `returns`
validators. Functions are internal by default; only the minimum required surface
is exposed.

- `convex/health.ts` — internal `status` query (`internalQuery`, not part of the
  public Convex function surface). Returns
  `{ service: "fsts-ai-hub", status: "ok", architecture: "headless-convex", version: "0.1.0" }`.

### 4.2 HTTP actions

- `convex/http.ts` — `httpRouter()` exposing `GET /v1/health` (the only public
  production surface). The handler calls `internal.health.status` server-side.
  The response sets
  `Cache-Control: no-store`, `X-Content-Type-Options: nosniff`, and
  `Content-Type: application/json`, and contains no secret material.

No additional production endpoint is exposed until service authentication,
signature verification, body digest, timestamp freshness, nonce replay
prevention, scope/tenant/system authorization, idempotency, rate limiting, audit
persistence, fail-closed behavior, credential revocation, and a kill switch are
implemented and tested.

## 5. Service identity model

Service identities are machine-to-machine. No human identity provider (Clerk) is
involved. A service identity is identified by a **key ID** and authenticated with
a secret whose **digest** (never the plaintext secret) is stored server-side.

The model supports registration, key ID, secret digest / public-key reference,
allowed system/environment/tenant/scopes, status, expiration, rotation,
revocation, last-used, and audit history. Plaintext secrets are never stored. No
real production credentials are committed; only sanitized test fixtures are used.

The future request envelope carries: key ID, timestamp, nonce, body digest,
signature, correlation ID, idempotency key, contract version, tenant, connected
system, environment, requested capability, data classification, and maximum
allowed cost. The canonicalization and header contracts live in
`packages/contracts/src/service-auth.ts`; the verification primitives live in
`packages/security/src/service-identity.ts`.

## 6. Cost persistence

Cost optimization is connected to Convex without reducing coverage. Pricing is
stored as versioned `providerPriceVersions` with input/output/cached token
prices, effective and expiration dates, pricing source, and last verification.
Historical prices are never silently overwritten: a new price is a new version
with a later `effectiveAt`.

Budget policies carry warning thresholds, hard limits, and enforcement actions
(`warn`, `throttle`, `require_approval`, `block`). Usage records carry estimated
and actual cost, retry cost, tool-call count, agent-loop count, cache
utilization, execution result, and correlation ID. Attribution is by
organization, tenant, FSTS system, client system, AI identity, agent, workflow,
provider, model, environment, and correlation ID.

Security, compliance, classification, capability, quality, and reliability take
priority over cost. Cost is the last consideration in routing, never the first.

## 7. Isolation and fail-closed behavior

- Tenant, system, and environment identifiers are validated server-side. A
  caller-supplied tenant ID is never trusted on its own.
- Cross-tenant and cross-system reads are denied by default.
- Reads for an unknown or empty scope return no rows, never a default allow.
- Invalid contract values (unknown ownership kind, status, or outcome) are
  rejected by the schema.

## 8. Testing

The Convex backend is tested with `convex-test` against the real schema and
runtime:

- `convex/schema.test.ts` — table availability and index coverage.
- `convex/health.test.ts` — health function payload and secret-free output.
- `convex/http.test.ts` — HTTP health status, headers, and secret-free output.
- `convex/isolation.test.ts` — organization/tenant/system isolation, ownership
  classification (PlayRaise `client_owned`), budget-policy isolation, provider
  price version history, idempotency and replay isolation, audit-event creation,
  fail-closed reads, secret redaction, and invalid-contract rejection.

The root test command runs the workspace suites and the Convex suite:

```bash
pnpm test          # turbo run test && vitest run --config vitest.config.convex.mts
pnpm test:convex   # vitest run --config vitest.config.convex.mts
```
