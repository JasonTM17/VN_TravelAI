-- PMS: room types + rate plans
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE "hotel_room_types" (
    "id" UUID NOT NULL,
    "hotel_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "name_vi" TEXT NOT NULL,
    "max_occupancy" INTEGER NOT NULL DEFAULT 2,
    "rooms_total" INTEGER NOT NULL,
    "base_price_vnd" INTEGER NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hotel_room_types_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "hotel_room_types_hotel_id_code_key" ON "hotel_room_types"("hotel_id", "code");
CREATE INDEX "hotel_room_types_hotel_id_idx" ON "hotel_room_types"("hotel_id");

ALTER TABLE "hotel_room_types" ADD CONSTRAINT "hotel_room_types_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "rate_plans" (
    "id" UUID NOT NULL,
    "room_type_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "name_vi" TEXT NOT NULL,
    "price_vnd" INTEGER NOT NULL,
    "breakfast_included" BOOLEAN NOT NULL DEFAULT false,
    "refundable" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rate_plans_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "rate_plans_room_type_id_code_key" ON "rate_plans"("room_type_id", "code");
CREATE INDEX "rate_plans_room_type_id_idx" ON "rate_plans"("room_type_id");

ALTER TABLE "rate_plans" ADD CONSTRAINT "rate_plans_room_type_id_fkey" FOREIGN KEY ("room_type_id") REFERENCES "hotel_room_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Default STD room type per hotel (for existing inventory + bookings)
INSERT INTO "hotel_room_types" ("id", "hotel_id", "code", "name_en", "name_vi", "max_occupancy", "rooms_total", "base_price_vnd", "sort_order")
SELECT gen_random_uuid(), h."id", 'STD', 'Standard Room', 'Phòng Tiêu chuẩn', 2, GREATEST(h."rooms_left", 1), h."price_from_vnd", 0
FROM "hotels" h;

INSERT INTO "rate_plans" ("id", "room_type_id", "code", "name_en", "name_vi", "price_vnd", "breakfast_included", "refundable")
SELECT gen_random_uuid(), rt."id", 'BAR', 'Best Available Rate', 'Giá tốt nhất', rt."base_price_vnd", false, true
FROM "hotel_room_types" rt
WHERE rt."code" = 'STD';

INSERT INTO "rate_plans" ("id", "room_type_id", "code", "name_en", "name_vi", "price_vnd", "breakfast_included", "refundable")
SELECT gen_random_uuid(), rt."id", 'BB', 'Bed & Breakfast', 'Phòng + bữa sáng', CAST(rt."base_price_vnd" * 1.15 AS INTEGER), true, true
FROM "hotel_room_types" rt
WHERE rt."code" = 'STD';

-- Night inventory: scope by room type
ALTER TABLE "hotel_night_inventory" ADD COLUMN "room_type_id" UUID;

UPDATE "hotel_night_inventory" ni
SET "room_type_id" = rt."id"
FROM "hotel_room_types" rt
WHERE rt."hotel_id" = ni."hotel_id" AND rt."code" = 'STD' AND ni."room_type_id" IS NULL;

DROP INDEX IF EXISTS "hotel_night_inventory_hotel_id_night_key";

CREATE UNIQUE INDEX "hotel_night_inventory_hotel_id_night_room_type_id_key"
  ON "hotel_night_inventory"("hotel_id", "night", "room_type_id");

CREATE INDEX "hotel_night_inventory_room_type_id_idx" ON "hotel_night_inventory"("room_type_id");

ALTER TABLE "hotel_night_inventory" ADD CONSTRAINT "hotel_night_inventory_room_type_id_fkey"
  FOREIGN KEY ("room_type_id") REFERENCES "hotel_room_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Vector documents (embeddings mirror)
CREATE TABLE "vector_documents" (
    "id" UUID NOT NULL,
    "source_type" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" JSONB NOT NULL,
    "dim" INTEGER NOT NULL,
    "metadata" JSONB,
    "backend" TEXT NOT NULL DEFAULT 'postgres',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vector_documents_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "vector_documents_source_type_source_id_key" ON "vector_documents"("source_type", "source_id");
CREATE INDEX "vector_documents_source_type_idx" ON "vector_documents"("source_type");
