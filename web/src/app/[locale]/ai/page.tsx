import type { Metadata } from "next";
import Image from "next/image";
import { Breadcrumb } from "@/components/breadcrumb";
import { AiPlanner } from "@/components/ai-planner";
import { getDict, isLocale, type Locale } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const t = getDict(isLocale(raw) ? raw : "vi");
  return { title: t.ai.title, description: t.ai.subtitle };
}

export default async function AiPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "vi") as Locale;
  const t = getDict(locale);

  return (
    <div data-testid="content-ready">
      <Breadcrumb items={[{ label: t.nav.home, href: `/${locale}` }, { label: t.nav.ai }]} />
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <h1 className="animate-fade-in-up text-3xl font-bold">
            <span className="gradient-text">{t.ai.title}</span>
          </h1>
          <p className="mt-2 text-muted">{t.ai.subtitle}</p>
          <div className="mt-6">
            <AiPlanner locale={locale} />
          </div>
        </div>
        <div className="relative hidden min-h-[320px] overflow-hidden rounded-3xl border border-border shadow-elevated lg:block">
          <Image src="/images/brand/ai-planner.jpg" alt="AI planner" fill className="object-cover" />
        </div>
      </div>
    </div>
  );
}
