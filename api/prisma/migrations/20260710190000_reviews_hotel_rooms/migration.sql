-- Soft hotel room inventory
ALTER TABLE "hotels" ADD COLUMN "rooms_left" INTEGER NOT NULL DEFAULT 20;

CREATE INDEX IF NOT EXISTS "reviews_hotel_id_idx" ON "reviews"("hotel_id");
CREATE INDEX IF NOT EXISTS "reviews_tour_id_idx" ON "reviews"("tour_id");
CREATE INDEX IF NOT EXISTS "reviews_user_id_idx" ON "reviews"("user_id");

-- One review per user per hotel / per tour (seed rows with null user_id unrestricted)
CREATE UNIQUE INDEX IF NOT EXISTS "reviews_user_hotel_unique"
  ON "reviews"("user_id", "hotel_id")
  WHERE "user_id" IS NOT NULL AND "hotel_id" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "reviews_user_tour_unique"
  ON "reviews"("user_id", "tour_id")
  WHERE "user_id" IS NOT NULL AND "tour_id" IS NOT NULL;
