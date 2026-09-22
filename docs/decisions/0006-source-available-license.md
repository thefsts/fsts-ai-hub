# ADR 0006 — Source-Available License

- Status: Accepted
- Date: 2026-01-01
- Owner: Full Stack Tech & Solutions LLC

## Context

The Hub is intended to be publicly reviewable and evaluable, and to accept
authorized contributions, while protecting FSTS's commercial interests and the
security of FSTS and customer systems. A permissive open-source license (MIT,
Apache) would allow unrestricted commercial resale and competing hosted
services. A copyleft license (GPL, AGPL) would impose obligations inconsistent
with the intended use.

## Decision

Adopt the **FSTS Source-Available License v1.0** (2026, Full Stack Tech &
Solutions LLC). It permits public review, evaluation, non-production testing,
and authorized contributions, and prohibits:

- commercial resale,
- production use by unrelated parties,
- competing hosted services,
- white-label redistribution,
- sublicensing,
- attribution removal,
- unauthorized trademark use,
- training competing commercial AI,
- accessing FSTS or customer systems.

The license is marked for final legal review.

## Consequences

- The code is publicly reviewable but not open source.
- Commercial use requires a separate agreement.
- Contributors must accept the contribution terms in `CONTRIBUTING.md`.

## Alternatives Considered

- **MIT / Apache-2.0.** Rejected: permits unrestricted commercial resale.
- **GPL / AGPL.** Rejected: inconsistent obligations.
- **Proprietary / closed.** Rejected: the Hub is intended to be reviewable.
