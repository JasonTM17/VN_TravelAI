# Project roadmap — residual

**Purpose:** Việc còn lại sau hardening pass trên `main` (`e653338`..`e715b96`).  
**Không** phải timeline marketing.  
**Source:** scout `docs/reports/vietnam-travel-codebase-scout.md`

## 1. Đã hoàn thành (engineering baseline)

- JWT PEM fail-closed + SEED_DEMO gate  
- CORS allowlist identity/api/ai  
- Meili filter sanitize  
- Web session refresh on 401 + CSP connect-src env  
- Booking two-step mock pay + cancel state machine  
- OpenAPI expand + Redocly CI + generated client  
- Docker frozen-lockfile + prod compose overlay  
- raw HMAC body, request-id, SEO surfaces (sitemap/robots/not-found)  
- CI unit tests hard-fail  

## 2. Residual — Ops

| Item | Status | Action owner |
|------|--------|--------------|
| Bật E2E trên Actions | PARTIAL | Set repo variable `E2E_ENABLED=true` khi billing cho phép |
| Image publish / GHCR visibility | UNKNOWN/ops | Kiểm tra Packages + secrets `DOCKERHUB_*` |
| Lint soft-fail trong CI | PARTIAL | Flip strict sau khi baseline sạch |

## 3. Residual — Product (cần quyết định)

| Item | Status | Ghi chú |
|------|--------|---------|
| Real PSP + inventory | NOT IMPLEMENTED | Không chọn provider trong docs |
| Cookie/httpOnly session | PARTIAL | localStorage residual XSS risk |
| DeepSeek tool-calling / catalog tools | NOT IMPLEMENTED | Cần authz trước tool |
| Chat history persistence | NOT IMPLEMENTED | Không có messages table |
| Transport bookable | NOT IMPLEMENTED | Browse-only |
| MinIO media platform | DISCONNECTED | App không dùng |

## 4. Documentation (this pass)

- Expand README + docs suite (professionalize)  
- Env inventory, runbooks, troubleshooting  

## 5. Explicit non-goals (giữ)

Real Traveloka APIs · native apps · GDS · multi-tenant vendor PMS · premature K8s.

## 6. Related

- [PDR](./project-overview-pdr.md)
- Master plan local: `plans/260710-1615-vietnam-travel-master/` (thường gitignore)
