# Tài liệu TravelAI (Vietnam Travel)

**Mục đích:** Index chính thức cho developer, reviewer và operator.  
**Source of truth:** source code, compose, schema, OpenAPI, ADR, CI.  
**Last verified:** commit `e715b96` (2026-07-10).

## Bắt đầu nhanh

| Ai | Đọc trước |
|----|-----------|
| Người xem GitHub | [README gốc](../README.md) |
| Developer mới | [Local setup](./getting-started/local-setup.md) → [Env vars](./getting-started/environment-variables.md) |
| Frontend | [web/README](../web/README.md) · [Design](./design-guidelines.md) · [i18n ADR](./adr/0005-i18n-locale-routes.md) |
| Backend / API | [api/README](../api/README.md) · [API overview](./api/overview.md) · [OpenAPI](./openapi.yaml) |
| Identity | [identity/README](../identity/README.md) · [Auth ADR](./adr/0006-ed25519-jwt-auth.md) |
| AI | [ai/README](../ai/README.md) · [DeepSeek chatbot](./ai/deepseek-chatbot.md) |
| Database | [Database overview](./database/overview.md) |
| DevOps | [Docker](./docker/overview.md) · [Deployment](./deployment-guide.md) · [Runbook](./operations/runbook.md) |
| QA | [Testing](./testing/overview.md) |
| Security | [Security overview](./security/overview.md) · [SECURITY.md](../SECURITY.md) |

## Mục lục docs/

### Tổng quan

- [Project overview / PDR](./project-overview-pdr.md)
- [Codebase summary](./codebase-summary.md)
- [System architecture](./system-architecture.md)
- [Code standards](./code-standards.md)
- [Design guidelines](./design-guidelines.md)
- [Project roadmap](./project-roadmap.md)

### Getting started

- [Local setup](./getting-started/local-setup.md)
- [Environment variables](./getting-started/environment-variables.md)

### Architecture & domain

- [Services](./architecture/services.md)
- [Data flows](./architecture/data-flows.md)
- [API overview](./api/overview.md)
- [Database overview](./database/overview.md)
- [DeepSeek chatbot](./ai/deepseek-chatbot.md)

### Vận hành

- [Docker overview](./docker/overview.md)
- [Deployment guide](./deployment-guide.md)
- [Troubleshooting](./operations/troubleshooting.md)
- [Runbook](./operations/runbook.md)
- [Testing](./testing/overview.md)
- [Security overview](./security/overview.md)

### ADR & contract

- [ADR index](./adr/0001-record-architecture-decisions.md) · [0002](./adr/0002-service-split-and-stack.md) · [0003 Fastify](./adr/0003-fastify-backends.md) · [0004 AI/n8n](./adr/0004-ai-via-n8n.md) · [0005 i18n](./adr/0005-i18n-locale-routes.md) · [0006 JWT](./adr/0006-ed25519-jwt-auth.md) · [0007 Meili](./adr/0007-meilisearch-catalog-search.md)
- [OpenAPI 3.1](./openapi.yaml)
- [Lighthouse budgets](./lighthouse-budgets.md)

### Media & báo cáo

- [Product media](./media/README.md) — screenshot + GIF (dùng bởi README)
- [Codebase scout](./reports/vietnam-travel-codebase-scout.md)
- [Documentation update report](./reports/documentation-update-2026-07-10.md)

## Quy ước trạng thái

| Label | Ý nghĩa |
|-------|---------|
| CONFIRMED / COMPLETE | Có code + tích hợp thật |
| PARTIAL | Có code, chưa đủ production depth |
| MOCK | Stub / mock (vd. payment) |
| DISCONNECTED | Artifact có nhưng path runtime không dùng (vd. n8n JSON vs chat-webhook local) |
| NOT IMPLEMENTED | Không có trong repo |
| UNKNOWN | Chưa đủ bằng chứng |

## Liên kết root

- [CONTRIBUTING](../CONTRIBUTING.md)
- [SECURITY](../SECURITY.md)
- [CHANGELOG](../CHANGELOG.md)
- [LICENSE](../LICENSE)
