import { Breadcrumb } from "@/components/breadcrumb";
import { WishlistClient } from "@/components/wishlist-client";
import { getDict, isLocale, type Locale } from "@/lib/i18n";

export default async function WishlistPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "vi") as Locale;
  const t = getDict(locale);

  return (
    <div data-testid="content-ready">
      <Breadcrumb items={[{ label: t.nav.home, href: `/${locale}` }, { label: t.nav.wishlist }]} />
      <h1 className="animate-fade-in-up text-3xl font-bold">
        <span className="gradient-text">{t.nav.wishlist}</span>
      </h1>
      <div className="mt-6">
        <WishlistClient locale={locale} />
      </div>
    </div>
  );
}
