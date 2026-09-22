# FSTS AI Hub

The FSTS AI Hub is the central governance, orchestration, security, routing, audit, and lifecycle platform for AI used by Full Stack Tech & Solutions LLC (FSTS), its owned systems, and explicitly authorized client environments.

> Status: architecture and foundation phase. This repository is public to support transparent review and authorized collaboration. Public visibility does not grant unrestricted commercial use. See [LICENSE](LICENSE).

## Mission

The Hub provides one governed path for approved AI assistants, agents, models, tools, workflows, memory, and system integrations. Product systems keep their own business logic and data ownership; the Hub coordinates AI execution without becoming a shared application database.

## Core responsibilities

- AI identity registry and lifecycle management
- Tenant, system, agent, and environment isolation
- Model and provider routing with approved fallbacks
- Tool, API, data-source, and service-identity permissions
- Human approval gates for sensitive or irreversible actions
- Prompt, policy, workflow, and agent versioning
- Memory and knowledge-boundary enforcement
- Usage, latency, quality, budget, and cost controls
- Security monitoring, incident response, and emergency shutdown
- Immutable, correlated audit events across connected systems
- Shared contracts and SDKs for FSTS product integrations

## Ecosystem boundary

FSTS-owned products may connect as governed first-party systems. Client-owned products, including PlayRaise, remain client environments and must be isolated through explicit contracts, tenant boundaries, permissions, and data-processing rules.

The AI Hub will integrate with the FSTS API Hub for governed service connectivity and the FSTS Compliance Hub for policy, evidence, and control alignment. Those platforms remain independently deployable systems with separate responsibilities.

## Phase 1 architecture

The AI Hub begins as a headless Convex backend. Convex owns the database, functions, schedules, and versioned HTTP API. Phase 1 has no custom frontend, Clerk integration, or Vercel deployment. A private administrative Command Center may be added later without replacing the backend.

## Planned repository layout

```text
convex/                  Data model, backend functions, schedules, and HTTP API
src/contracts/           Versioned runtime-validated system contracts
src/cost/                Cost estimation and optimization primitives
docs/
  architecture/         System design and decision records
  decisions/            Architecture decision records
  governance/           AI governance and operating policies
  security/             Threat models and security requirements
  integrations/         Product onboarding specifications
tests/
  contract/
  integration/
  security/
  certification/
```

Directories will be introduced with the implementation that owns them rather than as empty placeholders.

## Non-negotiable security rules

- Never commit secrets, tokens, private keys, customer data, production prompts, or production configuration.
- Deny access by default; grant the minimum scoped permission required.
- Separate tenants, products, environments, memory, credentials, and audit trails.
- Require explicit approval for high-impact actions defined by policy.
- Do not silently fall back to an unapproved model, provider, tool, or data source.
- Every material AI action must carry tenant, system, agent, policy, and correlation identifiers.
- Emergency disable controls must fail closed and remain auditable.

## Contributing

Authorized contributors should read [CONTRIBUTING.md](CONTRIBUTING.md) and [SECURITY.md](SECURITY.md) before opening a change. Contributions do not change the ownership or license of this repository.

## License

Copyright (c) 2026 Full Stack Tech & Solutions LLC. All rights reserved.

This project is source-available under the [FSTS Source-Available License](LICENSE). It is not offered under an OSI-approved open-source license. Commercial deployment, resale, competing hosted services, and redistribution require prior written permission from FSTS.
