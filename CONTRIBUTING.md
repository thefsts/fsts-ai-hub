# Contributing to FSTS AI Hub

Thank you for helping improve the FSTS AI Hub. Contributions are accepted only under the repository's [LICENSE](LICENSE) and the contribution grant stated there.

## Before making a change

1. Confirm the issue or assigned work defines the owning component and acceptance criteria.
2. Pull the newest `main` and create a focused branch.
3. Do not introduce credentials, personal data, customer data, private prompts, or production configuration.
4. Preserve tenant, product, environment, and data boundaries.
5. Document new shared contracts and security-sensitive behavior.

## Branch and commit conventions

Use short branch names such as `feat/model-gateway-routing`, `fix/tenant-policy-isolation`, or `docs/agent-governance`.

Use clear imperative commit messages. Keep unrelated changes in separate commits and pull requests.

## Pull requests

Every pull request must explain the problem and intended outcome, components and contracts changed, security/privacy/tenancy/compliance effects, tests and results, deployment or migration requirements, and rollback considerations.

Changes to identity, authorization, policy enforcement, approvals, memory boundaries, provider routing, audit integrity, secrets handling, or emergency controls require explicit owner review.

## Definition of done

A change is complete when its behavior is implemented, tested, documented, reviewed, and observable. Mock-only paths must be labeled and must not be represented as production integrations.
