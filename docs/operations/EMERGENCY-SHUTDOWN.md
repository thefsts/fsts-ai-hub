# FSTS AI Hub — Emergency Shutdown

Owner: Full Stack Tech & Solutions LLC
Status: Foundation (Phase 1)

## 1. Purpose

This document defines the emergency controls that stop AI execution in the FSTS
AI Hub, when to use them, and how they behave.

## 2. Controls

### 2.1 Global emergency stop

A single control halts all AI execution across the Hub. When engaged:

- no new AI action is authorized,
- in-flight actions are cancelled where cancellation is supported,
- every subsequent request is denied until the stop is lifted,
- the stop is audited.

### 2.2 Per-scope suspension

Any of the following can be suspended independently:

- an AI identity,
- an agent version,
- a tool,
- a provider,
- a model,
- a connected system.

A suspended scope cannot be used. A suspended AI cannot reinstate itself.

## 3. Suspension Contract

A suspension record carries:

- the scope (identity, agent version, tool, provider, model, or system),
- the scope identifier,
- the reason,
- who or what initiated it,
- the effective time,
- the state (active, lifted),
- a correlation ID.

## 4. Behavior When Suspended

- Requests targeting a suspended scope are denied.
- The denial is audited with the suspension reason.
- No fallback silently routes around a suspended scope; a suspended provider is
  not replaced by an unapproved one.
- A suspended AI cannot change its own state.

## 5. Lifting a Suspension

- Only an authorized human can lift a suspension.
- Lifting is audited.
- An AI can never lift its own suspension.

## 6. When to Use

- A suspected compromise of an AI identity, tool, provider, or system.
- A runaway cost event.
- A security incident.
- A compliance hold.
- Any situation where continuing AI execution is unsafe.

## 7. Fail-Closed Guarantee

If the emergency control state cannot be determined, the Hub fails closed and
denies execution. An unknown state is treated as "stopped."

## 8. Current Implementation Status

The suspension contract and the deny-on-suspension behavior are **implemented
and tested** in `packages/contracts` and the security and routing layers. The
global emergency stop control surface in the Command Center is an
**interface-only** shell with an honest empty state. Wiring the control to a
live, persisted state store is a Phase 2 concern.

## 9. Audit

Every emergency action — engagement, suspension, and lifting — produces a
tamper-evident audit record with correlation and trace IDs.
