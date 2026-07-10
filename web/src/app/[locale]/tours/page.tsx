import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import { Breadcrumb } from "@/components/breadcrumb";
import { EmptyState } from "@/components/ui/empty-state";
import { api } from "@/lib/api";
import { formatVnd } from "@/lib/utils";
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
      <h1 className="animate-fade-in-up text-3xl font-bold text-[#1a1a1a]">{t.nav.tours}</h1>
      {tours.length === 0 ? (
        <div className="mt-8">
          <EmptyState title={t.empty.title} description={t.empty.description} ctaHref={`/${locale}`} ctaLabel={t.empty.cta} />
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tours.map((tour) => {
            const title = locale === "en" ? tour.titleEn : tour.titleVi;
            const img = tour.images?.[0] ?? "/images/categories/tours.jpg";
            const sale = tour.priceFromVnd;
            const list = Math.round(sale * 1.18);
            return (
              <Link
                key={tour.id}
                href={`/${locale}/tours/${tour.slug}`}
                className="card-hover overflow-hidden rounded-xl bg-white shadow-elevated"
              >
                <div className="relative aspect-[4/3]">
                  <Image src={img} alt={title} fill className="object-cover" sizes="(max-width:768px) 100vw, 33vw" />
                  <span className="absolute left-2 top-2 rounded bg-white/95 px-2 py-0.5 text-xs font-semibold shadow-sm">
                    {tour.durationDays} {t.common.days}
                  </span>
                </div>
                <div className="space-y-1.5 p-3">
                  <div className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug">{title}</div>
                  <div className="flex items-center gap-1 text-xs text-muted">
                    <Star className="h-3.5 w-3.5 fill-[#ffb400] text-[#ffb400]" />
                    <span className="font-semibold text-[#1a1a1a]">4.8</span>
                    <span>· {tour.destinationSlug}</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs text-muted line-through">{formatVnd(list)}</span>
                    <span className="text-base font-bold text-[#ff6d00]">{formatVnd(sale)}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
