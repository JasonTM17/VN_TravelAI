import Link from "next/link";
import Image from "next/image";
import { Breadcrumb } from "@/components/breadcrumb";
import { CatalogPager } from "@/components/catalog-pager";
import { EmptyState } from "@/components/ui/empty-state";
import { PriceTag } from "@/components/ui/price-tag";
import { api } from "@/lib/api";
import { getDict, isLocale, type Locale } from "@/lib/i18n";

export default async function HotelsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ destination?: string; q?: string; page?: string; limit?: string }>;
}) {
  const { locale: raw } = await params;
  const sp = await searchParams;
  const locale = (isLocale(raw) ? raw : "vi") as Locale;
  const t = getDict(locale);
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const limit = Math.min(48, Math.max(12, Number(sp.limit ?? 24) || 24));

  let hotels: Awaited<ReturnType<typeof api.listHotels>>["data"] = [];
  let total = 0;
  try {
    const res = await api.listHotels({
      destination: sp.destination,
      q: sp.q,
      page,
      limit,
    });
    hotels = res.data ?? [];
    total = res.meta?.total ?? hotels.length;
  } catch {
    hotels = [];
  }

  return (
    <div data-testid="content-ready">
      <Breadcrumb items={[{ label: t.nav.home, href: `/${locale}` }, { label: t.nav.hotels }]} />
      <h1 className="animate-fade-in-up text-3xl font-bold">
        <span className="gradient-text">{t.nav.hotels}</span>
      </h1>
      <p className="mt-2 text-sm text-muted" data-testid="hotels-count">
        {total} {t.catalog.staysInCatalog}
      </p>
      {hotels.length === 0 ? (
        <div className="mt-8">
          <EmptyState title={t.empty.title} description={t.empty.description} ctaHref={`/${locale}`} ctaLabel={t.empty.cta} />
        </div>
      ) : (
        <>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
                  <div className="relative aspect-[16/10]">
                    <Image src={img} alt={h.name} fill className="object-cover" sizes="(max-width:768px) 100vw, 33vw" />
                    <span className="absolute left-2 top-2 rounded bg-white/95 px-2 py-0.5 text-xs font-semibold shadow-sm">
                      {h.stars}★
                    </span>
                  </div>
                  <div className="space-y-1.5 p-3">
                    <div className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug">{h.name}</div>
                    <div className="text-xs text-muted">
                      {h.destinationSlug ?? ""} · {h.rating?.toFixed(1) ?? "—"} ★
                    </div>
                    <PriceTag amount={h.priceFromVnd} prefix={t.common.from} suffix={`/${t.common.night}`} locale={locale} />
                  </div>
                </Link>
              );
            })}
          </div>
          <CatalogPager
            locale={locale}
            basePath="/hotels"
            page={page}
            limit={limit}
            total={total}
            query={{ destination: sp.destination, q: sp.q }}
          />
        </>
      )}
    </div>
  );
}
