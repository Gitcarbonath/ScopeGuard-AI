# Security Policy

## Reporting a vulnerability

Please do not report exploitable vulnerabilities in a public issue. Use GitHub's private vulnerability reporting feature for this repository if it is enabled. Otherwise, contact the maintainer privately through the contact details on the GitHub profile.

Include the affected component, impact, reproduction steps, and any suggested mitigation. Do not include real client agreements, secrets, or personal data in a report.

## Scope and limitations

ScopeGuard AI is an evolving local-first application. Local inference does not by itself guarantee that every component is secure. Keep dependencies updated, do not expose the development server to untrusted networks, and do not commit `.env` files, credentials, local databases containing private information, or client documents.
