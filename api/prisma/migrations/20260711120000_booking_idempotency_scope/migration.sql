DROP INDEX IF EXISTS "bookings_idempotency_key_key";

ALTER TABLE "bookings" ADD COLUMN "request_fingerprint" TEXT;

CREATE UNIQUE INDEX "bookings_user_id_idempotency_key_key"
ON "bookings"("user_id", "idempotency_key");
