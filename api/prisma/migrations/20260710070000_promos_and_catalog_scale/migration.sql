-- CreateTable
CREATE TABLE IF NOT EXISTS "promos" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title_vi" TEXT NOT NULL,
    "title_en" TEXT NOT NULL,
    "badge_vi" TEXT NOT NULL,
    "badge_en" TEXT NOT NULL,
    "badge_tone" TEXT NOT NULL DEFAULT 'cta',
    "image_url" TEXT NOT NULL,
    "href_path" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promos_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "promos_slug_key" ON "promos"("slug");
CREATE INDEX IF NOT EXISTS "promos_active_sort_order_idx" ON "promos"("active", "sort_order");
