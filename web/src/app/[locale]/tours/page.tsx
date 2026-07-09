import Link from "next/link";
import { Breadcrumb } from "@/components/breadcrumb";
import { EmptyState } from "@/components/ui/empty-state";
import { PriceTag } from "@/components/ui/price-tag";
import { api } from "@/lib/api";
import { getDict, isLocale, type Locale } from "@/lib/i18n";

export default async function ToursPage({
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

  let tours: Awaited<ReturnType<typeof api.listTours>>["data"] = [];
  try {
    tours = (await api.listTours({ destination: sp.destination, q: sp.q, limit: 40 })).data ?? [];
  } catch {
    tours = [];
  }

  return (
    <div data-testid="content-ready">
      <Breadcrumb items={[{ label: t.nav.home, href: `/${locale}` }, { label: t.nav.tours }]} />
      <h1 className="animate-fade-in-up text-3xl font-bold">
        <span className="gradient-text">{t.nav.tours}</span>
      </h1>
      {tours.length === 0 ? (
        <div className="mt-8">
          <EmptyState title={t.empty.title} description={t.empty.description} ctaHref={`/${locale}`} ctaLabel={t.empty.cta} />
        </div>
      ) : (
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {tours.map((tour) => (
            <Link
              key={tour.id}
              href={`/${locale}/tours/${tour.slug}`}
              className="card-hover flex items-start justify-between gap-3 rounded-2xl border border-border bg-card p-5 shadow-elevated"
            >
              <div>
                <div className="font-semibold">{locale === "en" ? tour.titleEn : tour.titleVi}</div>
                <div className="mt-1 text-sm text-muted">
                  {tour.durationDays} {t.common.days} · {tour.destinationSlug}
                </div>
              </div>
              <PriceTag amount={tour.priceFromVnd} prefix={t.common.from} locale={locale} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
