import { Breadcrumb } from "@/components/breadcrumb";
import { DestinationCard } from "@/components/destination-card";
import { EmptyState } from "@/components/ui/empty-state";
import { api } from "@/lib/api";
import { getDict, isLocale, type Locale } from "@/lib/i18n";

export default async function ExplorePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "vi") as Locale;
  const t = getDict(locale);

  let destinations: Awaited<ReturnType<typeof api.listDestinations>>["data"] = [];
  try {
    destinations = (await api.listDestinations()).data ?? [];
  } catch {
    destinations = [];
  }

  return (
    <div data-testid="content-ready">
      <Breadcrumb
        items={[
          { label: t.nav.home, href: `/${locale}` },
          { label: t.nav.explore },
        ]}
      />
      <h1 className="animate-fade-in-up text-3xl font-bold">
        <span className="gradient-text">{t.nav.explore}</span>
      </h1>
      <p className="mt-2 text-muted">{t.tagline}</p>
      {destinations.length === 0 ? (
        <div className="mt-8">
          <EmptyState title={t.empty.title} description={t.empty.description} ctaHref={`/${locale}`} ctaLabel={t.empty.cta} />
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {destinations.map((d) => (
            <DestinationCard key={d.id} destination={d} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}
