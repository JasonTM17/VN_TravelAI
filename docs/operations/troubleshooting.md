# Troubleshooting

**Last verified:** `a796b94` (2026-07-11)

Mỗi mục: symptoms → causes → diagnostics → resolution → verification → avoid.

---

### Web không mở / 502

1. **Symptoms:** Browser không load `:53000`  
2. **Causes:** container web down; sai `NEXT_PUBLIC_*`; port conflict  
3. **Diagnostics:** `docker compose ps`; `curl http://localhost:53000/healthz`  
4. **Resolution:** recreate web; check local overlay ports  
5. **Verification:** home `/vi` renders  
6. **Avoid:** `docker system prune -a` ngay đầu  

### API unhealthy

1. **Symptoms:** `/healthz` fail; web empty catalog  
2. **Causes:** migrate fail; DATABASE_URL; postgres down  
3. **Diagnostics:** `docker logs` api; `curl :53001/healthz`  
4. **Resolution:** fix DB URL; let entrypoint migrate; ensure postgres healthy  
5. **Verification:** `GET /v1/promos` 200  
6. **Avoid:** xóa volume DB khi chưa backup  

### Identity không login

1. **Symptoms:** 401/500 login  
2. **Causes:** identity DB; redis RL edge; SEED off; wrong CORS  
3. **Diagnostics:** logs identity; `GET /.well-known/jwks.json`  
4. **Resolution:** migrate identity; set CORS include web origin; local SEED_DEMO  
5. **Verification:** login returns tokens  
6. **Avoid:** ephemeral JWT in production  

### Migration failed

1. **Symptoms:** api/identity exit on start  
2. **Causes:** schema drift; DB unreachable  
3. **Diagnostics:** entrypoint logs `prisma migrate deploy`  
4. **Resolution:** restore connectivity; apply migrations intentionally  
5. **Verification:** service stays up; `/readyz`  
6. **Avoid:** hand-edit production DB without backup  

### Meilisearch / reindex

1. **Symptoms:** search empty/stale  
2. **Causes:** meili down; wrong key; need reindex after seed  
3. **Diagnostics:** meili health; api logs  
4. **Resolution:** admin reindex with JWT + optional `X-Admin-Token`  
5. **Verification:** `GET /v1/search?q=...`  
6. **Avoid:** reindex spam production without maintenance window  

### DeepSeek / chatbot

1. **Symptoms:** always degraded; 401 webhook  
2. **Causes:** missing `DEEPSEEK_API_KEY`; HMAC mismatch; wrong `N8N_WEBHOOK_BASE_URL`  
3. **Diagnostics:** ai logs; `node scripts/smoke-chat.mjs`  
4. **Resolution:** set key; recreate chat-webhook+ai; align HMAC  
5. **Verification:** chat reply without degraded when key valid  
6. **Avoid:** paste real keys into issues/docs  

### Port conflict

1. **Symptoms:** bind error 3000/53000  
2. **Causes:** other compose projects  
3. **Diagnostics:** `netstat` / Docker port map  
4. **Resolution:** use local overlay 53000+ or change host ports in env  
5. **Verification:** unique listeners  
6. **Avoid:** random kill processes  

### Pull image fail

1. **Symptoms:** prod compose pull 401/404  
2. **Causes:** private package; missing package-read login; wrong tag; assuming release `v0.2.0` also created semver image tags
3. **Diagnostics:** `docker login ghcr.io` / hub  
4. **Resolution:** `docker login ghcr.io`; pin an existing immutable `sha-...` tag (`latest` is mutable)
5. **Verification:** `docker pull …`  
6. **Avoid:** force rebuild production without tag pin  

## Related

- [Runbook](./runbook.md)
- [Local setup](../getting-started/local-setup.md)
