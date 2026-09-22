# FSTS AI Hub — Tenant Isolation

Owner: Full Stack Tech & Solutions LLC
Status: Foundation (Phase 1)

## 1. Purpose

This document defines how the FSTS AI Hub isolates tenants, connected systems,
and environments from one another, and how that isolation is enforced and
tested.

## 2. Isolation Dimensions

The Hub isolates along four dimensions:

1. **Tenant.** The primary isolation boundary. Client-owned systems receive
   independent tenant boundaries.
2. **Organization.** The billing and governance boundary above tenants.
3. **Connected system.** A specific system within a tenant.
4. **Environment.** Test, staging, or production.

Every contract carries these identifiers. Every authorization decision checks
them.

## 3. Enforcement Points

### 3.1 Contract layer

Every cross-system contract requires tenant, organization, environment, and
connected-system identifiers. A contract missing any of these fails validation.

### 3.2 Authentication layer

Tenant and organization are derived from the verified principal, never from the
request body. A request cannot claim a tenant it does not belong to.

### 3.3 Authorization layer

The security package provides explicit isolation checks:

- `verifyTenant` / `enforceTenantIsolation`
- `verifySystem` / `enforceSystemIsolation`
- `verifyEnvironment` / `enforceEnvironmentIsolation`
- `enforceOwnershipBoundary`

Each returns a deny decision when the boundary is crossed.

### 3.4 Policy layer

Policy evaluation includes a baseline rule that denies any request missing
required isolation context.

### 3.5 Memory layer

Memory scopes are bound to a tenant, connected system, and AI identity.
Cross-scope access is denied.

### 3.6 Cost layer

Budgets and cost records are tenant-scoped. One tenant's spend never affects
another tenant's budget evaluation.

## 4. Ownership Boundary

FSTS-owned systems and client-owned systems are classified separately:

- `fsts_first_party`
- `client_owned`
- `third_party`

The ownership boundary is enforced so that a client-owned system's data is never
mixed with FSTS-owned data, and PlayRaise is attributed as a separate client.

## 5. Fail-Closed Behavior

If any isolation identifier is missing, mismatched, or unverifiable, the request
is denied. There is no "best effort" isolation.

## 6. Testing

Isolation is verified by automated tests that assert:

- a request for tenant A cannot act on tenant B,
- a request for system A cannot act on system B,
- a test-environment identity cannot act in production,
- a client-owned system cannot access FSTS-owned data,
- memory scopes do not leak across tenants,
- budgets do not leak across tenants.

These tests live alongside the security package and the services that enforce
isolation. They are part of the required CI suite.

## 7. Current Implementation Status

Isolation primitives are implemented and tested in `packages/security`. Tenant
derivation from the verified principal is implemented in `packages/auth`.
Isolation enforcement is wired into the policy engine, memory service, and cost
engine. Persistence-layer row-level isolation is not yet implemented and is a
Phase 2 concern.
