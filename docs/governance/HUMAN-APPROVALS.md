# FSTS AI Hub — Human Approvals

Owner: Full Stack Tech & Solutions LLC
Status: Foundation (Phase 1)

## 1. Purpose

This document defines the Human Approval Engine: which actions require human
approval, how approvals are requested and validated, how approval state
transitions work, and how the Hub prevents approval reuse and self-approval.

## 2. Why Approvals Exist

Some AI actions are irreversible, high-impact, or legally significant. For these
actions, the Hub requires a human to approve the specific action before it
proceeds. Approval is not a formality; it is a control that binds a human
decision to a specific, integrity-hashed action.

## 3. Categories Requiring Approval

The following categories always require human approval:

- Financial actions (payments, refunds, pricing changes, budget changes)
- Legal actions (contracts, terms, disclosures)
- Security actions (permission changes, key operations, access grants)
- Emergency communications
- Customer-facing publication
- Destructive actions (deletion, irreversible changes)
- Identity and permission changes
- High-risk tools
- External disclosure of data
- Cross-system data movement
- Production configuration changes

## 4. Approval Request Contract

An approval request carries:

- tenant, organization, environment, connected system
- the requesting AI identity and agent version
- the category and risk level
- the requested action and its parameters
- a **parameters integrity hash** (SHA-256) binding the approval to the exact
  action
- a reference to the parameters
- the policy version that required the approval
- the approval state
- an expiry
- a correlation ID and idempotency key
- the request timestamp

## 5. Approval State Transitions

Approvals move through a defined state machine. Only valid transitions are
permitted; any other transition is rejected.

```
pending ──► approved ──► consumed
   │            │
   ├──► denied  │
   │            └──► expired
   └──► expired
```

- **pending → approved**: a human approver approves the specific action.
- **pending → denied**: a human approver denies the action.
- **pending → expired**: the approval window elapses before a decision.
- **approved → consumed**: the approval is used exactly once.
- **approved → expired**: the approval window elapses before use.

## 6. Validation Before Execution

Before an approved action executes, the Hub validates that the approval:

1. exists and is in the `approved` state,
2. has not expired,
3. is applicable to the same tenant, system, environment, AI identity, and agent
   version,
4. matches the action by integrity hash (the action has not changed),
5. has not already been consumed,
6. was not self-approved by the requesting AI.

If any check fails, the action is denied.

## 7. Anti-Reuse Guarantee

An approval is bound to a specific action by its parameters integrity hash. If
the action's parameters change, the hash changes, and the existing approval no
longer applies. This prevents an approval for one action from being reused for a
materially different action.

## 8. Anti-Self-Approval Guarantee

An AI identity can never approve its own restricted action. The policy engine
evaluates a self-approval rule at the highest priority. A self-approval attempt
is denied and audited, even if a valid approval is otherwise present.

## 9. Expiry and Replay Protection

- Every approval has an expiry. Expired approvals are rejected.
- Every approval request carries an idempotency key. Replayed requests are
  detected and rejected.
- Consumed approvals cannot be reused.

## 10. Audit

Every approval request, decision, transition, and validation outcome produces an
audit record with correlation and trace IDs. Approval records are exportable as
evidence.

## 11. Current Implementation Status

The approval state machine, validation logic, and category list are implemented
and tested in `services/approval-engine`. Phase 1 is a headless Convex backend:
there is no approval UI. A future approval console is **deferred — not
implemented and not deployed**. Persistence and human approver authentication are
not yet integrated.
