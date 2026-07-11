# Database overview

**Engine:** PostgreSQL 16 · **ORM:** Prisma 6  
**Last verified:** `a796b94` (2026-07-11)

## 1. Databases

| DB name | Owner service | Schema path |
|---------|---------------|-------------|
| `travelai` | api | `api/prisma/schema.prisma` |
| `travelai_identity` | identity | `identity/prisma/schema.prisma` |

## 2. Identity models

| Model | Notes |
|-------|-------|
| User | email unique, passwordHash, role (`user`\|`admin`), failedLoginCount, lockedUntil |
| RefreshToken | tokenHash unique, expiresAt, revokedAt, FK user cascade |

Migrations: `identity/prisma/migrations/`.

## 3. Catalog & booking models (api)

| Model | Notes |
|-------|-------|
| Destination | slug unique, VI/EN text, geo optional |
| Hotel | slug, priceFromVnd, images[], amenities[], `roomsLeft` aggregate |
| HotelRoomType | PMS room type per hotel (STD/DLX…); maxOccupancy, roomsTotal, basePriceVnd |
| RatePlan | BAR/BB/NR under room type; priceVnd, breakfast, refundable |
| HotelNightInventory | per-night roomsLeft; optional `roomTypeId` scope |
| Tour | slug, duration, priceFromVnd, images[] |
| Flight | seatsLeft soft inventory |
| Transport | bus/train; seatsLeft; **bookable** |
| Review | rating/body; hotel/tour; partial unique per user in SQL |
| Booking | itemType hotel/tour/flight/transport; snapshot JSON (PMS fields); idempotencyKey |
| PaymentAttempt | mock pay audit |
| WishlistItem | unique (userId, itemType, itemId) |
| Itinerary | JSON days |
| Promo | home carousel |
| Notification | email/in-app status for booking confirm etc. |
| ChatConversation / ChatMessage | persisted chat |
| VectorDocument | embedding JSON + metadata; Pinecone mirror flag |
| AdminAuditLog | admin actions |

Migrations: `api/prisma/migrations/` (includes `20260710210000_pms_vectors`).  
Seed: `api/prisma/seed.ts` (gated Docker `RUN_SEED`) — creates room types + rate plans per hotel.

## 4. Booking status & inventory

Allowed transitions (`api/src/lib/booking-state.ts`):

- draft → pending_payment, cancelled  
- pending_payment → confirmed, cancelled  
- confirmed → cancelled  
- cancelled → ∅  

Inventory:

- Hotel: night rows + optional room type; decrement on successful pay  
- Flight/transport: `seatsLeft` decrement/restore  
- Payment: **MOCK** only (`PaymentAttempt`)

## 5. Indexes & integrity

- Unique: emails, slugs, refresh hash, booking `(userId, idempotencyKey)`, room type code per hotel, rate plan code per room type, vector `(sourceType, sourceId)`
- PostgreSQL permits multiple NULL values in `HotelNightInventory(hotelId, night, roomTypeId)`; the legacy hotel-wide (`roomTypeId=NULL`) fallback is not protected by that composite unique constraint. Default PMS paths use non-null room types; a partial unique index or `NULLS NOT DISTINCT` remains a schema hardening item.
- Indexes: destination country, hotel price, flight/transport routes, nights  
- Soft delete: **not** implemented  

## 6. Backup

See [deployment-guide](../deployment-guide.md) `pg_dump` examples. After restore: admin Meili reindex (+ optional vector reindex).

## Related

- [Runbook](../operations/runbook.md)
- [API overview](../api/overview.md)
