-- Flight soft inventory
ALTER TABLE "flights" ADD COLUMN "seats_left" INTEGER NOT NULL DEFAULT 50;

-- Booking item type: transport (Postgres enum)
ALTER TYPE "BookingItemType" ADD VALUE 'transport';

-- Mock payment ledger
CREATE TABLE "payment_attempts" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "outcome" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_attempts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "payment_attempts_booking_id_idx" ON "payment_attempts"("booking_id");

ALTER TABLE "payment_attempts" ADD CONSTRAINT "payment_attempts_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
