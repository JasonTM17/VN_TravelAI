import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ChatbotWidget } from "@/components/chatbot-widget";
import { LocaleHtmlLang } from "@/components/locale-html-lang";
import { getDict, isLocale, locales, type Locale } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "vi") as Locale;
  const t = getDict(locale);
  const languages = Object.fromEntries(locales.map((l) => [l, `/${l}`]));

  return {
    title: {
      default: t.meta.titleDefault,
      template: "%s · TravelAI",
    },
    description: t.meta.description,
    openGraph: {
      title: t.brand,
      description: t.meta.ogDescription,
      locale: locale === "en" ? "en_US" : "vi_VN",
      images: ["/images/brand/og.jpg"],
    },
    alternates: {
      languages,
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-[#f5f5f5]">
      {/* Set <html lang> before paint; LocaleHtmlLang keeps it in sync after client nav. */}
      <script
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.lang=${JSON.stringify(locale)}`,
        }}
      />
      <LocaleHtmlLang locale={locale} />
      <Navbar locale={locale} />
      <main className="mx-auto w-full max-w-7xl flex-1 overflow-x-hidden px-4 py-8 md:px-8">{children}</main>
      <Footer locale={locale} />
      <ChatbotWidget locale={locale} />
    </div>
  );
}
