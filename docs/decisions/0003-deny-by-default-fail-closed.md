# ADR 0003 — Deny by Default, Fail Closed

- Status: Accepted
- Date: 2026-01-01
- Owner: Full Stack Tech & Solutions LLC

## Context

The Hub governs AI actions that can affect real systems, real money, and real
people. A permissive default or a silent allow on error would be catastrophic.
The cost of a false deny is a delayed action; the cost of a false allow can be
irreversible.

## Decision

Adopt **deny by default** and **fail closed** everywhere:

- Nothing is permitted unless a policy explicitly allows it.
- Any error, ambiguity, timeout, missing context, or unknown state results in a
  denial.
- Authorization decisions are combined so that any deny wins.
- Policy evaluation errors return a deny.
- Unknown emergency-control state is treated as "stopped."

## Consequences

- The system is safe under failure.
- Operators may occasionally need to grant explicit permission for legitimate
  actions; this is intentional friction.
- Tests must assert the deny path, not only the allow path.

## Alternatives Considered

- **Allow by default with explicit denies.** Rejected: unsafe.
- **Fail open on error.** Rejected: unsafe.
