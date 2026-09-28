# ADR 0002 — Versioned, Runtime-Validated Contracts

- Status: Accepted
- Date: 2026-01-01
- Owner: Full Stack Tech & Solutions LLC

## Context

The Hub sits between many systems: product systems, the API Hub, the Compliance
Hub, model providers, and human operators. Each boundary is a place where
malformed or hostile input can enter. TypeScript types are erased at runtime and
cannot protect a boundary on their own.

## Decision

Define every cross-system boundary as a **versioned, runtime-validated contract**
using Zod, with a matching TypeScript type inferred from the schema. Contracts
live in `@fsts/contracts` and are the single source of truth.

Every contract:

- carries a `contractVersion`,
- carries tenant, organization, environment, and connected-system identifiers
  where the boundary is tenant-scoped,
- is validated at the boundary,
- fails closed on validation failure.

## Consequences

- Invalid input is rejected before it is processed.
- Contract drift is caught at build time (types) and runtime (validation).
- Versioning allows the boundary to evolve without breaking consumers.
- Every boundary has an explicit, testable shape.

## Alternatives Considered

- **TypeScript types only.** Rejected: no runtime protection.
- **Hand-written validators.** Rejected: error-prone and duplicative.
- **A schema language with codegen.** Deferred: Zod is sufficient and keeps the
  schema and type in one place.
