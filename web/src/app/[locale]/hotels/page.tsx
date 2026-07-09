import Link from "next/link";
import Image from "next/image";
import { Breadcrumb } from "@/components/breadcrumb";
import { EmptyState } from "@/components/ui/empty-state";
import { PriceTag } from "@/components/ui/price-tag";
import { api } from "@/lib/api";
import { getDict, isLocale, type Locale } from "@/lib/i18n";

export default async function HotelsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ destination?: string; q?: string }>;
}) {
  const { locale: raw } = await params;
  const sp = await searchParams;
  const locale = (isLocale(raw) ? raw : "vi") as Locale;
  const t = getDict(locale);

  let hotels: Awaited<ReturnType<typeof api.listHotels>>["data"] = [];
  try {
    hotels = (await api.listHotels({ destination: sp.destination, q: sp.q, limit: 40 })).data ?? [];
  } catch {
    hotels = [];
  }

  return (
    <div data-testid="content-ready">
      <Breadcrumb items={[{ label: t.nav.home, href: `/${locale}` }, { label: t.nav.hotels }]} />
      <h1 className="animate-fade-in-up text-3xl font-bold">
        <span className="gradient-text">{t.nav.hotels}</span>
      </h1>
      {hotels.length === 0 ? (
        <div className="mt-8">
          <EmptyState title={t.empty.title} description={t.empty.description} ctaHref={`/${locale}`} ctaLabel={t.empty.cta} />
        </div>
      ) : (
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {hotels.map((h) => {
            const img = h.images?.[0] ?? "/images/categories/hotels.jpg";
            return (
              <Link
                key={h.id}
                href={`/${locale}/hotels/${h.slug}`}
                className="card-hover flex overflow-hidden rounded-2xl border border-border bg-card shadow-elevated"
              >
                <div className="relative hidden w-40 shrink-0 sm:block">
                  <Image src={img} alt={h.name} fill className="object-cover" />
                </div>
                <div className="flex flex-1 items-start justify-between gap-3 p-4">
                  <div>
                    <div className="font-semibold">{h.name}</div>
                    <div className="mt-1 text-sm text-muted">
                      {"★".repeat(h.stars)} · {h.destinationSlug ?? ""} · {h.rating?.toFixed(1)}
                    </div>
                  </div>
                  <PriceTag amount={h.priceFromVnd} prefix={t.common.from} suffix={`/${t.common.night}`} locale={locale} />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
