# Security Policy

**Project:** FSTS AI Hub
**Owner:** Full Stack Tech & Solutions LLC
**Contact:** amorebey@gmail.co

The FSTS AI Hub governs AI identity, authorization, routing, memory, approvals,
audit, and cost control for approved AI operating throughout FSTS systems and
authorized client environments. Security is the primary design constraint of
this project. We take vulnerability reports seriously.

---

## Supported Versions

| Version                         | Supported                  |
| ------------------------------- | -------------------------- |
| `main` (pre-release foundation) | ✅ Security fixes accepted |
| Tagged releases                 | ✅ Once published          |
| Forks and derivative works      | ❌ Not supported by FSTS   |

This project is in its foundation phase. There are no production releases yet.

---

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Report vulnerabilities privately using one of the following channels:

1. **GitHub Private Vulnerability Reporting** — use the repository's
   _Security → Report a vulnerability_ tab (preferred).
2. **Email** — send details to **amorebey@gmail.co** with the subject line
   `[SECURITY] FSTS AI Hub — <short description>`.

Please include:

- A description of the vulnerability and its impact.
- Steps to reproduce, including a minimal proof of concept where possible.
- Affected components, versions, or commit SHAs.
- Any known mitigations or workarounds.
- Whether you intend to disclose publicly and on what timeline.

### What to Expect

| Stage                                  | Target                            |
| -------------------------------------- | --------------------------------- |
| Acknowledgement of report              | Within 3 business days            |
| Initial triage and severity assessment | Within 7 business days            |
| Status update cadence                  | At least every 14 days while open |
| Fix or mitigation plan                 | Based on severity and complexity  |

We will credit reporters in the advisory unless anonymity is requested.

---

## Scope

In scope:

- Authorization and access-control bypasses.
- Tenant-isolation or product-system-isolation failures.
- Cross-environment or cross-system data leakage.
- Prompt-injection or indirect prompt-injection defenses that can be bypassed.
- Tool, model, or provider allowlist bypasses.
- Approval-gate bypasses or approval replay.
- Audit tampering or integrity failures.
- Secret exposure or credential-handling flaws.
- Emergency-shutdown or suspension bypasses.
- Fail-open behavior where fail-closed is required.

Out of scope:

- Vulnerabilities in third-party dependencies (report upstream; we will track).
- Social engineering of FSTS staff.
- Denial-of-service via volumetric attacks.
- Issues requiring physical access to a device.
- Findings from automated scanners without a demonstrated impact.

---

## Secret Handling Rules

This repository is **public**. It must never contain:

- Production API keys, OAuth secrets, or model-provider keys.
- Database, Clerk, or Convex deployment secrets.
- Private signing keys or certificates.
- Customer, personal, or production data.
- Production prompts containing sensitive information.
- Private compliance evidence or internal vulnerability details.
- Real access tokens or production `.env` files.

Rules:

1. **Never commit secrets.** Use `.env.example` files that contain names and
   descriptions only — never working values.
2. **Use credential references, not credential values.** The AI Hub stores
   references to credentials owned by the API Hub, never the secret material.
3. **If a secret is discovered:** stop using it immediately, report it, revoke
   it, and rotate it. Removing it from a later commit is **not** sufficient —
   assume it is compromised.
4. **Automated scanning** runs in CI (`pnpm scan:secrets`) and via GitHub secret
   scanning. A failing secret scan blocks merge.
5. **Least privilege** applies to all credentials. Prefer short-lived,
   scoped credentials over long-lived broad ones.

See `docs/security/SECRET-MANAGEMENT.md` for the full policy.

---

## Disclosure Policy

We follow coordinated disclosure. We ask that you:

- Give us reasonable time to remediate before public disclosure.
- Avoid accessing, modifying, or exfiltrating data that is not yours.
- Avoid degrading service for other users.
- Act in good faith.

We will not pursue legal action against researchers who follow this policy.

---

## Security Design Principles

The AI Hub is built on the following non-negotiable principles:

- **Deny by default.** No access is granted unless explicitly authorized.
- **Fail closed.** On error or ambiguity, deny the action.
- **Least privilege.** Every identity receives the minimum required access.
- **Tenant and system isolation.** Boundaries are enforced, not assumed.
- **No self-elevation.** No AI may grant itself permissions or approve its own
  restricted actions.
- **Human approval for high-risk actions.** Financial, legal, security,
  destructive, and customer-facing actions require human approval.
- **Tamper-evident audit.** Every material execution produces an audit record.
- **Credential references only.** Secret values never enter the AI Hub.
