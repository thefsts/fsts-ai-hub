# FSTS AI Hub — Trust Boundaries

Owner: Full Stack Tech & Solutions LLC
Status: Foundation (Phase 1)

## 1. Purpose

This document defines where trust begins and ends in the FSTS AI Hub. Every
boundary is a place where data, identity, or authority crosses from one trust
domain into another. At each boundary the Hub assumes the input is hostile until
it has been verified.

## 2. Trust Domains

The Hub recognizes the following trust domains:

1. **The Hub control plane.** The Hub's own services and packages. Trusted to
   enforce policy, but still subject to least privilege internally.
2. **FSTS-owned product systems.** First-party systems owned by Full Stack Tech
   & Solutions LLC. Trusted to be well-behaved, but still required to
   authenticate and revalidate.
3. **Authorized client systems.** Client-owned systems operating under an
   explicit authorization. Each receives an independent tenant boundary.
4. **The API Hub.** The owner of external connectivity and provider credentials.
   Trusted for connectivity, not for policy.
5. **The Compliance Hub.** The owner of compliance policy and control
   references. Trusted for policy supply, not for execution.
6. **Model and tool providers.** External providers. Never trusted. Always
   accessed through the model gateway and approved registries.
7. **Human operators and approvers.** Authenticated humans. Trusted only after
   identity verification and only within their assigned roles.

## 3. Boundaries and Controls

### 3.1 Product system → Hub

- **Crossing:** A product system submits a request to the Hub.
- **Controls:** Service-to-service identity, contract validation, tenant
  derivation from the verified principal, isolation checks, policy evaluation.
- **Rule:** A product system never receives unrestricted direct access to
  internal Hub services. It connects only through a versioned product adapter.

### 3.2 Hub → API Hub

- **Crossing:** The Hub invokes an external operation.
- **Controls:** The request carries a credential reference, never a value. The
  API Hub resolves the reference. The Hub validates the response against the
  contract.
- **Rule:** The Hub never holds provider credentials.

### 3.3 Hub → Compliance Hub

- **Crossing:** The Hub requests applicable policies.
- **Controls:** The Hub validates every policy reference. The Compliance Hub
  never executes product actions.
- **Rule:** The Compliance Hub supplies policy; the Hub enforces it.

### 3.4 Hub → model provider

- **Crossing:** The Hub calls a model.
- **Controls:** The call must pass through the model gateway. The provider and
  model must be approved. The call is subject to residency, classification,
  capability, quality, reliability, latency, and cost checks in that order.
- **Rule:** No model call may bypass the gateway. Bypass is detected and
  reported.

### 3.5 Hub → product system (action application)

- **Crossing:** The Hub instructs a product system to apply an action.
- **Controls:** The response contract carries a `requiresProductRevalidation`
  flag. The product system must revalidate before applying.
- **Rule:** The Hub never assumes a product system applied an action without
  revalidation.

### 3.6 Human → Hub

- **Crossing:** A human operator or approver acts.
- **Controls:** Identity verification, role-based and attribute-based access
  control, and the prohibition on self-approval.
- **Rule:** An AI identity can never approve its own restricted action, and a
  human approval is bound to a specific action by an integrity hash.

## 4. Isolation Guarantees

- **Tenant isolation.** Data and actions for one tenant are never visible to or
  executable by another tenant.
- **System isolation.** A connected system's data and actions are scoped to that
  system.
- **Environment isolation.** Production, staging, and test environments are
  isolated. A test identity cannot act in production.
- **Ownership boundary.** FSTS-owned and client-owned systems are classified
  separately and never share a tenant boundary.

## 5. Credential Handling

- The Hub stores and transmits credential **references** only.
- Credential values live in the API Hub (or the owning system) and are never
  logged, audited, or exported.
- Redaction is applied as defense in depth before any payload leaves a service.

## 6. Failure Behavior at Boundaries

At every boundary, the Hub fails closed:

- Unverifiable identity → deny.
- Invalid contract → deny.
- Missing isolation context → deny.
- Policy evaluation error → deny.
- Expired or inapplicable approval → deny.
- Unapproved provider or model → deny.
- Budget hard limit exceeded → deny.
- Unknown error → deny.

## 7. Emergency Controls

- **Per-agent, per-tool, per-provider, per-system suspension.** Any of these can
  be suspended independently.
- **Global emergency stop.** A single control halts all AI execution across the
  Hub.
- **No self-reinstatement.** A suspended AI cannot reinstate itself.

See `docs/operations/EMERGENCY-SHUTDOWN.md` for the operational procedure.
