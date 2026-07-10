import Link from "next/link";
import { getDict, defaultLocale } from "@/lib/i18n";

export default function LocaleNotFound() {
  const t = getDict(defaultLocale);
  return (
    <div className="mx-auto max-w-lg py-16 text-center" data-testid="not-found">
      <h1 className="text-3xl font-bold">
        <span className="gradient-text">404</span>
      </h1>
      <p className="mt-3 text-muted">{t.empty.description}</p>
      <Link
        href={`/${defaultLocale}`}
        className="mt-6 inline-flex rounded-full bg-ocean px-5 py-2.5 text-sm font-semibold text-white"
      >
        {t.empty.cta}
      </Link>
    </div>
  );
}
