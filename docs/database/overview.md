# Database overview

**Engine:** PostgreSQL 16 · **ORM:** Prisma 6  
**Last verified:** `e715b96`

## 1. Databases

| DB name | Owner service | Schema path |
|---------|---------------|-------------|
| `travelai` | api | `api/prisma/schema.prisma` |
| `travelai_identity` | identity | `identity/prisma/schema.prisma` |

Init: compose postgres + `infra` scripts if present.

## 2. Identity models

| Model | Notes |
|-------|-------|
| User | email unique, passwordHash, role (`user`\|`admin`), failedLoginCount, lockedUntil |
| RefreshToken | tokenHash unique, expiresAt, revokedAt, FK user cascade |

Migrations: under `identity/prisma/migrations/`.

## 3. Catalog models (api)

| Model | Notes |
|-------|-------|
| Destination | slug unique, VI/EN text, geo optional |
| Hotel | slug, priceFromVnd, images[], amenities[], destination FK |
| Tour | slug, duration, priceFromVnd, images[] |
| Flight | airline, route codes, priceVnd (search inventory) |
| Transport | bus/train enum, seatsLeft, **not bookable via BookingItemType** |
| Review | rating, body; optional hotel/tour |
| Booking | userId (no cross-DB FK), itemType, status, idempotencyKey unique, money fields |
| WishlistItem | unique (userId, itemType, itemId) |
| Itinerary | JSON days |
| Promo | home carousel |
| AdminAuditLog | admin actions |

Migrations: `api/prisma/migrations/`.  
Seed: `api/prisma/seed.ts` (gated Docker `RUN_SEED`).

## 4. Booking status risks

Allowed transitions (`api/src/lib/booking-state.ts`):

- draft → pending_payment, cancelled  
- pending_payment → confirmed, cancelled  
- confirmed → cancelled  
- cancelled → ∅  

**MISSING:** inventory decrement, payment transaction table, refund entity.

## 5. Indexes & integrity

- Unique: emails, slugs, refresh hash, booking idempotencyKey  
- Indexes: destination country, hotel price, flight/transport routes  
- Soft delete: **not** implemented  
- Chat messages table: **not** implemented  

## 6. Backup

See [deployment-guide](../deployment-guide.md) `pg_dump` examples. After restore: admin Meili reindex.

## Related

- [Runbook](../operations/runbook.md)
