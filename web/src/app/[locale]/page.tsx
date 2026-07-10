import Image from "next/image";
import Link from "next/link";
import {
  Building2,
  Flame,
  Map,
  Plane,
  Sparkles,
  Star,
  Ticket,
} from "lucide-react";
import { DestinationCard } from "@/components/destination-card";
import { PromoCarousel } from "@/components/promo-carousel";
import { SearchHero } from "@/components/search-hero";
import { EmptyState } from "@/components/ui/empty-state";
import { api } from "@/lib/api";
import { mapPromosToSlides } from "@/lib/promo-map";
import { formatVnd } from "@/lib/utils";
import { getDict, isLocale, tFormat, type Locale } from "@/lib/i18n";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "vi") as Locale;
  const t = getDict(locale);

  let destinations: Awaited<ReturnType<typeof api.listDestinations>>["data"] = [];
  let tours: Awaited<ReturnType<typeof api.listTours>>["data"] = [];
  let hotels: Awaited<ReturnType<typeof api.listHotels>>["data"] = [];
  let promos: ReturnType<typeof mapPromosToSlides> = [];
  let catalogError = false;
  const catalogMeta = { destinations: 0, hotels: 0, tours: 0 };

  // allSettled: one failing resource must not blank the whole homepage
  const [dRes, tourRes, hotelRes, promoRes] = await Promise.allSettled([
    api.listDestinations({ limit: 48 }),
    api.listTours({ limit: 24 }),
    api.listHotels({ limit: 24 }),
    api.listPromos(12),
  ]);
  if (dRes.status === "fulfilled") {
    destinations = dRes.value.data?.slice(0, 12) ?? [];
    catalogMeta.destinations = dRes.value.meta?.total ?? destinations.length;
  } else {
    catalogError = true;
  }
  if (tourRes.status === "fulfilled") {
    const rawTours = tourRes.value.data ?? [];
    catalogMeta.tours = tourRes.value.meta?.total ?? rawTours.length;
    const seen = new Set<string>();
    const picked: typeof tours = [];
    for (const tour of rawTours) {
      const key = tour.destinationSlug ?? tour.slug;
      if (seen.has(key)) continue;
      seen.add(key);
      picked.push(tour);
      if (picked.length >= 8) break;
    }
    tours = picked.length ? picked : rawTours.slice(0, 8);
  } else {
    catalogError = true;
  }
  if (hotelRes.status === "fulfilled") {
    hotels = hotelRes.value.data?.slice(0, 8) ?? [];
    catalogMeta.hotels = hotelRes.value.meta?.total ?? hotels.length;
  } else {
    catalogError = true;
  }
  if (promoRes.status === "fulfilled") {
    promos = mapPromosToSlides(promoRes.value.data, locale, `/${locale}`);
  }

  const emptyHint = catalogError ? t.catalog.apiDown : t.empty.description;

  const products = [
    { href: `/${locale}/hotels`, label: t.nav.hotels, icon: Building2, tone: "bg-[#e8f1fc] text-[#0064d2]" },
    { href: `/${locale}/flights`, label: t.nav.flights, icon: Plane, tone: "bg-[#e8f8f0] text-[#00a86b]" },
    { href: `/${locale}/tours`, label: t.nav.tours, icon: Map, tone: "bg-[#fff4e8] text-[#ff6d00]" },
    { href: `/${locale}/transport`, label: t.nav.transport, icon: Ticket, tone: "bg-[#f3e8ff] text-[#7c3aed]" },
    { href: `/${locale}/ai`, label: t.nav.ai, icon: Sparkles, tone: "bg-[#e0f2fe] text-[#0284c7]" },
  ];

  return (
    <div data-testid="content-ready" className="-mt-8">
      <section className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen bg-[#0064d2] pb-28 pt-12 md:pb-32 md:pt-14">
        <div className="relative mx-auto max-w-4xl px-4 text-center">
          <h1 className="animate-fade-in-up text-3xl font-bold tracking-tight text-white md:text-5xl">
            {t.home.heroTitle}
          </h1>
          <p className="animate-fade-in-up mx-auto mt-3 max-w-2xl text-base text-white/90 md:text-lg">
            {t.home.heroSub}
          </p>
        </div>
      </section>

      <div className="relative z-10 mx-auto -mt-20 max-w-4xl px-0 md:-mt-24">
        <SearchHero locale={locale} t={t} />
      </div>

      <div className="mx-auto max-w-7xl px-0">
        {/* Product discovery — Traveloka multi-vertical icons */}
        <section className="mt-8" aria-label={t.home.categories}>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 sm:gap-3">
            {products.map((p) => (
              <Link
                key={p.href}
                href={p.href}
                className="card-hover flex flex-col items-center gap-2 rounded-xl bg-white px-2 py-3 text-center shadow-elevated"
              >
                <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${p.tone}`}>
                  <p.icon className="h-6 w-6" />
                </span>
                <span className="text-xs font-semibold leading-tight text-[#1a1a1a] sm:text-sm">{p.label}</span>
              </Link>
            ))}
          </div>
          {!catalogError && (catalogMeta.destinations > 0 || catalogMeta.hotels > 0) ? (
            <p
              className="mt-4 text-center text-xs text-muted sm:text-sm"
              data-testid="catalog-stats"
              data-destinations={catalogMeta.destinations}
              data-hotels={catalogMeta.hotels}
              data-tours={catalogMeta.tours}
            >
              {tFormat(t.catalog.statsLine, {
                dest: catalogMeta.destinations,
                hotels: catalogMeta.hotels,
                tours: catalogMeta.tours,
              })}
            </p>
          ) : null}
        </section>

        <section className="mt-12">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-2xl font-bold text-[#1a1a1a]">
              <Flame className="h-6 w-6 text-[#ff6d00]" />
              {t.home.hotDeals}
            </h2>
            <Link href={`/${locale}/tours`} className="text-sm font-semibold text-[#0064d2] hover:underline">
              {t.home.viewAll}
            </Link>
          </div>
          <div className="flex flex-col gap-4 md:flex-row md:items-stretch">
            <div className="min-w-0 flex-1">
              {promos.length >= 1 ? (
                <PromoCarousel slides={promos} locale={locale} />
              ) : (
                <EmptyState
                  title={t.empty.title}
                  description={emptyHint}
                  ctaHref={`/${locale}/explore`}
                  ctaLabel={t.nav.explore}
                />
              )}
            </div>
            <Link
              href={`/${locale}/ai`}
              className="card-hover flex h-48 w-full flex-col justify-between rounded-xl bg-[#0064d2] p-5 text-white shadow-md md:w-64 md:shrink-0"
            >
              <div>
                <Sparkles className="h-6 w-6" />
                <h3 className="mt-3 text-xl font-bold">{t.home.creditPromoTitle}</h3>
                <p className="mt-2 text-sm text-white/85">{t.home.creditPromoSub}</p>
              </div>
              <span className="inline-flex w-fit rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-[#0064d2]">
                {t.home.aiCta}
              </span>
            </Link>
          </div>
        </section>

        {/* Featured hotels */}
        <section className="mt-14">
          <div className="mb-5 flex items-end justify-between">
            <h2 className="text-2xl font-bold text-[#1a1a1a]">{t.home.featuredHotels}</h2>
            <Link href={`/${locale}/hotels`} className="text-sm font-semibold text-[#0064d2] hover:underline">
              {t.home.viewAll}
            </Link>
          </div>
          {hotels.length === 0 ? (
            <EmptyState
              title={t.empty.title}
              description={emptyHint}
              ctaHref={`/${locale}/hotels`}
              ctaLabel={t.nav.hotels}
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {hotels.map((h) => {
                const img = h.images?.[0] ?? "/images/categories/hotels.jpg";
                return (
                  <Link
                    key={h.id}
                    href={`/${locale}/hotels/${h.slug}`}
                    className="card-hover overflow-hidden rounded-xl bg-white shadow-elevated"
                    data-testid="hotel-card"
                    data-slug={h.slug}
                  >
                    <div className="relative aspect-[4/3]">
                      <Image src={img} alt={h.name} fill className="object-cover" sizes="(max-width:768px) 100vw, 25vw" />
                      <span className="absolute left-2 top-2 rounded bg-white/95 px-2 py-0.5 text-xs font-semibold shadow-sm">
                        {h.stars}★
                      </span>
                    </div>
                    <div className="space-y-1.5 p-3">
                      <div className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug">{h.name}</div>
                      <div className="flex items-center gap-1 text-xs text-muted">
                        <Star className="h-3.5 w-3.5 fill-[#ffb400] text-[#ffb400]" />
                        <span className="font-semibold text-[#1a1a1a]">{h.rating?.toFixed(1) ?? "4.5"}</span>
                        <span>· {h.destinationSlug}</span>
                      </div>
                      <div className="text-base font-bold text-[#ff6d00]">
                        {formatVnd(h.priceFromVnd)}
                        <span className="ml-1 text-xs font-medium text-muted">/{t.common.night}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-14">
          <div className="mb-5 flex items-end justify-between">
            <h2 className="text-2xl font-bold text-[#1a1a1a]">{t.home.featuredTours}</h2>
            <Link href={`/${locale}/tours`} className="text-sm font-semibold text-[#0064d2] hover:underline">
              {t.home.viewAll}
            </Link>
          </div>
          {tours.length === 0 ? (
            <EmptyState
              title={t.empty.title}
              description={emptyHint}
              ctaHref={`/${locale}/explore`}
              ctaLabel={t.nav.explore}
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {tours.map((tour) => {
                const title = locale === "en" ? tour.titleEn : tour.titleVi;
                const img = tour.images?.[0] ?? "/images/categories/tours.jpg";
                const sale = tour.priceFromVnd;
                const list = Math.round(sale * 1.25);
                return (
                  <Link
                    key={tour.id}
                    href={`/${locale}/tours/${tour.slug}`}
                    className="card-hover overflow-hidden rounded-xl bg-white shadow-elevated"
                    data-testid="tour-card"
                  >
                    <div className="relative aspect-[4/3]">
                      <Image src={img} alt={title} fill className="object-cover" sizes="(max-width:768px) 100vw, 25vw" />
                      <span className="absolute left-2 top-2 rounded bg-white/95 px-2 py-0.5 text-xs font-semibold text-[#1a1a1a] shadow-sm">
                        {tour.durationDays} {t.common.days}
                      </span>
                    </div>
                    <div className="space-y-1.5 p-3">
                      <div className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-[#1a1a1a]">
                        {title}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted">
                        <Star className="h-3.5 w-3.5 fill-[#ffb400] text-[#ffb400]" />
                        <span className="font-semibold text-[#1a1a1a]">4.8</span>
                        <span>· {tour.destinationSlug}</span>
                      </div>
                      <div className="flex items-baseline gap-2 pt-0.5">
                        <span className="text-xs text-muted line-through">{formatVnd(list)}</span>
                        <span className="text-base font-bold text-[#ff6d00]">{formatVnd(sale)}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-14 pb-4">
          <div className="mb-5 flex items-end justify-between">
            <h2 className="text-2xl font-bold text-[#1a1a1a]">
              <span className="gradient-text">{t.home.featured}</span>
            </h2>
            <Link href={`/${locale}/explore`} className="text-sm font-semibold text-[#0064d2] hover:underline">
              {t.home.viewAll}
            </Link>
          </div>
          {destinations.length === 0 ? (
            <EmptyState
              title={t.empty.title}
              description={emptyHint}
              ctaHref={`/${locale}/ai`}
              ctaLabel={t.home.aiCta}
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {destinations.map((d) => (
                <DestinationCard key={d.id} destination={d} locale={locale} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
