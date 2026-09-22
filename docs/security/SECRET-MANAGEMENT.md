# FSTS AI Hub — Secret Management

Owner: Full Stack Tech & Solutions LLC
Status: Foundation (Phase 1)

## 1. Purpose

This document defines how secrets are handled in the FSTS AI Hub: what may never
be committed, how secrets are referenced at runtime, how the repository is
scanned, and what to do if a secret is exposed.

## 2. What Must Never Be Committed

The public repository must never contain:

- production API keys or model-provider keys
- OAuth client secrets
- database credentials or connection strings with credentials
- Convex deployment secrets or deployment keys
- private signing keys
- customer data or PII
- production prompts
- compliance evidence
- real tokens of any kind
- a production `.env` file

## 3. Credential References, Not Values

At runtime, the Hub carries **credential references** only. A credential
reference is an opaque identifier that the API Hub (or the owning system)
resolves to a value. The Hub never stores, logs, audits, or exports the value.

The canonical contract for a credential reference is `CredentialRefSchema` in
`@fsts/contracts`.

## 4. Environment Configuration

- `.env.example` lists configuration **names only**, with placeholder or empty
  values. It never contains real values.
- Real values are supplied at deploy time through the platform's secret store.
- `.env` and `.env.*` (except `.env.example`) are git-ignored.

## 5. Redaction

Before any payload is logged, audited, or exported, redaction is applied:

- Sensitive keys are redacted entirely, including their subtrees.
- Sensitive value shapes are masked wherever they appear.

Redaction is defense in depth and never replaces authorization.

## 6. Automated Secret Scanning

The repository includes a secret scanner (`scripts/scan-secrets.mjs`) that runs:

- locally via `pnpm scan:secrets`,
- in CI on every push and pull request.

The scanner checks tracked and untracked files against a set of conservative
patterns (cloud keys, provider keys, JWTs, private key blocks, database URLs with
credentials, and generic secret assignments). Test files are allowlisted because
they intentionally contain fake, non-functional secret-shaped strings.

This scanner is a defense-in-depth control, not a substitute for GitHub secret
scanning or human review.

## 7. If a Secret Is Exposed

If a real secret is ever committed:

1. **Stop.** Do not continue working.
2. **Report** it immediately per `SECURITY.md`.
3. **Revoke** the secret at its source.
4. **Rotate** it and update the secret store.
5. **Purge** it from history if required, understanding that removal from a later
   commit is not sufficient on its own.
6. **Review** how it happened and add a control to prevent recurrence.

## 8. Access to Secrets

- Secrets are accessed through short-lived credentials where possible.
- Service-to-service identity is used instead of shared static secrets.
- Access to the secret store is least-privilege and audited.

## 9. Current Implementation Status

Redaction is implemented and tested in `packages/redaction`. The secret scanner
is implemented and runs in CI. `.env.example` contains names only. Integration
with a production secret store is a Phase 2 concern.
