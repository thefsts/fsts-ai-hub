# ADR 0005 — Cost Optimization Priority Order

- Status: Accepted
- Date: 2026-01-01
- Owner: Full Stack Tech & Solutions LLC

## Context

Cost optimization is a primary responsibility of the Hub, but a naive
"cheapest wins" policy would route requests to unauthorized, unsafe,
non-compliant, or incapable models. Cost must be pursued without ever
compromising safety or correctness.

## Decision

Adopt a fixed, mandatory priority order for every routing and optimization
decision:

1. Security
2. Legal and compliance
3. Data classification and residency
4. Required model capability
5. Output quality
6. Reliability and availability
7. Latency
8. Cost optimization

A later consideration may never override an earlier one. The Hub never selects a
cheaper option that is unauthorized, unsafe, non-compliant, or incapable.

Routing uses configurable tiers (Tier 1 deterministic, Tier 2 small/cache, Tier
3 standard, Tier 4 advanced, Tier 5 specialized). Tier selection is configurable
and never hardcodes model names.

## Consequences

- Cost savings are real but bounded by safety and correctness.
- The routing engine must evaluate all earlier criteria before cost.
- Tests must assert that a cheaper but ineligible option is rejected.

## Alternatives Considered

- **Cheapest-first routing.** Rejected: unsafe and non-compliant.
- **Quality-first with no cost awareness.** Rejected: ignores a primary
  responsibility.
