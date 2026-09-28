# FSTS AI Hub — Product Adapter Interface

Owner: Full Stack Tech & Solutions LLC
Status: Foundation (Phase 1)

## 1. Purpose

This document defines how product systems connect to the FSTS AI Hub. Product
systems connect through versioned product-side adapters. They never receive
unrestricted direct access to internal Hub services.

## 2. The Adapter Boundary

A product system implements a product-side adapter that:

- declares the adapter contract version it implements,
- handles requests from the AI Hub,
- revalidates actions before applying them.

The AI Hub consumes the adapter through `connectors/systems`.

## 3. Request Envelope

A product adapter request carries:

- contract version and adapter contract version
- tenant, organization, environment, connected system
- the product-side actor identity
- the AI identity acting on behalf of the product
- the operation and payload
- correlation ID and idempotency key
- request timestamp

## 4. Response Envelope

A product adapter response carries:

- contract version
- correlation ID
- outcome (success, error, denied, pending_approval)
- payload
- error code
- a `requiresProductRevalidation` flag (defaults to true)
- completion timestamp

## 5. Revalidation Requirement

Product systems must revalidate actions before applying them. The response
contract carries the `requiresProductRevalidation` flag so the requirement is
explicit and cannot be silently dropped. The AI Hub never assumes a product
system applied an action without revalidation.

## 6. Ownership Classification

FSTS-owned products and authorized client systems are classified separately and
receive independent tenant boundaries. PlayRaise is attributed as a separate
client. A product adapter never crosses the ownership boundary.

## 7. Security Properties

- Product systems authenticate and are verified.
- Requests and responses are validated against versioned contracts.
- Invalid requests and responses fail closed.
- Idempotency keys prevent duplicate actions.
- Correlation IDs propagate end to end.

## 8. Current Implementation Status

The adapter interface and request/response validation are **implemented and
tested**. No product system is connected yet; the adapter boundary is an
**interface only** until a product implements it. PlayRaise integration is
**not started**.

## 9. Dependencies on Product Systems

- A product-side adapter implementing the current adapter contract version.
- Service-to-service authentication.
- Revalidation of actions before application.
