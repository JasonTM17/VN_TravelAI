# Documentation update — MVP product path sync

**Date:** 2026-07-10  
**HEAD:** `9f4d424`  
**Trigger:** Stale README/status tables still claimed AI PARTIAL / no RAG after residual cooks.

## Root cause

Docs last stamped `e715b96` and older feature-gap language were not refreshed after:

- httpOnly refresh + memory access token  
- Reviews, hotel nights, mailer, SSE, Meili RAG, tools  
- Nodemailer full SMTP, vectors/Pinecone, PMS room types/rate plans  

## Files updated (this pass)

| Area | Files |
|------|--------|
| Root | `README.md`, `SECURITY.md`, `CONTRIBUTING.md` |
| Core docs | `project-overview-pdr.md`, `codebase-summary.md`, `system-architecture.md`, `code-standards.md`, `project-roadmap.md` |
| Domain | `api/overview.md`, `database/overview.md`, `ai/deepseek-chatbot.md`, `architecture/*`, `security/overview.md` |
| Ops | `operations/runbook.md`, env vars, deployment/testing/docker timestamps |
| Service READMEs | `api/README.md`, `ai/README.md` |
| Index | `docs/README.md` |

## Status truth after update

| Claim | Now |
|-------|-----|
| Payment | MOCK |
| AI chat | COMPLETE path (key optional → degraded) |
| RAG / tools / SSE / chat DB | COMPLETE path |
| Admin reindex (Meili + vectors) | COMPLETE |
| PMS room types / rate plans | COMPLETE demo |
| Inventory soft | COMPLETE path |
| Cloud host | UNKNOWN |
| Real PSP | NOT IMPLEMENTED |

## Not rewritten

Historical audit reports under `docs/reports/2026-07-10-*.md` remain as **point-in-time** snapshots. Prefer this report + PDR/roadmap for current status.

## Validation

- Manual cross-check against routes/schema/lib at `9f4d424`
- `node .claude/scripts/validate-docs.cjs` optional if available
