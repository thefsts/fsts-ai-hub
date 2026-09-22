# FSTS AI Hub — Data Flow

Owner: Full Stack Tech & Solutions LLC
Status: Foundation (Phase 1)

## 1. Purpose

This document describes how data moves through the FSTS AI Hub, what is
attached to it at each stage, and where it is redacted, classified, retained, or
destroyed.

## 2. Data Classes

Every payload carries a data classification from the canonical contract:

- `public`
- `internal`
- `confidential`
- `restricted`
- `regulated`

Classification drives routing (residency and provider eligibility), redaction,
retention, and audit detail. A higher classification can only narrow the set of
permitted providers and models, never widen it.

## 3. The Execution Context

Every material execution carries an execution context. The context is the
minimum set of facts required to make an action auditable and isolatable:

- tenant, organization, environment, environment kind
- connected system
- AI identity and agent version
- policy version
- correlation ID and trace ID
- actor identity
- data classification
- timestamp

The context is derived from the verified principal, never from request input.

## 4. Flow of a Governed Request

```
Product system
   │  (1) submit request (contract-validated)
   ▼
Hub ingress ──► (2) authenticate principal ──► derive execution context
   │
   ▼
(3) isolation checks (tenant / system / environment)
   │
   ▼
(4) policy evaluation ──► (5) approval validation (if required)
   │
   ▼
(6) model gateway routing (priority order) ──► (7) budget evaluation
   │
   ▼
(8) execution via connector / adapter
   │
   ▼
(9) audit event (redacted, integrity-hashed, retention-classified)
```

## 5. Data at Each Stage

### 5.1 Ingress

- The request is validated against its versioned contract.
- Invalid requests are rejected before any data is processed.
- The raw request is never logged in full; only redacted, classified summaries.

### 5.2 Authentication and context derivation

- The principal is verified.
- Tenant and organization are taken from the verified principal.
- The execution context is assembled and attached to the request.

### 5.3 Isolation

- Tenant, system, and environment identifiers are checked against the principal.
- Cross-boundary requests are rejected.

### 5.4 Policy and approval

- Policy inputs are evaluated deterministically.
- Approval requests carry a parameters integrity hash so an approval is bound to
  a specific action and cannot be reused for a materially different one.

### 5.5 Model routing

- The model gateway selects an approved model/provider.
- Routing decisions record the candidate set, the selected candidate, the
  reason, and the priority-order checks that were applied.
- No prompt or response is sent to an unapproved provider.

### 5.6 Budget evaluation

- Usage and cost records are produced for every model call.
- Budget evaluation fails closed when a hard limit would be exceeded.
- Cost attribution separates client costs from FSTS costs. PlayRaise is
  attributed separately.

### 5.7 Execution

- External operations go through the integration gateway to the API Hub.
- Product actions go through the product adapter boundary.
- Timeouts, cancellation, idempotency, and replay protection are enforced.

### 5.8 Audit

- A tamper-evident audit event is written for every material decision.
- The event carries correlation and trace IDs, a redacted payload, an integrity
  hash, and a retention classification.
- Audit events are exportable as evidence.

## 6. Redaction

Redaction is applied as defense in depth before any payload is logged, audited,
or exported:

- Sensitive keys (password, secret, token, api key, credential, private key,
  client secret, session id, cookie, SSN, card number, CVV, date of birth) are
  redacted entirely, including their subtrees.
- Sensitive value shapes (cloud keys, provider keys, JWTs, private key blocks,
  SSN shapes, card-number shapes) are masked wherever they appear.

Redaction never replaces authorization. It is a second line of defense.

## 7. Retention

Every record carries a retention policy with a policy ID, a retention period in
days, and a legal-hold flag. Retention classification determines how long an
audit event, memory record, or cost record is kept. Legal hold overrides normal
deletion.

## 8. Data Residency

Data residency is a routing constraint. A request whose classification or
residency requirement cannot be satisfied by any approved provider is blocked,
not silently downgraded.

## 9. What Never Leaves the Hub

- Raw provider credentials (only references leave).
- Unredacted sensitive payloads.
- Customer PII beyond what a specific, approved action requires.
- Production prompts and compliance evidence in the public repository.

## 10. Cost Data Flow

Cost data flows from provider usage to the cost-optimization engine:

1. A model call produces an `AiUsageRecord` (tokens, latency, provider, model).
2. The usage record is priced against a versioned `ProviderPriceVersion` to
   produce an `AiCostRecord`.
3. The cost record is attributed to a tenant and an owner (client or FSTS) as a
   `CostAllocation`.
4. Budget evaluation compares accumulated cost against the applicable
   `BudgetPolicy`.
5. Anomalies, forecasts, and Cost Guard alerts are derived from the cost stream.
6. Provider billing is reconciled against recorded costs.

Historical pricing is reproducible: a cost record references the exact price
version used, so re-running a calculation yields the same result.
