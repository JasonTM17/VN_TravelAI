# identity

## Purpose

Issues and verifies user authentication for TravelAI: register, login, refresh
token rotation, JWKS publication for other services.

## API surface

- `POST /v1/auth/register|login|refresh|logout`
- `GET /v1/auth/me`
- `GET /.well-known/jwks.json`
- `GET /healthz` · `/readyz` · `/metrics`

See root [`docs/openapi.yaml`](../docs/openapi.yaml).

## Env vars

| name | required | default | description |
|------|----------|---------|-------------|
| PORT | no | 3002 | HTTP port |
| DATABASE_URL | yes | — | Postgres identity DB |
| REDIS_URL | no | redis://127.0.0.1:6379 | Rate limit store |
| JWT_ISSUER | no | https://identity.travelai.local | JWT `iss` |
| JWT_AUDIENCE | no | travelai-web | JWT `aud` |
| JWT_PRIMARY_PRIVATE_KEY | no* | ephemeral | Ed25519 PKCS8 PEM |
| JWT_SECONDARY_PRIVATE_KEY | no | — | Previous key for rotation |
| DEMO_USER_EMAIL | no | demo@travelai.local | Seeded demo user |

\* Required in production; empty generates an ephemeral key (dev only).

## Run locally

```bash
pnpm install
pnpm prisma:dev
pnpm dev
```

## Test

```bash
pnpm test
# Coverage target: ≥ 80% lines (gate advisory in CI until baseline)
```

## Runbook

- **Rotate JWT keys:** set `JWT_SECONDARY_PRIVATE_KEY` to old primary, put new
  PEM in `JWT_PRIMARY_PRIVATE_KEY`, restart, wait ≥ access TTL, drop secondary.
- **Unlock user:** `UPDATE users SET failed_login_count=0, locked_until=NULL WHERE email=...`
- **Reset DB:** drop `travelai_identity` and re-run migrations.
