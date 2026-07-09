# Security Policy

## Supported versions

| Version | Supported |
|---------|-----------|
| 0.x     | Yes (MVP) |

## Reporting a vulnerability

Please **do not** open a public GitHub issue for security vulnerabilities.

Email the maintainer (GitHub: [@JasonTM17](https://github.com/JasonTM17)) with:

- Description of the issue
- Steps to reproduce
- Impact assessment
- Any suggested fix

You should receive an acknowledgement within 72 hours.

## Security model (TravelAI)

### Auth

- Production JWT uses **Ed25519** with JWKS at identity `/.well-known/jwks.json`.
- Refresh tokens are opaque, stored hashed, and rotate on use.
- Account lockout pairs with Redis rate limiting.

### AI / webhooks

- Outbound calls from `ai` → n8n are HMAC-SHA256 signed (`X-Signature-SHA256`).
- Invalid signatures must return 401.
- Degraded mode when n8n is unavailable (no stack traces to clients).

### PII & travel data

- Bookings and profiles contain PII — treat logs carefully (no raw passport data in logs).
- Prefer request IDs over logging full request bodies.

### Secrets

- Never commit `.env`, PEM keys, or Docker Hub tokens.
- CI requires `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` as GitHub Actions secrets.

### Scanning

CI runs Trivy, CodeQL, and Gitleaks on PRs and `main`.
