CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE "BookingStatus" AS ENUM ('draft', 'pending_payment', 'confirmed', 'cancelled');
CREATE TYPE "BookingItemType" AS ENUM ('hotel', 'tour', 'flight');
CREATE TYPE "WishlistItemType" AS ENUM ('hotel', 'tour', 'destination');

CREATE TABLE "destinations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "name_vi" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "country_code" TEXT NOT NULL,
    "region" TEXT,
    "description_vi" TEXT NOT NULL,
    "description_en" TEXT NOT NULL,
    "hero_image_url" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "destinations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "hotels" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "stars" INTEGER NOT NULL DEFAULT 3,
    "price_from_vnd" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'VND',
    "destination_id" UUID NOT NULL,
    "description_vi" TEXT NOT NULL,
    "description_en" TEXT NOT NULL,
    "images" TEXT[],
    "amenities" TEXT[],
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 4.5,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "hotels_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tours" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "title_vi" TEXT NOT NULL,
    "title_en" TEXT NOT NULL,
    "duration_days" INTEGER NOT NULL,
    "price_from_vnd" INTEGER NOT NULL,
    "destination_id" UUID NOT NULL,
    "description_vi" TEXT NOT NULL,
    "description_en" TEXT NOT NULL,
    "images" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tours_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "flights" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "airline" TEXT NOT NULL,
    "flight_number" TEXT NOT NULL,
    "from_code" TEXT NOT NULL,
    "to_code" TEXT NOT NULL,
    "depart_at" TIMESTAMP(3) NOT NULL,
    "arrive_at" TIMESTAMP(3) NOT NULL,
    "price_vnd" INTEGER NOT NULL,
    "cabin" TEXT NOT NULL DEFAULT 'economy',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "flights_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "reviews" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "author" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "body" TEXT NOT NULL,
    "hotel_id" UUID,
    "tour_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bookings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'draft',
    "item_type" "BookingItemType" NOT NULL,
    "item_id" UUID NOT NULL,
    "item_snapshot" JSONB NOT NULL,
    "guests" INTEGER NOT NULL DEFAULT 1,
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "total_vnd" INTEGER NOT NULL,
    "contact_name" TEXT,
    "contact_email" TEXT,
    "contact_phone" TEXT,
    "idempotency_key" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "wishlist_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "item_type" "WishlistItemType" NOT NULL,
    "item_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "wishlist_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "itineraries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "destination" TEXT NOT NULL,
    "days_json" JSONB NOT NULL,
    "estimated_budget_vnd" INTEGER NOT NULL,
    "hotel_suggestions" JSONB NOT NULL,
    "degraded" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "itineraries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "destinations_slug_key" ON "destinations"("slug");
CREATE INDEX "destinations_country_code_idx" ON "destinations"("country_code");
CREATE UNIQUE INDEX "hotels_slug_key" ON "hotels"("slug");
CREATE INDEX "hotels_destination_id_idx" ON "hotels"("destination_id");
CREATE INDEX "hotels_price_from_vnd_idx" ON "hotels"("price_from_vnd");
CREATE UNIQUE INDEX "tours_slug_key" ON "tours"("slug");
CREATE INDEX "tours_destination_id_idx" ON "tours"("destination_id");
CREATE INDEX "flights_from_code_to_code_idx" ON "flights"("from_code", "to_code");
CREATE UNIQUE INDEX "bookings_idempotency_key_key" ON "bookings"("idempotency_key");
CREATE INDEX "bookings_user_id_idx" ON "bookings"("user_id");
CREATE INDEX "wishlist_items_user_id_idx" ON "wishlist_items"("user_id");
CREATE UNIQUE INDEX "wishlist_items_user_id_item_type_item_id_key" ON "wishlist_items"("user_id", "item_type", "item_id");
CREATE INDEX "itineraries_user_id_idx" ON "itineraries"("user_id");

ALTER TABLE "hotels" ADD CONSTRAINT "hotels_destination_id_fkey" FOREIGN KEY ("destination_id") REFERENCES "destinations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tours" ADD CONSTRAINT "tours_destination_id_fkey" FOREIGN KEY ("destination_id") REFERENCES "destinations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_tour_id_fkey" FOREIGN KEY ("tour_id") REFERENCES "tours"("id") ON DELETE SET NULL ON UPDATE CASCADE;
