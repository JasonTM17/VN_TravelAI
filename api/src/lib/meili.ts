import { MeiliSearch } from "meilisearch";
import type { AppConfig } from "../config.js";
import { prisma } from "../db.js";

export function createMeili(config: AppConfig) {
  return new MeiliSearch({
    host: config.MEILI_HOST,
    apiKey: config.MEILI_MASTER_KEY,
  });
}

export async function reindexAll(client: MeiliSearch) {
  const destinations = await prisma.destination.findMany();
  const hotels = await prisma.hotel.findMany({
    include: { destination: true },
  });
  const tours = await prisma.tour.findMany({
    include: { destination: true },
  });

  const destIndex = client.index("destinations");
  const hotelIndex = client.index("hotels");
  const tourIndex = client.index("tours");

  await destIndex.updateFilterableAttributes(["countryCode", "slug"]);
  await hotelIndex.updateFilterableAttributes(["destinationSlug", "stars", "priceFromVnd"]);
  await tourIndex.updateFilterableAttributes(["destinationSlug", "durationDays"]);
  await destIndex.updateSearchableAttributes(["nameVi", "nameEn", "region", "descriptionVi", "descriptionEn"]);
  await hotelIndex.updateSearchableAttributes(["name", "destinationSlug", "descriptionVi", "descriptionEn"]);
  await tourIndex.updateSearchableAttributes(["titleVi", "titleEn", "destinationSlug", "descriptionVi", "descriptionEn"]);

  await destIndex.addDocuments(
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

  await hotelIndex.addDocuments(
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

  await tourIndex.addDocuments(
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
}
