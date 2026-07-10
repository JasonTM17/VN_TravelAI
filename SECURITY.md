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
- Missing PEMs in production (or `JWT_REQUIRE_PEM=true`) **fail-closed** — no ephemeral prod keys.
- Dual key slots (primary + secondary) for rotation.
- Refresh tokens are opaque, stored hashed, and rotate on use.
- Account lockout pairs with Redis rate limiting.

### Web session residual

- Browser currently stores access + refresh tokens in **localStorage**.
- XSS can exfiltrate tokens — treat as known residual; cookie BFF is product follow-up.

### CORS & headers

- `CORS_ORIGINS` allowlist on api, identity, and ai (not `origin: true`).
- Web sets CSP and baseline security headers (`web/next.config.ts`). CSP still includes `unsafe-eval` for Next tooling.

### Search

- Meilisearch filter values are sanitized (`api/src/lib/meili-filter.ts`) before interpolation.

### AI / webhooks

- Outbound webhooks HMAC-SHA256 signed (`N8N_HMAC_SECRET`).
- Inbound callback verifies signature against **raw body** bytes.
- Chat endpoints require JWT; per-user rate limits on Redis (fail-open if Redis down).
- No tool-calling surface yet (reduces agent tool-abuse class until tools land).

### Demo seed

- Demo admin user only when `SEED_DEMO_USER=true` (local default in `.env.example`).
- Production must set `SEED_DEMO_USER=false` and `RUN_SEED=false`.

### Payment

- Payment is **mock only** — no card data processed.

### Containers

- Multi-stage images, non-root UID 65532, healthchecks, frozen lockfiles.
- Do not bake secrets into images; inject at runtime.

### Dependency / secret scanning

Workflows present: Gitleaks, Trivy, CodeQL (see `.github/workflows/`).

## More detail

- [docs/security/overview.md](docs/security/overview.md)
- [docs/getting-started/environment-variables.md](docs/getting-started/environment-variables.md)
