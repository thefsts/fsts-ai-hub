# ADR 0007 — Headless Convex Backend

- Status: Accepted
- Date: 2026-09-22
- Owner: Full Stack Tech & Solutions LLC

## Context

Phase 1 of the FSTS AI Hub must connect the versioned contracts, security
primitives, and services to a real, governed persistence and function runtime
without introducing a parallel database, API server, queue, cache, object store,
or vector service. The Hub also must not ship a custom frontend, Clerk
integration, or Vercel deployment during this phase: those surfaces would add
authentication and hosting complexity before the backend contracts and
governance controls are stable.

The Hub already has a locked Convex deployment (team ARMA, project
`fsts-ai-hub`, dev deployment `standing-dotterel-776`). Convex provides a
database, a function runtime (queries, mutations, actions), a scheduler, and an
HTTP API host in a single managed service.

## Decision

Adopt **Convex as the single backend** for Phase 1. Convex owns the database,
the function runtime, the scheduler, and the HTTP API host. The Hub is
**headless**: there is no custom frontend, no Clerk, and no Vercel in Phase 1.

- The Convex schema (`convex/schema.ts`) is the canonical persistence model for
  organizations, tenants, connected systems, service identities, provider price
  versions, budget policies, AI usage records, and audit events.
- Convex functions are the backend behavior. Functions are defined in object
  form with `args` and `returns` validators, default to internal, and expose only
  what is required.
- Convex HTTP actions expose the versioned machine API. The only public
  production endpoint in Phase 1 is `GET /v1/health`.
- Connected systems authenticate as scoped **service identities** through
  versioned product adapters. Human authentication and a private administrative
  console are deferred until the backend contracts and governance controls are
  stable.
- No parallel database, API server, queue, cache, object store, or vector
  service is introduced.

## Consequences

- The Hub connects to the existing locked deployment only. No new Convex
  project, database, or deployment is created, and no table is renamed, reset,
  or wiped.
- Public endpoints default to health checks only until service authentication,
  signature verification, body digest, timestamp freshness, nonce replay
  prevention, scope/tenant/system authorization, idempotency, rate limiting,
  audit persistence, fail-closed behavior, credential revocation, and a kill
  switch are implemented and tested.
- Provider price versions are append-only: historical prices are never silently
  overwritten.
- Cost optimization is subordinate to security, compliance, classification,
  capability, quality, and reliability.
- A future administrative frontend may use Clerk and Vercel **without replacing
  the Convex backend**. That frontend is deferred — not implemented and not
  deployed.

## Alternatives Considered

- **A separate database plus a custom API server.** Rejected: introduces a
  parallel database and API surface, and duplicates the function runtime,
  scheduler, and HTTP host that Convex already provides.
- **A custom frontend in Phase 1.** Rejected: adds authentication and hosting
  complexity before the backend contracts and governance controls are stable.
- **Clerk for machine-to-machine auth.** Rejected: connected systems are
  services, not humans; they authenticate as scoped service identities.
