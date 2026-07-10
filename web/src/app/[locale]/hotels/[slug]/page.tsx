import type { Metadata } from "next";
import { Breadcrumb } from "@/components/breadcrumb";
import { EmptyState } from "@/components/ui/empty-state";
import { PriceTag } from "@/components/ui/price-tag";
import { BookButton } from "@/components/book-button";
import { WishlistButton } from "@/components/wishlist-button";
import { ReviewForm } from "@/components/review-form";
import { ImageGallery } from "@/components/image-gallery";
import { api } from "@/lib/api";
import { getDict, isLocale, type Locale } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}): Promise<Metadata> {
  const { slug, locale } = await params;
  try {
    const { data } = await api.getHotel(slug);
    const description =
      locale === "en"
        ? data.descriptionEn ?? data.name
        : data.descriptionVi ?? data.name;
    return { title: data.name, description };
  } catch {
    return { title: "Hotel" };
  }
}

export default async function HotelDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  const locale = (isLocale(raw) ? raw : "vi") as Locale;
  const t = getDict(locale);

  let hotel = null as Awaited<ReturnType<typeof api.getHotel>>["data"] | null;
  try {
    hotel = (await api.getHotel(slug)).data;
  } catch {
    hotel = null;
  }

  if (!hotel) {
    return <EmptyState title={t.empty.title} description={t.empty.description} ctaHref={`/${locale}/hotels`} ctaLabel={t.nav.hotels} />;
  }

  const desc = locale === "en" ? hotel.descriptionEn : hotel.descriptionVi;

  return (
    <div data-testid="content-ready">
      <Breadcrumb
        items={[
          { label: t.nav.home, href: `/${locale}` },
          { label: t.nav.hotels, href: `/${locale}/hotels` },
          { label: hotel.name },
        ]}
      />
      <div className="grid gap-8 lg:grid-cols-2">
        <ImageGallery
          images={hotel.images}
          alt={hotel.name}
          fallback="/images/categories/hotels.jpg"
          priority
          locale={locale}
        />
        <div className="animate-fade-in-up">
          <h1 className="text-3xl font-bold">
            <span className="gradient-text">{hotel.name}</span>
          </h1>
          <p className="mt-2 text-sm text-muted">{"★".repeat(hotel.stars)} · {hotel.destinationSlug}</p>
          <p className="mt-4 text-muted">{desc}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {(hotel.amenities ?? []).map((a) => (
              <span key={a} className="rounded-full bg-ocean/10 px-3 py-1 text-xs font-medium text-ocean">
                {a}
              </span>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-elevated">
            <div>
              <PriceTag amount={hotel.priceFromVnd} prefix={t.common.from} suffix={`/${t.common.night}`} locale={locale} />
              {typeof hotel.roomsLeft === "number" ? (
                <p className="mt-1 text-xs text-muted">
                  {hotel.roomsLeft} {locale === "vi" ? "phòng còn" : "rooms left"}
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <WishlistButton locale={locale} itemType="hotel" itemId={hotel.id} label={t.nav.wishlist} />
              <BookButton locale={locale} itemType="hotel" itemId={hotel.id} label={t.common.book} />
            </div>
          </div>
          <div className="mt-8 space-y-3">
            <h2 className="font-semibold">{t.common.reviews}</h2>
            <ReviewForm locale={locale} hotelId={hotel.id} />
            {hotel.reviews?.length
              ? hotel.reviews.map((r, i) => (
                  <div key={i} className="rounded-xl border border-border bg-white p-3 text-sm">
                    <div className="font-medium">{r.author} · {"★".repeat(r.rating)}</div>
                    <p className="mt-1 text-muted">{r.body}</p>
                  </div>
                ))
              : null}
          </div>
        </div>
      </div>
    </div>
  );
}
