# Operations runbook

**Last verified:** `9f4d424`

## 1. Health checks

```bash
curl -s http://localhost:53001/healthz
curl -s http://localhost:53002/healthz
curl -s http://localhost:53003/healthz
curl -s http://localhost:53000/healthz
```

## 2. Seed policy

| Flag | Effect |
|------|--------|
| `RUN_SEED=true` | api entrypoint runs catalog seed (incl. PMS room types) |
| `SEED_DEMO_USER=true` | identity ensures demo admin |

Production: both **false**.

## 3. Meili + vector reindex

1. Login as admin  
2. `POST /v1/admin/reindex` with Bearer + optional `X-Admin-Token`  
3. `POST /v1/admin/reindex-vectors` (same auth) for embeddings  
4. Verify keyword search + optional `GET /v1/search/vectors?q=…`  

See `api/README.md` runbook.

## 4. JWT key rotation

1. Set secondary PEM = old primary  
2. Set new primary PEM  
3. Restart identity  
4. Wait ≥ access token TTL  
5. Drop secondary after drain  

## 5. Mailer

| Config | Mode |
|--------|------|
| No SMTP_* | Log only (`[mailer:log]`) |
| `SMTP_URL=smtp://…` or host/user/pass | nodemailer SMTP |
| `SMTP_URL=https://…` | HTTP JSON gateway |

## 6. Backup / restore

```bash
docker exec travelai-postgres pg_dump -U travelai travelai > backup-catalog.sql
docker exec travelai-postgres pg_dump -U travelai travelai_identity > backup-identity.sql
```

After restore: Meili reindex (+ vector reindex if using semantic search).

> [!CAUTION]
> Restore ghi đè dữ liệu. Xác nhận môi trường trước khi chạy.

## 7. Rollback images

1. Pin previous `IMAGE_TAG` / digest in compose  
2. `docker compose … up -d`  
3. Verify healthz + smoke  
4. DB migrations: **không** assume auto-down; restore backup if schema incompatible  

## 8. DeepSeek toggle

- Live: set `DEEPSEEK_API_KEY`, recreate `chat-webhook` + `ai`  
- Offline demo: clear key or `AI_DEGRADED_MODE=true`  

## 9. Related

- [Deployment guide](../deployment-guide.md)
- [Troubleshooting](./troubleshooting.md)
