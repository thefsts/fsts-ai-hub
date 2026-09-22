# ADR 0001: Headless Convex Backend

- Status: Accepted
- Date: 2026-09-22

## Decision

Phase 1 uses Convex as the AI Hub database, function runtime, scheduler, and HTTP API host. The Hub has no custom frontend, Clerk integration, or Vercel deployment during this phase.

Connected systems authenticate as scoped service identities through versioned product adapters. Human authentication and a private administrative Command Center are deferred until the backend contracts and governance controls are stable.

## Consequences

- Convex HTTP actions expose the versioned machine API.
- Convex queries, mutations, actions, schedules, and components own backend behavior.
- No parallel database, API server, queue, object store, or Vercel service is introduced.
- Public endpoints default to health checks only until service authentication, replay protection, authorization, and audit persistence are implemented and tested.
- A future administrative frontend may use Clerk and Vercel without replacing the Convex backend.
