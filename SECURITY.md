# Security Policy

## Reporting a vulnerability

Do not disclose suspected vulnerabilities in a public issue, discussion, pull request, commit, or code comment.

Report vulnerabilities privately through GitHub's **Security** tab by selecting **Report a vulnerability**. Include the affected component, reproduction steps, impact, and any safe proof of concept. Do not include credentials, customer data, or data obtained without authorization.

If private vulnerability reporting is not yet enabled for this repository, contact an authorized FSTS representative and request a private reporting channel before sending sensitive details.

## Research boundaries

Authorization to view this public repository does not authorize testing against production, staging, customer, partner, or employee systems. Do not perform denial-of-service testing, social engineering, credential testing, data extraction, persistence, or destructive activity.

## Secrets

If a secret is committed, treat it as compromised. Revoke and rotate it immediately, preserve the audit trail, and notify the system owner. Removing the value from Git history is not a substitute for rotation.

## Supported versions

The project is currently in its foundation phase. Security fixes will target the canonical `main` branch until formal release channels are established.
