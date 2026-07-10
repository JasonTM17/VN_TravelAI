import type { Metadata } from "next";
import { Breadcrumb } from "@/components/breadcrumb";
import { FlightSearch } from "@/components/flight-search";
import { getDict, isLocale, type Locale } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const t = getDict(isLocale(raw) ? raw : "vi");
  return { title: t.nav.flights, description: t.meta.description };
}

export default async function FlightsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "vi") as Locale;
  const t = getDict(locale);

  return (
    <div data-testid="content-ready">
      <Breadcrumb items={[{ label: t.nav.home, href: `/${locale}` }, { label: t.nav.flights }]} />
      <h1 className="animate-fade-in-up text-3xl font-bold">
        <span className="gradient-text">{t.nav.flights}</span>
      </h1>
      <p className="mt-2 text-sm text-muted">{t.catalog.mockFlights}</p>
      <div className="mt-8">
        <FlightSearch locale={locale} />
      </div>
    </div>
  );
}
