# Environment variables

**Purpose:** Inventory biến môi trường từ `.env.example`, `.env.production.example`, và service config.  
**Rules:** Chỉ tên biến + safe example. **Không** copy giá trị từ file `.env` thật.

**Sources:** `.env.example`, `.env.production.example`, `*/src/config.ts`, compose files.

## Legend

| Column | Meaning |
|--------|---------|
| Required | Cần để service hoạt động đúng role |
| Secret | Credential / key — rotate, không log |
| Server-only | Không prefix `NEXT_PUBLIC_` |
| Frontend-safe | Được embed browser (`NEXT_PUBLIC_*`) |

## 1. Compose / data plane

| Variable | Service | Required | Secret | Server-only | Purpose | Safe example | Source |
|----------|---------|----------|--------|-------------|---------|--------------|--------|
| COMPOSE_PROJECT_NAME | compose | no | no | yes | Project name | `travelai` | `.env.example` |
| POSTGRES_USER | postgres | yes | no | yes | DB user | `travelai` | `.env.example` |
| POSTGRES_PASSWORD | postgres | yes | **yes** | yes | DB password | `change_me` | `.env.example` |
| POSTGRES_DB | postgres | yes | no | yes | Catalog DB name | `travelai` | `.env.example` |
| IDENTITY_DB | postgres | yes | no | yes | Identity DB name | `travelai_identity` | `.env.example` |
| POSTGRES_HOST_PORT | host | no | no | yes | Published PG port | `5432` | `.env.example` |
| REDIS_URL | redis clients | yes | partial | yes | Redis URL; prod overlay derives authenticated URL from required `REDIS_PASSWORD` | `redis://redis:6379` | `.env.example` |
| REDIS_HOST_PORT | host | no | no | yes | Published redis | `6379` | `.env.example` |
| MEILI_MASTER_KEY | meili/api | yes | **yes** | yes | Meili key | `dev_key_change_me` | `.env.example` |
| MEILI_HOST | api | yes | no | yes | Meili URL | `http://meilisearch:7700` | `.env.example` |
| MEILI_HOST_PORT | host | no | no | yes | Published Meili | `7700` | `.env.example` |
| MINIO_ROOT_USER | minio | no* | **yes** | yes | MinIO user | `minioadmin` | `.env.example` |
| MINIO_ROOT_PASSWORD | minio | no* | **yes** | yes | MinIO password | `minioadmin` | `.env.example` |
| MINIO_BUCKET | minio | no* | no | yes | Bucket name | `travelai` | `.env.example` |

\*MinIO **DISCONNECTED** khỏi app code hiện tại; có trong compose.

## 2. Identity

| Variable | Service | Required | Secret | Server-only | Purpose | Safe example | Source |
|----------|---------|----------|--------|-------------|---------|--------------|--------|
| IDENTITY_PORT / PORT | identity | no | no | yes | Listen port | `3002` | README / example |
| IDENTITY_DATABASE_URL / DATABASE_URL | identity | yes | **yes** | yes | Identity Postgres | `postgresql://user:pass@postgres:5432/travelai_identity` | `.env.example` |
| IDENTITY_JWT_ISSUER / JWT_ISSUER | identity | no | no | yes | JWT iss | `https://identity.travelai.local` | `.env.example` |
| IDENTITY_JWT_AUDIENCE / JWT_AUDIENCE | identity | no | no | yes | JWT aud | `travelai-web` | `.env.example` |
| IDENTITY_JWT_PRIMARY_PRIVATE_KEY | identity | **prod yes** | **yes** | yes | Ed25519 PKCS8 PEM | *(empty local)* | `.env.example` |
| IDENTITY_JWT_SECONDARY_PRIVATE_KEY | identity | no | **yes** | yes | Rotation slot | *(empty)* | `.env.example` |
| JWT_REQUIRE_PEM | identity | no | no | yes | Force PEM even non-prod | `true` | keys.ts / example comments |
| IDENTITY_COOKIE_SECRET | identity | no | **yes** | yes | Cookie secret (if used) | `32+_char_dev_only` | `.env.example` |
| DEMO_USER_EMAIL | identity | no | no | yes | Demo seed email | `demo@travelai.local` | `.env.example` |
| DEMO_USER_PASSWORD | identity | no | **yes** | yes | Demo seed password | `DemoTravelAI1!` | `.env.example` |
| SEED_DEMO_USER | identity | no | no | yes | Gate demo seed | `true` local / `false` prod | `.env.example` |
| CORS_ORIGINS | identity | prod yes | no | yes | CORS allowlist | `http://localhost:53000` | `.env.example` |
| REDIS_URL | identity | no | partial | yes | Rate limit; authenticated in prod overlay | `redis://redis:6379` | config |

