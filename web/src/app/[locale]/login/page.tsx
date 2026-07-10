import { Suspense } from "react";
import { Breadcrumb } from "@/components/breadcrumb";
import { AuthForm } from "@/components/auth-form";
import { getDict, isLocale, type Locale } from "@/lib/i18n";

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "vi") as Locale;
  const t = getDict(locale);

  return (
    <div data-testid="content-ready" className="mx-auto max-w-md">
      <Breadcrumb items={[{ label: t.nav.home, href: `/${locale}` }, { label: t.nav.login }]} />
      <h1 className="animate-fade-in-up text-3xl font-bold">
        <span className="gradient-text">{t.auth.loginTitle}</span>
      </h1>
      <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-elevated">
        <Suspense fallback={<div className="text-sm text-muted">...</div>}>
          <AuthForm locale={locale} mode="login" />
        </Suspense>
      </div>
    </div>
  );
}
