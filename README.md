# FSTS AI Hub

Central AI governance, orchestration, security, routing, audit, memory,
cost-optimization, and lifecycle platform for approved AI operating throughout
FSTS systems and authorized client environments.

Owner: **Full Stack Tech & Solutions LLC**
License: **FSTS Source-Available License v1.0** (see `LICENSE`) — not open source.
Status: **Foundation (Phase 1)** — a headless Convex backend: contracts, security
primitives, services, connectors, and the Convex schema/functions. No frontend is
implemented or deployed. Not a production deployment.

## What this is

The FSTS AI Hub is the control plane that every approved AI action passes
through before it can affect a real system. For every material AI action it
answers: who is acting, on whose behalf, against which system, under which
policy, with which approved model, at what cost, and with what tamper-evident
record. If it cannot answer, the action does not proceed.

## Principles

- **Deny by default, fail closed.** Nothing is permitted unless policy allows it;
  any error or ambiguity denies.
- **Tenant, system, and environment isolation.** Every contract carries the
  identifiers and every decision checks them.
- **Credential references, never values.** The Hub never holds provider
  credentials.
- **No AI self-elevation.** An AI can never approve, elevate, suspend, or
  reinstate itself, nor change its own budget.
- **Cost optimization is subordinate to safety.** Cost is the last consideration
  in routing, never the first.
- **Honest capability classification.** Every capability is labeled as
  implemented-and-tested, implemented-but-not-integrated, interface-only,
  mock-or-simulation, blocked, or not-started.

## Repository layout

```
convex/                 Headless Convex backend (schema, functions, HTTP actions)
services/
  orchestration/        Execution gates and plan building
  model-gateway/        Mandatory provider-neutral model routing
  agent-runtime/        Agent action authorization, self-elevation detection
  policy-engine/        Policy evaluation service
  approval-engine/      Human approval state machine and validation
  audit-service/        Tamper-evident audit events and chain verification
  memory-service/       Memory scope authorization
  cost-optimization/    Cost measurement, governance, forecasting, reduction
  integration-gateway/  Governed external operation boundary
connectors/
  api-hub/              Governed client to the API Hub
  compliance-hub/       Policy supply from the Compliance Hub
  systems/              Product-side adapter boundary
packages/
  contracts/            Versioned, runtime-validated domain model (Zod)
  security/             Deny-by-default authorization and isolation
  policy/               Deterministic policy evaluation engine
  auth/                 Principal verification and context derivation
  redaction/            Sensitive-data redaction
  telemetry/            Structured logging with correlation/trace IDs
  config/               Typed configuration loading
  testing/              Deterministic, contract-conformant fixtures
  sdk/                  Client SDK for product systems
docs/                   Architecture, governance, security, integrations, ops, ADRs
```

## Getting started

Requirements: Node.js 24 and pnpm 9.

```bash
pnpm install
pnpm build
pnpm test
pnpm verify   # format:check + lint + typecheck + test + build + scan:secrets
```

## Convex backend

Phase 1 is a headless Convex backend. The schema, functions, and HTTP actions
live in `convex/`. The only public production surface is `GET /v1/health`, which
returns the service, status, architecture, and version and sets
`Cache-Control: no-store` and `X-Content-Type-Options: nosniff`.

```bash
pnpm convex:dev       # link and run against the dev deployment
pnpm convex:push      # push functions once (convex dev --once)
pnpm convex:codegen   # regenerate convex/_generated
pnpm test:convex      # run the Convex schema/function/HTTP tests
```

The backend is bound to a single pre-existing deployment and never creates a
second project, database, or deployment. See
`docs/architecture/CONVEX-BACKEND.md` for the schema, function surface, service
identity model, and cost persistence model.

## The mandatory priority order

Every routing and optimization decision respects this order. A later
consideration never overrides an earlier one.

1. Security
2. Legal and compliance
3. Data classification and residency
4. Required model capability
5. Output quality
6. Reliability and availability
7. Latency
8. Cost optimization

## Documentation

- Architecture: `docs/architecture/`
- Governance: `docs/governance/`
- Security: `docs/security/`
- Integrations: `docs/integrations/`
- Operations: `docs/operations/`
- Decisions (ADRs): `docs/decisions/`

## Security

Do not open a public issue for a vulnerability. See `SECURITY.md` for reporting
instructions and secret-handling rules.

## Contributing

See `CONTRIBUTING.md`. Contributions are accepted under the FSTS Source-Available
License and require acceptance of the contribution terms.

## License

The FSTS AI Hub is source-available, not open source. See `LICENSE`. Commercial
use, production use by unrelated parties, competing hosted services, white-label
redistribution, sublicensing, and training competing commercial AI are
prohibited. The license is marked for final legal review.
