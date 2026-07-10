CREATE TABLE "hotel_night_inventory" (
    "id" UUID NOT NULL,
    "hotel_id" UUID NOT NULL,
    "night" DATE NOT NULL,
    "rooms_left" INTEGER NOT NULL,

    CONSTRAINT "hotel_night_inventory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "hotel_night_inventory_hotel_id_night_key" ON "hotel_night_inventory"("hotel_id", "night");
CREATE INDEX "hotel_night_inventory_night_idx" ON "hotel_night_inventory"("night");

ALTER TABLE "hotel_night_inventory" ADD CONSTRAINT "hotel_night_inventory_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'email',
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "email_to" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "meta" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sent_at" TIMESTAMP(3),

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");
CREATE INDEX "notifications_status_idx" ON "notifications"("status");