> [!CAUTION]
> `SEED_DEMO_USER=true` + default demo password **chỉ local**. Production: `false`.

## 3. API

| Variable | Service | Required | Secret | Server-only | Purpose | Safe example | Source |
|----------|---------|----------|--------|-------------|---------|--------------|--------|
| API_PORT / PORT | api | no | no | yes | Listen | `3001` | example |
| DATABASE_URL | api | yes | **yes** | yes | Catalog DB | `postgresql://…/travelai` | example |
| DIRECT_URL | api | no | **yes** | yes | Prisma direct | same as DATABASE_URL | example |
| IDENTITY_JWKS_URL | api | yes | no | yes | JWKS fetch | `http://identity:3002/.well-known/jwks.json` | example |
| IDENTITY_ISSUER | api | yes | no | yes | Expected iss | matches identity | example |
| CORS_ORIGINS | api | yes prod | no | yes | CORS | localhost list | example |
| RUN_SEED | api entrypoint | no | no | yes | Seed on boot | `true` local | example |
| ADMIN_REINDEX_TOKEN | api | no* | **yes** | yes | Dual factor reindex | ≥16 chars | api README |
| MEILI_* | api | yes search | see above | yes | Search | | example |
| SMTP_URL | api mailer | no | partial | yes | `smtp://` or `https://` gateway; empty = log | *(empty)* | example |
| SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS | api | no | **yes** pass | yes | Host SMTP | | example |
| SMTP_SECURE / SMTP_FROM | api | no | no | yes | TLS + From header | `false` / `TravelAI <noreply@…>` | example |
| EMBEDDING_API_KEY / OPENAI_API_KEY | api vectors | no | **yes** | yes | Embeddings API; empty = local hash | *(empty)* | example |
| EMBEDDING_BASE_URL / EMBEDDING_MODEL | api | no | no | yes | Embed endpoint | OpenAI-compatible | example |
| PINECONE_API_KEY / PINECONE_INDEX | api | no | **yes** key | yes | Optional vector backend | | example |
| METRICS_TOKEN | api/identity/ai | no | **yes** | yes | Gate `/metrics` | *(empty local)* | example |

## 4. AI / DeepSeek / n8n

| Variable | Service | Required | Secret | Server-only | Purpose | Safe example | Source |
|----------|---------|----------|--------|-------------|---------|--------------|--------|
| AI_PORT / PORT | ai | no | no | yes | Listen | `3003` | example |
| N8N_WEBHOOK_BASE_URL | ai | yes chat | no | yes | Webhook base | `http://chat-webhook:5678/webhook` local | compose.local |
| N8N_HMAC_SECRET | ai + webhook | yes | **yes** | yes | HMAC SHA-256; production requires 32+ characters | `long_random_dev` | example |
| AI_DEGRADED_MODE | ai | no | no | yes | Force degrade | `false` | example |
| API_BASE_URL | ai | yes RAG | no | yes | Catalog/vector RAG base | `http://api:3001` | compose / config |
| IDENTITY_JWKS_URL | ai | yes | no | yes | Auth verify | identity JWKS | example |
| CORS_ORIGINS | ai | yes prod | no | yes | CORS | | example |
| DEEPSEEK_API_KEY | chat-webhook | optional live | **yes** | yes | DeepSeek key | *(empty → degrade)* | example |
| DEEPSEEK_MODEL | chat-webhook | no | no | yes | Model id | `deepseek-v4-flash` | example |
| DEEPSEEK_BASE_URL | chat-webhook | no | no | yes | API base | `https://api.deepseek.com` | example |
| N8N_ENCRYPTION_KEY | n8n | if n8n used | **yes** | yes | n8n crypto | 32+ chars | example |
| N8N_BASIC_AUTH_USER | n8n | if n8n used | no | yes | UI auth | `admin` | example |
| N8N_BASIC_AUTH_PASSWORD | n8n | if n8n used | **yes** | yes | UI password | `change_me` | example |

