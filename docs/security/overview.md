# Security overview

**Last verified:** `e715b96`  
**Reporting:** [SECURITY.md](../../SECURITY.md) — không mở public issue cho lỗ hổng.

## 1. AuthN / AuthZ

| Control | Status | Evidence |
|---------|--------|----------|
| Ed25519 JWT + dual JWKS | COMPLETE | `identity/src/lib/keys.ts` |
| Prod PEM fail-closed | COMPLETE | `loadKeySlots` |
| Refresh rotate + hash store | COMPLETE | `RefreshToken` model |
| Account lockout | COMPLETE | User fields + login |
| Admin role checks | PARTIAL | JWT role + admin routes |
| IDOR on bookings | mitigated by `userId` filter | `bookings.ts` |
| Session storage | Improved | Access **memory-only** default; refresh **httpOnly cookie**; opt-in `NEXT_PUBLIC_PERSIST_ACCESS` |
| JSON refresh body | Improved | Omitted unless `ALLOW_BODY_REFRESH=true` |

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
| Prompt framing | Improved | USER_START/END + untrusted note (`prompt-guard.mjs`) |
| Prompt injection | PARTIAL |

## 5. Containers & secrets

| Control | Status |
|---------|--------|
| Non-root images | COMPLETE |
| Demo seed gated | COMPLETE `SEED_DEMO_USER` |
| No secrets in README values beyond published demo local examples | policy |
| Gitleaks / Trivy / CodeQL workflows | present |

## 6. Payment

Mock only — **no card data**. Real PSP NOT IMPLEMENTED.

## 7. Related

- [Env vars](../getting-started/environment-variables.md)
- Scout security section
