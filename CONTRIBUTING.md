# Contributing to the FSTS AI Hub

**Owner:** Full Stack Tech & Solutions LLC
**Canonical branch:** `main`

Thank you for your interest in the FSTS AI Hub. This project is
**source-available**, not open source. Contributions are accepted only from
**Authorized Contributors** and are governed by the FSTS Source-Available
License (`LICENSE`) and this document.

---

## Before You Contribute

1. Read `LICENSE`. By contributing, you agree to its terms, including the
   contribution license in Section 4.
2. Read `SECURITY.md` and `docs/security/SECRET-MANAGEMENT.md`.
3. Confirm you are an Authorized Contributor. If you are unsure, contact
   **amorebey@gmail.co** before opening a pull request.
4. Never include secrets, credentials, customer data, or personal data.

---

## Development Setup

### Prerequisites

- **Node.js 24.x** (see `engines` in `package.json`)
- **pnpm 9.x** (`corepack enable && corepack prepare pnpm@9.15.9 --activate`)
- **Git**

### Install

```bash
git clone https://github.com/thefsts/fsts-ai-hub.git
cd fsts-ai-hub
corepack enable
pnpm install --frozen-lockfile
```

### Configure Git Identity (repository-local only)

```bash
git config user.name "thefsts"
git config user.email "amorebey@gmail.co"
```

Do **not** change the global Git identity.

### Validate

```bash
pnpm format:check   # formatting
pnpm lint           # linting
pnpm typecheck      # TypeScript strict type checking
pnpm test           # unit + contract + isolation + security tests
pnpm build          # production build
pnpm scan:secrets   # secret scan
```

Or run everything at once:

```bash
pnpm verify
```

---

## Branching Model

- `main` is the canonical, protected branch.
- Create a dedicated branch for your work, e.g. `foundation/ai-hub-core`,
  `feat/<scope>`, `fix/<scope>`, or `docs/<scope>`.
- **Never** force-push, rebase shared branches, or rewrite history.
- **Never** self-merge. All changes require owner review.

---

## Pull Request Requirements

Before opening a pull request:

1. Fetch the newest `main` and confirm whether it advanced.
2. Reconcile safely (merge, do not rebase shared branches).
3. Run the full local validation suite (`pnpm verify`).
4. Inspect `git status` and confirm no secrets or unrelated files are included.
5. Complete the pull-request template.

A pull request must:

- Be scoped to a single concern.
- Include tests for new behavior.
- Update documentation and contracts where behavior changes.
- Pass all CI checks (format, lint, typecheck, tests, build, dependency audit,
  secret scan).
- Contain no placeholder assertions that pass without testing real behavior.
- Classify every capability honestly as _implemented and tested_, _implemented
  but not integrated_, _interface only_, _mock or simulation_, _blocked_, or
  _not started_.

---

## Coding Standards

- **TypeScript strict mode** is mandatory. Do not weaken compiler options.
- **Runtime validation** with Zod (or equivalent) for all cross-system
  contracts. Types alone are not sufficient at trust boundaries.
- **Versioned contracts.** Every shared contract carries an explicit version.
- **Structured logging** with correlation IDs. Never log secrets or
  unrestricted sensitive content.
- **Deny by default.** New authorization paths must fail closed.
- **No self-elevation.** No AI may grant itself permissions or approve its own
  restricted actions.
- **Tests are required.** Contract, isolation, security, and fail-closed tests
  for any change that touches a trust boundary.

---

## Commit Messages

Use clear, imperative commit messages. Reference the scope where helpful:

```text
feat(contracts): add execution request contract v1
fix(policy-engine): deny on missing tenant context
docs(security): document tenant isolation model
test(isolation): reject cross-tenant memory access
```

Commits must use the identity:

```text
thefsts <amorebey@gmail.co>
```

---

## Prohibited Contributions

- Secrets, credentials, tokens, or production `.env` files.
- Customer, personal, or production data.
- Code that weakens tenant, system, or environment isolation.
- Code that allows an AI to expand its own permissions or bypass approvals.
- Code that silently routes to unapproved providers or models.
- Removal of attribution or license notices.
- Unrelated product changes.

---

## Reporting Security Issues

Do **not** open a public issue. Follow `SECURITY.md`.

---

## Questions

Contact **amorebey@gmail.co**.
