# ADR 0004 — Mandatory Model Gateway

- Status: Accepted
- Date: 2026-01-01
- Owner: Full Stack Tech & Solutions LLC

## Context

AI cost optimization is a primary responsibility of the Hub, but it must never
compromise security, compliance, capability, or quality. If services could call
model providers directly, the Hub could not guarantee that only approved,
compliant, capable models are used, nor could it account for cost or enforce
budgets.

## Decision

All model calls must pass through the **model gateway**. The gateway:

- is provider-neutral and never hardcoded to a single provider,
- selects from an approved-provider registry,
- applies the mandatory priority order: security, legal/compliance, data
  classification/residency, required capability, output quality, reliability,
  latency, then cost,
- records provenance for every call,
- detects and reports bypass.

Bypass is permitted only through a documented, approved exception. Undocumented
bypass is a defect.

## Consequences

- The Hub can guarantee approved, compliant, capable routing.
- Cost and usage are accounted for centrally.
- A single choke point simplifies auditing and emergency control.
- The gateway becomes a critical path; it must be reliable and fast.

## Alternatives Considered

- **Direct provider calls from services.** Rejected: no central guarantee or
  accounting.
- **A thin proxy without policy.** Rejected: cannot enforce the priority order.
