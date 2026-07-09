import Image from "next/image";
import type { Metadata } from "next";
import { Breadcrumb } from "@/components/breadcrumb";
import { BookButton } from "@/components/book-button";
import { WishlistButton } from "@/components/wishlist-button";
import { EmptyState } from "@/components/ui/empty-state";
import { PriceTag } from "@/components/ui/price-tag";
import { api } from "@/lib/api";
import { getDict, isLocale, type Locale } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}): Promise<Metadata> {
  const { slug, locale } = await params;
  try {
    const { data } = await api.getTour(slug);
    const title = locale === "en" ? data.titleEn : data.titleVi;
    return { title, description: data.descriptionEn };
  } catch {
    return { title: "Tour" };
  }
}

export default async function TourDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  const locale = (isLocale(raw) ? raw : "vi") as Locale;
  const t = getDict(locale);
  let tour = null as Awaited<ReturnType<typeof api.getTour>>["data"] | null;
  try {
    tour = (await api.getTour(slug)).data;
  } catch {
    tour = null;
  }
  if (!tour) {
    return <EmptyState title={t.empty.title} description={t.empty.description} ctaHref={`/${locale}/tours`} ctaLabel={t.nav.tours} />;
  }
  const title = locale === "en" ? tour.titleEn : tour.titleVi;
  const desc = locale === "en" ? tour.descriptionEn : tour.descriptionVi;
  const img = tour.images?.[0] ?? "/images/categories/tours.jpg";

  return (
    <div data-testid="content-ready">
      <Breadcrumb
        items={[
          { label: t.nav.home, href: `/${locale}` },
          { label: t.nav.tours, href: `/${locale}/tours` },
          { label: title },
        ]}
      />
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-border">
          <Image src={img} alt={title} fill className="object-cover" />
        </div>
        <div className="animate-fade-in-up">
          <h1 className="text-3xl font-bold">
            <span className="gradient-text">{title}</span>
          </h1>
          <p className="mt-2 text-sm text-muted">
            {tour.durationDays} {t.common.days} · {tour.destinationSlug}
          </p>
          <p className="mt-4 text-muted">{desc}</p>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
            <PriceTag amount={tour.priceFromVnd} prefix={t.common.from} locale={locale} />
            <div className="flex flex-wrap items-center gap-2">
              <WishlistButton locale={locale} itemType="tour" itemId={tour.id} label={t.nav.wishlist} />
              <BookButton locale={locale} itemType="tour" itemId={tour.id} label={t.common.book} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
