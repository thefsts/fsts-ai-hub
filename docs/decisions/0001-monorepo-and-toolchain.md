# ADR 0001 — Monorepo and Toolchain

- Status: Accepted
- Date: 2026-01-01
- Owner: Full Stack Tech & Solutions LLC

## Context

The FSTS AI Hub spans shared contracts, security primitives, services,
connectors, and two applications. These pieces evolve together and share a
canonical domain model. Splitting them into separate repositories would force
version skew across the contract boundary and slow coordinated change.

## Decision

Adopt a single monorepo using:

- **Node.js 24** as the runtime.
- **pnpm workspaces** for package management.
- **Turborepo** for task orchestration and caching.
- **TypeScript in strict mode** for all code.
- **Zod** for runtime validation of every cross-system contract.
- **Vitest** for tests.

The workspace layout is `apps/*`, `services/*`, `packages/*`, `connectors/*`.

## Consequences

- Contracts are shared directly, with no publishing step.
- A single CI pipeline validates the whole system.
- Strict TypeScript and runtime validation catch contract drift early.
- Contributors must use pnpm and Node 24; the lockfile is frozen in CI.

## Alternatives Considered

- **Polyrepo.** Rejected: contract version skew and slow coordinated change.
- **npm or yarn workspaces.** Rejected: pnpm's strict, content-addressed store
  and workspace protocol fit the isolation requirements better.
- **Nx.** Rejected: Turborepo is simpler and sufficient for the current scope.
