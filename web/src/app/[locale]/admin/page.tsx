import type { Metadata } from "next";
import { Breadcrumb } from "@/components/breadcrumb";
import { AdminConsole } from "@/components/admin-console";
import { getDict, isLocale, type Locale } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const t = getDict(isLocale(raw) ? raw : "vi");
  return {
    title: t.admin.title,
    description: t.admin.subtitle,
    robots: { index: false, follow: false },
  };
}

export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "vi") as Locale;
  const t = getDict(locale);

  return (
    <div data-testid="content-ready" className="animate-fade-in-up">
      <Breadcrumb
        items={[
          { label: t.nav.home, href: `/${locale}` },
          { label: t.nav.admin },
        ]}
      />
      <header className="mb-6">
        <h1 className="text-3xl font-bold">
          <span className="gradient-text">{t.admin.title}</span>
        </h1>
        <p className="mt-2 text-muted">{t.admin.subtitle}</p>
      </header>
      <AdminConsole locale={locale} />
    </div>
  );
}
