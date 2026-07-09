import Image from "next/image";
import Link from "next/link";
import { Sparkles, ShieldCheck, MapPinned, Star } from "lucide-react";
import { DestinationCard } from "@/components/destination-card";
import { SearchHero } from "@/components/search-hero";
import { EmptyState } from "@/components/ui/empty-state";
import { api } from "@/lib/api";
import { formatVnd } from "@/lib/utils";
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
  let tours: Awaited<ReturnType<typeof api.listTours>>["data"] = [];
  try {
    const [d, tourRes] = await Promise.all([api.listDestinations(), api.listTours({ limit: 4 })]);
    destinations = d.data?.slice(0, 8) ?? [];
    tours = tourRes.data?.slice(0, 4) ?? [];
  } catch {
    destinations = [];
    tours = [];
  }

  const promos = [
    {
      title: locale === "en" ? "Ha Long premium cruise" : "Du thuyền Hạ Long đẳng cấp",
      img: "/images/destinations/ha-long.jpg",
      href: `/${locale}/destinations/ha-long`,
      badge: "HOT",
    },
    {
      title: locale === "en" ? "Hoi An lantern nights" : "Hội An — Mùa lồng đèn lung linh",
      img: "/images/destinations/hoi-an.jpg",
      href: `/${locale}/destinations/hoi-an`,
      badge: "-15%",
    },
  ];

  return (
    <div data-testid="content-ready" className="-mt-8">
      {/* Hero — Stitch WanderViet / Traveloka pattern */}
      <section className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen overflow-hidden bg-[#0064d2]">
        <div className="absolute inset-0">
          <Image
            src="/images/destinations/ha-long.jpg"
            alt="TravelAI hero"
            fill
            priority
            className="object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0064d2]/95 via-[#0064d2]/75 to-[#f5f7fa]" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-12 text-center sm:pt-16">
          <h1 className="animate-fade-in-up text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
            {locale === "en" ? "Explore the beauty of Vietnam" : "Khám phá vẻ đẹp Việt Nam"}
          </h1>
          <p className="animate-fade-in-up mx-auto mt-3 max-w-2xl text-sm text-white/90 sm:text-base">
            {t.home.heroSub}
          </p>
          <SearchHero locale={locale} t={t} />
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <Link href={`/${locale}/ai`} className="btn-accent">
              <Sparkles className="h-4 w-4" />
              {t.home.aiCta}
            </Link>
            <Link
              href={`/${locale}/explore`}
              className="rounded-lg border border-white/40 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur hover:bg-white/20"
            >
              {t.nav.explore}
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-0">
        {/* Trust strip */}
        <section className="relative z-10 -mt-6 grid gap-3 sm:grid-cols-3">
          {[
            {
              icon: <MapPinned className="h-5 w-5 text-[#0064d2]" />,
              title: locale === "en" ? "20+ destinations" : "20+ điểm đến",
              desc: locale === "en" ? "Vietnam first + world" : "Việt Nam & thế giới",
            },
            {
              icon: <Sparkles className="h-5 w-5 text-[#ff6d00]" />,
              title: locale === "en" ? "AI itineraries" : "Lịch trình AI",
              desc: "TravelAI Concierge",
            },
            {
              icon: <ShieldCheck className="h-5 w-5 text-[#00a86b]" />,
              title: locale === "en" ? "Secure booking" : "Đặt chỗ an toàn",
              desc: locale === "en" ? "Mock pay ready" : "Thanh toán mock sẵn sàng",
            },
          ].map((item) => (
            <div key={item.title} className="surface-panel flex items-start gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#e8f1fc]">{item.icon}</div>
              <div>
                <div className="font-semibold">{item.title}</div>
                <div className="text-sm text-muted">{item.desc}</div>
              </div>
            </div>
          ))}
        </section>

        {/* Hot promos — Stitch pattern */}
        <section className="mt-12">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#ff6d00]">
                {locale === "en" ? "Hot deals" : "Khuyến mãi cực hot"}
              </p>
              <h2 className="text-2xl font-bold text-[#1a1a1a]">
                {locale === "en" ? "Featured offers" : "Ưu đãi nổi bật"}
              </h2>
            </div>
            <Link href={`/${locale}/tours`} className="text-sm font-semibold text-[#0064d2] hover:underline">
              {t.home.viewAll}
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {promos.map((p) => (
              <Link key={p.href} href={p.href} className="card-hover group relative overflow-hidden rounded-xl shadow-elevated">
                <div className="relative aspect-[16/10]">
                  <Image src={p.img} alt={p.title} fill className="object-cover transition duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <span className="absolute left-3 top-3 rounded-md bg-[#ff6d00] px-2 py-0.5 text-xs font-bold text-white">
                    {p.badge}
                  </span>
                  <div className="absolute bottom-3 left-3 right-3 text-sm font-semibold text-white">{p.title}</div>
                </div>
              </Link>
            ))}
            <Link
              href={`/${locale}/ai`}
              className="card-hover flex flex-col justify-between rounded-xl bg-gradient-to-br from-[#0064d2] to-[#0d9488] p-5 text-white shadow-elevated"
            >
              <div>
                <Sparkles className="h-6 w-6" />
                <h3 className="mt-3 text-lg font-bold">TravelAI Concierge</h3>
                <p className="mt-2 text-sm text-white/85">
                  {locale === "en"
                    ? "Multi-day plans linked to real hotels & tours."
                    : "Sinh lịch trình nhiều ngày, gắn khách sạn & tour thật."}
                </p>
              </div>
              <span className="mt-4 inline-flex w-fit rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-[#0064d2]">
                {t.home.aiCta}
              </span>
            </Link>
          </div>
        </section>

        {/* Tours grid */}
        <section className="mt-12">
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-2xl font-bold">
              {locale === "en" ? "Featured tours" : "Tour đặc sắc"}
            </h2>
            <Link href={`/${locale}/tours`} className="text-sm font-semibold text-[#0064d2] hover:underline">
              {t.home.viewAll}
            </Link>
          </div>
          {tours.length === 0 ? (
            <EmptyState title={t.empty.title} description={t.empty.description} ctaHref={`/${locale}/explore`} ctaLabel={t.nav.explore} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {tours.map((tour) => {
                const title = locale === "en" ? tour.titleEn : tour.titleVi;
                const img = tour.images?.[0] ?? "/images/categories/tours.jpg";
                return (
                  <Link
                    key={tour.id}
                    href={`/${locale}/tours/${tour.slug}`}
                    className="card-hover overflow-hidden rounded-xl bg-white shadow-elevated"
                  >
                    <div className="relative aspect-[4/3]">
                      <Image src={img} alt={title} fill className="object-cover" />
                    </div>
                    <div className="space-y-1.5 p-3">
                      <div className="line-clamp-2 text-sm font-semibold leading-snug">{title}</div>
                      <div className="flex items-center gap-1 text-xs text-muted">
                        <Star className="h-3.5 w-3.5 fill-[#ffb400] text-[#ffb400]" />
                        4.8 · {tour.durationDays} {t.common.days}
                      </div>
                      <div className="text-base font-bold text-[#ff6d00]">{formatVnd(tour.priceFromVnd)}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Destinations */}
        <section className="mt-12 pb-4">
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-2xl font-bold">
              <span className="gradient-text">{t.home.featured}</span>
            </h2>
            <Link href={`/${locale}/explore`} className="text-sm font-semibold text-[#0064d2] hover:underline">
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
    </div>
  );
}