## 5. Web

| Variable | Service | Required | Secret | Server-only | Purpose | Safe example | Source |
|----------|---------|----------|--------|-------------|---------|--------------|--------|
| WEB_PORT | compose | no | no | yes | Host map | `3000` / local 53000 | example |
| NEXT_PUBLIC_API_URL | web | yes browser | no | **no** | Browser API | `http://localhost:53001` | example / local |
| NEXT_PUBLIC_IDENTITY_URL | web | yes | no | **no** | Browser identity | `http://localhost:53002` | example |
| NEXT_PUBLIC_AI_URL | web | yes | no | **no** | Browser AI | `http://localhost:53003` | example |
| NEXT_PUBLIC_DEFAULT_LOCALE | web | no | no | **no** | Locale | `vi` | example |
| NEXT_PUBLIC_CSP_CONNECT_SRC | web | no | no | **no** | Extra CSP connect-src | `https://api.example.com` | next.config |
| NEXT_PUBLIC_BOOK_AUTOPAY | web | no | no | **no** | Auto mock pay on book | `true` only demo | book-button |
| NEXT_PUBLIC_PERSIST_ACCESS | web | no | no | **no** | Access token in sessionStorage | `false` default | auth-storage |
| API_INTERNAL_URL | web SSR | Docker yes | no | yes | In-compose API | `http://api:3001` | compose |
| IDENTITY_INTERNAL_URL | web SSR | Docker yes | no | yes | In-compose identity | `http://identity:3002` | compose |
| AI_INTERNAL_URL | web SSR | Docker yes | no | yes | In-compose AI | `http://ai:3003` | compose |
| NEXT_PUBLIC_DEMO_PREFILL | web | no | no | **no** | Prefill login form | local | deployment-guide |
| API_INTERNAL_URL | web SSR | yes Docker | no | yes | Server-side API | `http://api:3001` | example |
| IDENTITY_INTERNAL_URL | web SSR | no | no | yes | SSR identity | `http://identity:3002` | example |
| AI_INTERNAL_URL | web SSR | no | no | yes | SSR AI | `http://ai:3003` | example |

> [!WARNING]
> Mọi `NEXT_PUBLIC_*` bị bake vào bundle browser. **Không** đặt secret vào các biến này.

## 6. App-wide

| Variable | Service | Required | Secret | Server-only | Purpose | Safe example | Source |
|----------|---------|----------|--------|-------------|---------|--------------|--------|
| NODE_ENV | all | yes prod | no | yes | Mode | `production` | example |
| LOG_LEVEL | backends | no | no | yes | Log verbosity | `info` | example |

## 7. Inconsistencies (docs only — không sửa code)

| Note | Detail |
|------|--------|
| ADR-0002 NestJS vs Fastify | Implementation = Fastify (ADR-0003) |
| identity README PEM | Nói “required prod”; keys.ts fail-closed khi `NODE_ENV=production` hoặc `JWT_REQUIRE_PEM` |
| OpenAPI client vs runtime | Generated `web/src/generated/openapi.ts` tồn tại; runtime `web/src/lib/api.ts` |

## 8. Related

- [Local setup](./local-setup.md)
- [Security overview](../security/overview.md)
