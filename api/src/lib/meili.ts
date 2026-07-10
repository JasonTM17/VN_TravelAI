import { MeiliSearch } from "meilisearch";
import type { AppConfig } from "../config.js";
import { prisma } from "../db.js";

export function createMeili(config: AppConfig) {
  return new MeiliSearch({
    host: config.MEILI_HOST,
    apiKey: config.MEILI_MASTER_KEY,
  });
}

async function ensureCleanIndex(client: MeiliSearch, uid: string) {
  try {
    const del = await client.deleteIndex(uid);
    await client.waitForTask(del.taskUid, { timeOutMs: 30_000 });
  } catch {
    // index may not exist yet
  }
  const created = await client.createIndex(uid, { primaryKey: "id" });
  await client.waitForTask(created.taskUid, { timeOutMs: 30_000 });
  return client.index(uid);
}

/**
 * Full rebuild of catalog search indexes from Postgres.
 * Deletes and recreates indexes so reseeded UUIDs never leave stale Meili docs.
 */
export async function reindexAll(client: MeiliSearch) {
  const destinations = await prisma.destination.findMany();
  const hotels = await prisma.hotel.findMany({
    include: { destination: true },
  });
  const tours = await prisma.tour.findMany({
    include: { destination: true },
  });

  const destIndex = await ensureCleanIndex(client, "destinations");
  const hotelIndex = await ensureCleanIndex(client, "hotels");
  const tourIndex = await ensureCleanIndex(client, "tours");

  await destIndex.updateFilterableAttributes(["countryCode", "slug"]);
  await hotelIndex.updateFilterableAttributes(["destinationSlug", "stars", "priceFromVnd"]);
  await tourIndex.updateFilterableAttributes(["destinationSlug", "durationDays"]);
  await destIndex.updateSearchableAttributes([
    "nameVi",
    "nameEn",
    "region",
    "descriptionVi",
    "descriptionEn",
  ]);
  await hotelIndex.updateSearchableAttributes([
    "name",
    "destinationSlug",
    "descriptionVi",
    "descriptionEn",
  ]);
  await tourIndex.updateSearchableAttributes([
    "titleVi",
    "titleEn",
    "destinationSlug",
    "descriptionVi",
    "descriptionEn",
  ]);

  const dTask = await destIndex.addDocuments(
    destinations.map((d) => ({
      id: d.id,
      slug: d.slug,
      nameVi: d.nameVi,
      nameEn: d.nameEn,
      countryCode: d.countryCode,
      region: d.region,
      descriptionVi: d.descriptionVi,
      descriptionEn: d.descriptionEn,
      heroImageUrl: d.heroImageUrl,
    })),
  );
  const hTask = await hotelIndex.addDocuments(
    hotels.map((h) => ({
      id: h.id,
      slug: h.slug,
      name: h.name,
      stars: h.stars,
      priceFromVnd: h.priceFromVnd,
      destinationSlug: h.destination.slug,
      descriptionVi: h.descriptionVi,
      descriptionEn: h.descriptionEn,
      rating: h.rating,
      images: h.images,
    })),
  );
  const tTask = await tourIndex.addDocuments(
    tours.map((t) => ({
      id: t.id,
      slug: t.slug,
      titleVi: t.titleVi,
      titleEn: t.titleEn,
      durationDays: t.durationDays,
      priceFromVnd: t.priceFromVnd,
      destinationSlug: t.destination.slug,
      descriptionVi: t.descriptionVi,
      descriptionEn: t.descriptionEn,
      images: t.images,
    })),
  );

  await Promise.all([
    client.waitForTask(dTask.taskUid, { timeOutMs: 60_000 }),
    client.waitForTask(hTask.taskUid, { timeOutMs: 60_000 }),
    client.waitForTask(tTask.taskUid, { timeOutMs: 60_000 }),
  ]);

  return {
    destinations: destinations.length,
    hotels: hotels.length,
    tours: tours.length,
  };
}
