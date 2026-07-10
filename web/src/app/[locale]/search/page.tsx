import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/breadcrumb";
import { EmptyState } from "@/components/ui/empty-state";
import { api } from "@/lib/api";
import { getDict, isLocale, type Locale } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const t = getDict(isLocale(raw) ? raw : "vi");
  return { title: t.home.searchCta, description: t.meta.description };
}

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { locale: raw } = await params;
  const { q } = await searchParams;
  const locale = (isLocale(raw) ? raw : "vi") as Locale;
  const t = getDict(locale);

  let data: Awaited<ReturnType<typeof api.search>>["data"] | null = null;
  if (q?.trim()) {
    try {
      data = (await api.search(q.trim())).data;
    } catch {
      data = null;
    }
  }

  const empty =
    !q ||
    !data ||
    ((data.destinations?.length ?? 0) + (data.hotels?.length ?? 0) + (data.tours?.length ?? 0) === 0);

  return (
    <div data-testid="content-ready">
      <Breadcrumb items={[{ label: t.nav.home, href: `/${locale}` }, { label: t.home.searchCta }]} />
      <h1 className="animate-fade-in-up text-3xl font-bold">
        <span className="gradient-text">{q ? `“${q}”` : t.home.searchCta}</span>
      </h1>
      {empty ? (
        <div className="mt-8">
          <EmptyState title={t.empty.title} description={t.empty.description} ctaHref={`/${locale}/explore`} ctaLabel={t.nav.explore} />
        </div>
      ) : (
        <div className="mt-8 space-y-10">
          <section>
            <h2 className="mb-3 font-semibold">{t.nav.explore}</h2>
            <div className="grid gap-2">
              {data!.destinations?.map((d) => (
                <Link key={d.id} href={`/${locale}/destinations/${d.slug}`} className="rounded-xl border border-border bg-card px-4 py-3 hover:border-ocean">
                  {locale === "en" ? d.nameEn : d.nameVi}
                </Link>
              ))}
            </div>
          </section>
          <section>
            <h2 className="mb-3 font-semibold">{t.nav.hotels}</h2>
            <div className="grid gap-2">
              {data!.hotels?.map((h) => (
                <Link key={h.id} href={`/${locale}/hotels/${h.slug}`} className="rounded-xl border border-border bg-card px-4 py-3 hover:border-ocean">
                  {h.name}
                </Link>
              ))}
            </div>
          </section>
          <section>
            <h2 className="mb-3 font-semibold">{t.nav.tours}</h2>
            <div className="grid gap-2">
              {data!.tours?.map((tour) => (
                <Link key={tour.id} href={`/${locale}/tours/${tour.slug}`} className="rounded-xl border border-border bg-card px-4 py-3 hover:border-ocean">
                  {locale === "en" ? tour.titleEn : tour.titleVi}
                </Link>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
