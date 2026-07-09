# Contributing to TravelAI

Thanks for your interest in contributing. This project is maintained by a sole
primary author; external contributions are welcome via pull requests.

## Development setup

1. Copy `.env.example` to `.env`.
2. Start infrastructure: `docker compose up -d postgres redis meilisearch minio`.
3. Run services (see each service `README.md`).
4. Prefer `pnpm` for Node workspaces.

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(api): add hotel search filters
fix(identity): rotate refresh tokens on reuse
docs(readme): document demo credentials
```

- Subject ≤ 72 characters, imperative mood, no trailing period.
- Do **not** add AI co-author trailers (`Co-Authored-By: Claude`, etc.).

## Pull requests

1. Branch from `main`: `feat/...`, `fix/...`, `docs/...`.
2. Keep PRs focused (one logical change cluster).
3. CI must pass: build, test, lint, security scans.
4. Update OpenAPI when changing public HTTP contracts.
5. Add or update ADR under `docs/adr/` for architecture decisions.

## Code style

- TypeScript strict mode.
- Validate all mutating request bodies (Zod or class-validator).
- Every service exposes `/healthz`, `/readyz`, `/metrics`.

## Security

- Never commit `.env`, keys, tokens, or real credentials.
- Report vulnerabilities privately (see `SECURITY.md`).
