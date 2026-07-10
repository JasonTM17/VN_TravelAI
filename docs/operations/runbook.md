# Operations runbook

**Last verified:** `e715b96`

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
| `RUN_SEED=true` | api entrypoint runs catalog seed |
| `SEED_DEMO_USER=true` | identity ensures demo admin |

Production: both **false**.

## 3. Meili reindex

1. Login as admin  
2. `POST /v1/admin/reindex` with Bearer + optional `X-Admin-Token`  
3. Verify search  

See `api/README.md` runbook.

## 4. JWT key rotation

1. Set `JWT_SECONDARY_PRIVATE_KEY` = old primary PEM  
2. Set new primary PEM  
3. Restart identity  
4. Wait ≥ access token TTL  
5. Drop secondary after drain  

## 5. Backup / restore

```bash
docker exec travelai-postgres pg_dump -U travelai travelai > backup-catalog.sql
docker exec travelai-postgres pg_dump -U travelai travelai_identity > backup-identity.sql
# restore
cat backup-catalog.sql | docker exec -i travelai-postgres psql -U travelai travelai
```

After restore: reindex Meili.

> [!CAUTION]
> Restore ghi đè dữ liệu. Xác nhận môi trường trước khi chạy.

## 6. Rollback images

1. Pin previous `IMAGE_TAG` / digest in compose  
2. `docker compose … up -d`  
3. Verify healthz + smoke  
4. DB migrations: **không** assume auto-down; restore backup if schema incompatible  

## 7. DeepSeek toggle

- Live: set `DEEPSEEK_API_KEY`, recreate `chat-webhook` + `ai`  
- Offline demo: clear key or `AI_DEGRADED_MODE=true`  

## 8. Related

- [Deployment guide](../deployment-guide.md)
- [Troubleshooting](./troubleshooting.md)
