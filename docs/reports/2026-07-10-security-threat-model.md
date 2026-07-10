# Security audit & threat model — TravelAI

**HEAD:** `b49481d` · **Date:** 2026-07-10  
**Method:** STRIDE-lite static review · no active exploits · no secret dump

---

## 1. Trust boundaries

| Boundary | Crossing | Control |
|----------|----------|---------|
| Browser ↔ web | HTTPS/local | CSP, security headers (`next.config.ts`) |
| Browser ↔ identity | credentials include | CORS allowlist, httpOnly refresh cookie |
| Browser ↔ api/ai | Bearer JWT | JWKS verify dual keys |
| ai ↔ webhook | HMAC-SHA256 raw body | `hmac.ts`, rawBody main |
| Admin reindex | Bearer + optional header token | `requireAdmin` + `ADMIN_REINDEX_TOKEN` |
| Registry publish | GITHUB_TOKEN / DOCKERHUB_* | Actions (blocked by billing) |

---

## 2. Authentication matrix

| Control | Status | Evidence |
|---------|--------|----------|
| Ed25519 JWT EdDSA | COMPLETE | keys.ts, tokens.ts |
| Dual JWKS kid primary/secondary | COMPLETE | toJwks, createLocalJWKSet |
| Prod PEM fail-closed | COMPLETE | loadKeySlots requirePem |
| Refresh rotate + hash | COMPLETE | RefreshToken model |
| Account lockout | COMPLETE | failedLoginCount, lockedUntil |
| Refresh httpOnly cookie | COMPLETE | refresh-cookie.ts, Set-Cookie |
| Access sessionStorage | PARTIAL residual XSS | auth-storage.ts |
| refreshToken in JSON body | PARTIAL compat leak to JS | auth.ts deprecated field |
| Cookie Domain multi-host | OPTIONAL env | COOKIE_DOMAIN |
| CSRF on cookie | Mitigated same-site local; None+Secure prod default | routes auth |

---

## 3. Authorization matrix

| Action | AuthN | AuthZ | IDOR control |
|--------|-------|-------|--------------|
| Catalog read | no | public | N/A |
| Bookings | Bearer | userId filter | findFirst userId |
| Wishlist | Bearer | userId | unique user+item |
| Chat | Bearer | user | ai + chat history userId |
| Admin reindex | Bearer | role=admin (+ token) | role check |
| Metrics | no | public | residual S7 |

---

## 4. Findings register

| ID | Sev | Finding | Confidence | Impact | Evidence | Related tests | Status |
|----|-----|---------|------------|--------|----------|---------------|--------|
| S1 | Critical→Rem | Ephemeral JWT in prod | High | Session forgery | keys.ts | keys.test.ts | Remediated |
| S2 | Critical→Rem | Demo admin always | High | Default admin | SEED_DEMO_USER | — | Remediated |
| S3 | High→Rem | CORS reflect | High | CSRF/token theft | main CORS | — | Remediated |
| S4 | High→Rem | Meili filter inject | High | Query abuse | meili-filter.ts | meili-filter.test.ts | Remediated |
| S5 | Medium | Access token sessionStorage XSS | High | Token theft if XSS | auth-storage.ts | auth-storage.test.ts | Open |
| S6 | Medium | refreshToken still in login JSON | High | JS-readable refresh | auth.ts | — | Open |
| S7 | Medium | /metrics unauthenticated | High | Info disclosure | */main.ts | — | Open |
| S8 | Medium | CSP unsafe-eval | Medium | XSS assist | next.config.ts | — | Open Next |
| S9 | High ops | Registry publish never runs | High | No deploy artifacts | Actions billing | — | Open ops |
| S10 | Medium | MinIO unused attack surface | Medium | Extra service | compose | — | Open |
| S11 | Medium | Base compose publishes DB/Redis/Meili | High if misused as prod | Data exposure | docker-compose.yml | prod overlay mitigates | Residual |
| S12 | Low | e2e localStorage drift | High | False test fails | e2e auth spec | e2e | Open |
| S13 | Medium | Prompt injection soft | Medium | Jailbreak advice | system prompt | — | Partial |
| S14 | Low | Tools allowlist public GET only | High | Mitigated tool abuse | deepseek-tools.mjs | tools.test | Mitigated |
| S15 | Info | Mock pay no PAN | High | Intentional | bookings pay | — | OK |

**Counts (open only):** Critical 0 · High 1 (ops S9) · Medium 7 · Low 2 · Info 1  
**Remediated Critical/High:** 4

---

## 5. STRIDE snapshot

| Threat | Example | Mitigation residual |
|--------|---------|---------------------|
| Spoofing | Stolen access token | Short TTL + refresh cookie; XSS residual S5 |
| Tampering | Meili filter | Sanitized |
| Repudiation | Admin actions | AdminAuditLog partial |
| Info disclosure | metrics, body refresh | S6 S7 |
| DoS | chat RL fail-open redis | Residual |
| Elevation | admin role claim | JWT role + reindex token |

---

## 6. Needs runtime verification (not done)

- Cookie SameSite cross-port browser matrix  
- Full e2e with sessionStorage  
- Trivy image scan on built images (blocked without build runners)

## 7. Related

- Feature gap matrix · AI security · Docker/CI · Master remediation R0–R3
