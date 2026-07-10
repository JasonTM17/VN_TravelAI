import { Breadcrumb } from "@/components/breadcrumb";
import { ChangePasswordForm } from "@/components/change-password-form";
import { getDict, isLocale, type Locale } from "@/lib/i18n";

export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "vi") as Locale;
  const t = getDict(locale);

  return (
    <div data-testid="content-ready" className="mx-auto max-w-md animate-fade-in-up">
      <Breadcrumb
        items={[
          { label: t.nav.home, href: `/${locale}` },
          { label: t.auth.account },
        ]}
      />
      <h1 className="text-3xl font-bold">
        <span className="gradient-text">{t.auth.accountTitle}</span>
      </h1>
      <p className="mt-2 text-sm text-muted">
        {locale === "en"
          ? "Manage security settings for your TravelAI account."
          : "Quản lý bảo mật tài khoản TravelAI của bạn."}
      </p>
      <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-elevated">
        <ChangePasswordForm locale={locale} />
      </div>
    </div>
  );
}
