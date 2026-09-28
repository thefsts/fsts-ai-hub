# FSTS AI Hub — Threat Model

Owner: Full Stack Tech & Solutions LLC
Status: Foundation (Phase 1)

## 1. Purpose

This document identifies the threats the FSTS AI Hub is designed to defend
against, the controls that mitigate them, and the residual risk. It follows a
structured approach: assets, actors, threats, controls, and residual risk.

## 2. Assets

- **Tenant data.** Data belonging to a tenant, including client-owned systems.
- **Credentials.** Provider and system credentials (held as references).
- **AI identities and agent versions.** The registered identities and their
  permissions.
- **Policies and approvals.** The rules and human decisions that govern actions.
- **Audit records.** The tamper-evident record of decisions and outcomes.
- **Budgets and cost data.** Financial controls and cost records.
- **Model and tool access.** The ability to invoke approved models and tools.

## 3. Actors

- **Malicious external actor.** Attempts to reach Hub systems or providers.
- **Compromised product system.** A legitimate system that has been compromised.
- **Malicious or compromised AI identity.** An AI acting outside its mandate.
- **Malicious insider.** A human with legitimate access acting against interest.
- **Careless operator.** A human who makes a mistake.
- **Compromised provider.** An external model or tool provider that misbehaves.

## 4. Threats and Controls

### T1 — Cross-tenant data access

- **Threat:** A request for one tenant reads or affects another tenant's data.
- **Controls:** Tenant isolation at the contract and authorization layers;
  tenant derived from the verified principal; isolation tests.
- **Residual risk:** Low. Requires a defect in isolation enforcement.

### T2 — Cross-system or cross-environment action

- **Threat:** An AI acts in a system or environment it is not assigned to.
- **Controls:** System and environment isolation checks; allowed-environment
  enforcement on AI identities.
- **Residual risk:** Low.

### T3 — AI self-elevation

- **Threat:** An AI grants itself permissions, approves its own action, or
  changes its own budget.
- **Controls:** Self-elevation prevention; self-approval prohibition at highest
  policy priority; no self-budget-change.
- **Residual risk:** Low.

### T4 — Approval reuse

- **Threat:** An approval for one action is reused for a materially different
  action.
- **Controls:** Parameters integrity hash binding; single-use consumption;
  expiry; replay protection.
- **Residual risk:** Low.

### T5 — Unapproved model or provider use

- **Threat:** A request is routed to an unapproved or non-compliant provider.
- **Controls:** Mandatory model gateway; approved registry; residency and
  classification checks; bypass detection.
- **Residual risk:** Low, provided the gateway is not bypassed.

### T6 — Prompt injection

- **Threat:** Malicious input manipulates an AI into unsafe actions.
- **Controls:** Tool authorization per identity and version; policy evaluation
  on every action; approval gates for restricted actions; output validation.
- **Residual risk:** Medium. Prompt injection is an evolving threat; defense is
  layered and does not rely on the model behaving well.

### T7 — Credential exposure

- **Threat:** Credentials are logged, audited, exported, or committed.
- **Controls:** Credential references only; redaction before logging; secret
  scanning in CI; `.env.example` with names only.
- **Residual risk:** Low.

### T8 — Audit tampering

- **Threat:** An actor alters or deletes audit records to hide an action.
- **Controls:** Integrity hashes; audit chain verification; retention
  classification; legal hold.
- **Residual risk:** Low.

### T9 — Budget bypass

- **Threat:** An action exceeds a budget hard limit or an AI changes its budget.
- **Controls:** Server-side budget enforcement; fail-closed on hard limit; no
  self-budget-change; Cost Guard alerts.
- **Residual risk:** Low.

### T10 — Runaway cost (retry/loop)

- **Threat:** A retry loop or agent loop drives unbounded cost.
- **Controls:** Retry and loop guards; timeouts; circuit breakers; cancellation;
  idempotency.
- **Residual risk:** Low.

### T11 — Replay attack

- **Threat:** A previously valid request is replayed.
- **Controls:** Idempotency keys; replay protection; single-use approvals.
- **Residual risk:** Low.

### T12 — Denial of service

- **Threat:** A flood of requests degrades the Hub.
- **Controls:** Rate limits; timeouts; circuit breakers; per-tenant quotas.
- **Residual risk:** Medium. Depends on infrastructure capacity.

### T13 — Compromised provider

- **Threat:** An approved provider returns malicious or malformed output.
- **Controls:** Response contract validation; content and tool-call validation;
  error normalization; fail-closed on invalid responses.
- **Residual risk:** Medium.

### T14 — Insider misuse

- **Threat:** A human with access misuses it.
- **Controls:** Least privilege; RBAC/ABAC; audit of all material actions;
  separation of duties; no self-approval.
- **Residual risk:** Medium. Mitigated by auditability and least privilege.

## 5. Out of Scope (Phase 1)

- Physical security.
- Infrastructure-level attacks (host, network, cloud control plane).
- Supply-chain attacks beyond dependency auditing.
- Social engineering of humans.

## 6. Assumptions

- The API Hub correctly resolves credential references and owns connectivity.
- The Compliance Hub correctly supplies applicable policies.
- The identity provider correctly verifies principals.
- The underlying infrastructure enforces network isolation.

## 7. Review

This threat model is reviewed whenever a new service, connector, or capability
is added, and at least annually. It is marked for final security review before
any production deployment.
