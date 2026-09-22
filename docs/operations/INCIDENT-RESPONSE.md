# FSTS AI Hub — Incident Response

Owner: Full Stack Tech & Solutions LLC
Status: Foundation (Phase 1)

## 1. Purpose

This document defines how the FSTS AI Hub team responds to security, safety, and
cost incidents. It covers detection, triage, containment, eradication, recovery,
and post-incident review.

## 2. Incident Categories

- **Security incident.** Unauthorized access, credential exposure, isolation
  breach, or audit tampering.
- **Safety incident.** An AI action that caused or nearly caused harm.
- **Compliance incident.** A policy or regulatory violation.
- **Cost incident.** A runaway cost event or budget breach.
- **Availability incident.** A service outage or degradation.

## 3. Severity Levels

- **SEV-1.** Active harm, active data exposure, or a global safety failure.
- **SEV-2.** Confirmed compromise or a serious control failure without active
  harm.
- **SEV-3.** Limited impact or a near miss.
- **SEV-4.** Minor issue or a policy deviation.

## 4. Response Phases

### 4.1 Detection

- Automated alerts (Cost Guard, health checks, audit anomalies).
- Human reports (see `SECURITY.md` for vulnerability reporting).
- External notification.

### 4.2 Triage

- Assign a severity.
- Identify affected tenants, systems, and AI identities.
- Preserve evidence (audit records, logs, correlation IDs).

### 4.3 Containment

- Use the emergency controls in `docs/operations/EMERGENCY-SHUTDOWN.md`.
- Suspend the affected scope or engage the global emergency stop.
- Revoke and rotate any exposed credentials.

### 4.4 Eradication

- Identify and fix the root cause.
- Add or strengthen a control to prevent recurrence.
- Add a regression test.

### 4.5 Recovery

- Lift suspensions only after the root cause is fixed.
- Verify isolation, policy, and audit integrity.
- Monitor closely after recovery.

### 4.6 Post-Incident Review

- Write a blameless post-incident review.
- Record timeline, impact, root cause, and corrective actions.
- Track corrective actions to completion.

## 5. Evidence Preservation

- Audit records are tamper-evident and exportable.
- Correlation and trace IDs link related events.
- Evidence is retained per its retention classification; legal hold overrides
  normal deletion.

## 6. Communication

- Internal communication is coordinated by the incident lead.
- External communication (customers, regulators) requires human approval per
  `docs/governance/HUMAN-APPROVALS.md`.
- Emergency communications require human approval.

## 7. Credential Exposure

If credentials are exposed, follow `docs/security/SECRET-MANAGEMENT.md`: stop,
report, revoke, rotate, purge, and review.

## 8. Current Implementation Status

The controls referenced here (suspension, emergency stop, audit integrity,
redaction, Cost Guard) are **implemented and tested** at the library level. The
operational runbook, on-call rotation, and alerting integrations are **not
started** and are Phase 2 concerns.
