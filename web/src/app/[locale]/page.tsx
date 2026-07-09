import Image from "next/image";
import Link from "next/link";
import { DestinationCard } from "@/components/destination-card";
import { SearchHero } from "@/components/search-hero";
import { EmptyState } from "@/components/ui/empty-state";
import { api } from "@/lib/api";
import { getDict, isLocale, type Locale } from "@/lib/i18n";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "vi") as Locale;
  const t = getDict(locale);

  let destinations: Awaited<ReturnType<typeof api.listDestinations>>["data"] = [];
  try {
    const res = await api.listDestinations();
    destinations = res.data?.slice(0, 8) ?? [];
  } catch {
    destinations = [];
  }

  const categories = [
    { key: "hotels", href: `/${locale}/hotels`, img: "/images/categories/hotels.jpg", label: t.nav.hotels },
    { key: "flights", href: `/${locale}/flights`, img: "/images/categories/flights.jpg", label: t.nav.flights },
    { key: "tours", href: `/${locale}/tours`, img: "/images/categories/tours.jpg", label: t.nav.tours },
    { key: "transport", href: `/${locale}/transport`, img: "/images/categories/transport.jpg", label: locale === "en" ? "Transport" : "Xe / Tàu" },
  ];

  return (
    <div data-testid="content-ready">
      <section className="relative overflow-hidden rounded-3xl border border-border bg-indigo-night text-white shadow-elevated">
        <Image
          src="/images/destinations/ha-long.jpg"
          alt="TravelAI hero"
          fill
          priority
          className="object-cover opacity-45"
        />
        <div className="relative bg-gradient-to-r from-indigo-night/90 via-indigo-night/70 to-transparent px-6 py-16 md:px-12 md:py-20">
          <div className="animate-fade-in-up max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/70">
              {t.tagline}
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
              {t.home.heroTitle}{" "}
              <span className="gradient-text bg-white/10">{t.home.heroHighlight}</span>
            </h1>
            <p className="mt-4 text-base text-white/80 md:text-lg">{t.home.heroSub}</p>
            <SearchHero locale={locale} t={t} />
            <div className="mt-6">
              <Link
                href={`/${locale}/ai`}
                className="inline-flex rounded-full bg-coral px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:-translate-y-0.5"
              >
                {t.home.aiCta}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-14">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="animate-fade-in-up text-2xl font-semibold">
            <span className="gradient-text">{t.home.categories}</span>
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((c) => (
            <Link
              key={c.key}
              href={c.href}
              className="card-hover group relative overflow-hidden rounded-2xl border border-border shadow-elevated"
            >
              <div className="relative aspect-[4/3]">
                <Image src={c.img} alt={c.label} fill className="object-cover transition group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-3 left-3 text-lg font-semibold text-white">{c.label}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-14">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-semibold">
            <span className="gradient-text">{t.home.featured}</span>
          </h2>
          <Link href={`/${locale}/explore`} className="text-sm font-medium text-ocean hover:underline">
            {t.home.viewAll}
          </Link>
        </div>
        {destinations.length === 0 ? (
          <EmptyState
            title={t.empty.title}
            description="API chưa sẵn sàng — chạy docker compose để seed catalog."
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
  );
}
