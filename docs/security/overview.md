# Security overview

**Last verified:** `9f4d424`  
**Reporting:** [SECURITY.md](../../SECURITY.md) — không mở public issue cho lỗ hổng.

## 1. AuthN / AuthZ

| Control | Status | Evidence |
|---------|--------|----------|
| Ed25519 JWT + dual JWKS | COMPLETE | `identity/src/lib/keys.ts` |
| Prod PEM fail-closed | COMPLETE | `loadKeySlots` |
| Refresh rotate + hash store | COMPLETE | `RefreshToken` model |
| Refresh httpOnly cookie | COMPLETE | identity auth response |
| Account lockout | COMPLETE | User fields + login |
| Admin role checks | COMPLETE path | JWT role + admin routes + optional admin token |
| IDOR on bookings | mitigated by `userId` filter | `bookings.ts` |
| Session storage | COMPLETE baseline | Access memory-only default; opt-in `NEXT_PUBLIC_PERSIST_ACCESS` |
| JSON refresh body | gated | `ALLOW_BODY_REFRESH` |

## 2. Network & headers

| Control | Status |
|---------|--------|
| CORS allowlist (api/identity/ai) | COMPLETE |
| CSP + nosniff + frame deny | PARTIAL (`unsafe-eval` still for Next — accepted residual) |
| Metrics | `METRICS_TOKEN` when set → Bearer / X-Metrics-Token |

## 3. Injection & search

| Control | Status |
|---------|--------|
| Zod validation | COMPLETE mutating paths |
| Meili filter sanitize | COMPLETE |
| SQL via Prisma params | COMPLETE pattern |

## 4. AI / webhooks

| Control | Status |
|---------|--------|
| HMAC outbound + inbound raw body | COMPLETE |
| Chat requires JWT | COMPLETE |
| Tool abuse | Mitigated | Read-only catalog tools; args validated; no book/admin tools |
| Catalog RAG | Public catalog only | Meili + vectors |
| Prompt framing | Improved | USER_START/END + untrusted note |
| Prompt injection | PARTIAL | system prompt + framing |
| PII redaction | NOT IMPLEMENTED | |

## 5. Containers & secrets

| Control | Status |
|---------|--------|
| Non-root images | COMPLETE |
| Demo seed gated | COMPLETE `SEED_DEMO_USER` |
| Gitleaks / Trivy / CodeQL workflows | present |

## 6. Payment & mail

| Surface | Status |
|---------|--------|
| Payment | **MOCK** only — no card data |
| Mailer | SMTP / HTTP / log — no secrets in logs |

## 7. Related

- [Env vars](../getting-started/environment-variables.md)
- [SECURITY.md](../../SECURITY.md)
