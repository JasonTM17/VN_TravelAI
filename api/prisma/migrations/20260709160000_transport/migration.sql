CREATE TYPE "TransportMode" AS ENUM ('bus', 'train');

CREATE TABLE "transports" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "mode" "TransportMode" NOT NULL,
    "from_city" TEXT NOT NULL,
    "to_city" TEXT NOT NULL,
    "from_code" TEXT NOT NULL,
    "to_code" TEXT NOT NULL,
    "depart_at" TIMESTAMP(3) NOT NULL,
    "arrive_at" TIMESTAMP(3) NOT NULL,
    "price_vnd" INTEGER NOT NULL,
    "duration_min" INTEGER NOT NULL,
    "seats_left" INTEGER NOT NULL DEFAULT 40,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "transports_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "transports_slug_key" ON "transports"("slug");
CREATE INDEX "transports_from_code_to_code_idx" ON "transports"("from_code", "to_code");
CREATE INDEX "transports_mode_idx" ON "transports"("mode");
