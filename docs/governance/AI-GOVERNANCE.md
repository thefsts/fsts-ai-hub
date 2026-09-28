# FSTS AI Hub — AI Governance

Owner: Full Stack Tech & Solutions LLC
Status: Foundation (Phase 1)

## 1. Purpose

This document defines how AI is governed within the FSTS AI Hub: who may deploy
AI, what AI may do, how AI identities are registered and versioned, and how
governance decisions are recorded.

## 2. Governance Principles

- **Approval before capability.** No AI identity, model, provider, or tool is
  usable until it is explicitly registered and approved.
- **Least privilege.** Every AI identity receives the minimum permissions
  required for its assigned systems and environments.
- **Explicit ownership.** Every AI identity has a human owner identity.
- **Versioned behavior.** Agents are versioned. A change in behavior is a new
  version, and the version is recorded on every execution.
- **No self-governance.** An AI can never approve, elevate, suspend, or
  reinstate itself.
- **Auditability.** Every material decision is recorded in a tamper-evident
  audit trail.

## 3. AI Identity Lifecycle

An AI identity is a first-class, registered entity. It carries:

- a tenant and organization
- a name and kind (for example, conversational assistant, autonomous agent,
  classifier)
- an owner identity (a human)
- system assignments (which connected systems it may act within)
- allowed environments (test, staging, production)
- a lifecycle status (proposed, active, suspended, retired)

An AI identity cannot act outside its system assignments or allowed
environments. Attempting to do so is denied and audited.

## 4. Agent Versioning

Agents are versioned. An agent version declares:

- the models it may use
- the tools it may use
- the providers it may use
- the memory scopes it may read and write
- whether it requires approval for restricted actions

Every execution records the agent version. A behavior change requires a new
version. This makes it possible to answer "which version of the agent did this?"
for any historical action.

## 5. Model and Provider Governance

- Models and providers are registered in an approved registry.
- A model is usable only if it is approved, healthy, compliant for the required
  data classification, and satisfies residency.
- Routing is provider-neutral. No service is hardcoded to a single provider.
- The model gateway is mandatory. Bypass is detected and reported.
- Fallback to another provider is explicit and only to approved providers.

## 6. Tool and Integration Governance

- Tools are registered and authorized per AI identity and per agent version.
- Tool authorization requests carry the full execution context.
- High-risk tools require human approval.
- External operations go through the integration gateway to the API Hub.

## 7. Policy Governance

- Policies are versioned. Every execution records the policy version applied.
- Baseline security rules are always evaluated before tenant rules.
- Tenant rules may only narrow permissions, never widen them beyond baseline.
- Policy evaluation is deterministic and fails closed.

## 8. Memory and Knowledge Governance

- Memory is scoped to a tenant, connected system, and AI identity.
- Memory scopes declare read and write enablement and a data classification.
- Cross-scope memory access is denied.
- Memory carries a retention policy and a deletion state.

## 9. Cost Governance

Cost optimization is a governance responsibility, not merely an efficiency
concern. The Hub measures, governs, forecasts, and actively reduces AI costs,
always subordinate to security, compliance, classification, capability, quality,
reliability, and latency.

- Budgets are enforced server-side and fail closed.
- An AI can never change its own budget.
- Cost attribution separates client costs from FSTS costs.
- Cost Guard alerts surface anomalies and threshold breaches.

## 10. Human Oversight

Certain categories of action always require human approval. These include
financial actions, legal actions, security actions, emergency communications,
customer-facing publication, destructive actions, identity and permission
changes, high-risk tools, external disclosure, cross-system data movement, and
production configuration changes.

Approval is bound to a specific action by an integrity hash. An approval for one
action is never reusable for a materially different action. See
`docs/governance/HUMAN-APPROVALS.md`.

## 11. Emergency Governance

- Any AI identity, tool, provider, or system can be suspended independently.
- A global emergency stop halts all AI execution.
- Suspension and emergency stop are audited.
- No AI can reinstate itself after suspension.

## 12. Governance Records

Every governance-relevant event produces an audit record: identity registration,
approval decisions, policy changes, model and provider changes, budget changes,
suspensions, and emergency stops. Records are tamper-evident and exportable as
evidence.
