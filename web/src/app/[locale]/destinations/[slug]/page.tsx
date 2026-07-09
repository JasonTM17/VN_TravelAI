import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Breadcrumb } from "@/components/breadcrumb";
import { EmptyState } from "@/components/ui/empty-state";
import { api } from "@/lib/api";
import { getDict, isLocale, type Locale } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { slug, locale } = await params;
  try {
    const { data } = await api.getDestination(slug);
    const title = locale === "en" ? data.nameEn : data.nameVi;
    return {
      title,
      description: locale === "en" ? data.descriptionEn : data.descriptionVi,
      openGraph: { title, images: [data.heroImageUrl] },
    };
  } catch {
    return { title: "Destination" };
  }
}

export default async function DestinationDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  const locale = (isLocale(raw) ? raw : "vi") as Locale;
  const t = getDict(locale);

  let dest = null as Awaited<ReturnType<typeof api.getDestination>>["data"] | null;
  let hotels: Awaited<ReturnType<typeof api.listHotels>>["data"] = [];
  let tours: Awaited<ReturnType<typeof api.listTours>>["data"] = [];
  try {
    dest = (await api.getDestination(slug)).data;
    hotels = (await api.listHotels({ destination: slug, limit: 6 })).data ?? [];
    tours = (await api.listTours({ destination: slug, limit: 6 })).data ?? [];
  } catch {
    dest = null;
  }

  if (!dest) {
    return (
      <EmptyState title={t.empty.title} description={t.empty.description} ctaHref={`/${locale}/explore`} ctaLabel={t.nav.explore} />
    );
  }

  const name = locale === "en" ? dest.nameEn : dest.nameVi;
  const desc = locale === "en" ? dest.descriptionEn : dest.descriptionVi;
  const img = dest.heroImageUrl?.startsWith("/") ? dest.heroImageUrl : `/images/destinations/${dest.slug}.jpg`;

  return (
    <div data-testid="content-ready">
      <Breadcrumb
        items={[
          { label: t.nav.home, href: `/${locale}` },
          { label: t.nav.explore, href: `/${locale}/explore` },
          { label: name },
        ]}
      />
      <div className="relative mb-8 h-72 overflow-hidden rounded-3xl border border-border shadow-elevated md:h-96">
        <Image src={img} alt={name} fill priority className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-6 left-6 right-6 animate-fade-in-up">
          <div className="text-sm uppercase tracking-wide text-white/70">{dest.countryCode}</div>
          <h1 className="text-4xl font-bold text-white">
            <span className="gradient-text">{name}</span>
          </h1>
        </div>
      </div>
      <p className="max-w-3xl text-muted">{desc}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href={`/${locale}/hotels?destination=${slug}`} className="rounded-full bg-ocean px-4 py-2 text-sm font-medium text-white shadow-glow">
          {t.nav.hotels}
        </Link>
        <Link href={`/${locale}/tours?destination=${slug}`} className="rounded-full border border-border bg-white px-4 py-2 text-sm font-medium">
          {t.nav.tours}
        </Link>
        <Link href={`/${locale}/ai`} className="rounded-full bg-coral px-4 py-2 text-sm font-medium text-white">
          {t.home.aiCta}
        </Link>
      </div>

      <h2 className="mt-12 text-xl font-semibold">{t.nav.hotels}</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {hotels.map((h) => (
          <Link key={h.id} href={`/${locale}/hotels/${h.slug}`} className="card-hover rounded-2xl border border-border bg-card p-4 shadow-elevated">
            <div className="font-semibold">{h.name}</div>
            <div className="text-sm text-muted">{"★".repeat(h.stars)} · {h.priceFromVnd.toLocaleString("vi-VN")} VND</div>
          </Link>
        ))}
      </div>

      <h2 className="mt-12 text-xl font-semibold">{t.nav.tours}</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {tours.map((tour) => (
          <Link key={tour.id} href={`/${locale}/tours/${tour.slug}`} className="card-hover rounded-2xl border border-border bg-card p-4 shadow-elevated">
            <div className="font-semibold">{locale === "en" ? tour.titleEn : tour.titleVi}</div>
            <div className="text-sm text-muted">{tour.durationDays} {t.common.days} · {tour.priceFromVnd.toLocaleString("vi-VN")} VND</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
