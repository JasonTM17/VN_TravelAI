import type { Metadata } from "next";
import { Breadcrumb } from "@/components/breadcrumb";
import { EmptyState } from "@/components/ui/empty-state";
import { PriceTag } from "@/components/ui/price-tag";
import { api } from "@/lib/api";
import { getDict, isLocale, localeTag, type Locale } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const t = getDict(isLocale(raw) ? raw : "vi");
  return { title: t.catalog.busTrain, description: t.meta.description };
}

export default async function TransportPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ from?: string; to?: string; mode?: string; q?: string }>;
}) {
  const { locale: raw } = await params;
  const sp = await searchParams;
  const locale = (isLocale(raw) ? raw : "vi") as Locale;
  const t = getDict(locale);

  let rows: Awaited<ReturnType<typeof api.listTransports>>["data"] = [];
  try {
    rows =
      (
        await api.listTransports({
          from: sp.from,
          to: sp.to,
          mode: sp.mode,
          q: sp.q,
          limit: 40,
        })
      ).data ?? [];
  } catch {
    rows = [];
  }

  return (
    <div data-testid="content-ready">
      <Breadcrumb
        locale={locale}
        items={[
          { label: t.nav.home, href: `/${locale}` },
          { label: t.catalog.transport },
        ]}
      />
      <h1 className="animate-fade-in-up text-3xl font-bold">
        <span className="gradient-text">{t.catalog.busTrain}</span>
      </h1>
      <p className="mt-2 text-sm text-muted">{t.catalog.mockTransport}</p>
      {rows.length === 0 ? (
        <div className="mt-8">
          <EmptyState title={t.empty.title} description={t.empty.description} ctaHref={`/${locale}`} ctaLabel={t.empty.cta} />
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          {rows.map((r) => (
            <div
              key={r.id}
              className="card-hover flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-elevated"
            >
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-ocean">{r.mode}</div>
                <div className="font-semibold">
                  {r.operator} · {r.fromCity} → {r.toCity}
                </div>
                <div className="text-sm text-muted">
                  {r.from}–{r.to} · {new Date(r.departAt).toLocaleString(localeTag(locale))} ·{" "}
                  {Math.round(r.durationMin / 60)}
                  {t.common.hoursShort} · {r.seatsLeft} {t.common.seats}
                </div>
              </div>
              <PriceTag amount={r.priceVnd} locale={locale} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
