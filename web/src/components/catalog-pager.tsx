import Link from "next/link";
import { getDict, isLocale, type Locale } from "@/lib/i18n";

type Props = {
  locale: string;
  basePath: string;
  page: number;
  limit: number;
  total: number;
  query?: Record<string, string | undefined>;
};

/** Server-side pagination controls driven by API meta.total. */
export function CatalogPager({ locale, basePath, page, limit, total, query = {} }: Props) {
  const loc = (isLocale(locale) ? locale : "vi") as Locale;
  const t = getDict(loc);
  const totalPages = Math.max(1, Math.ceil(total / Math.max(limit, 1)));
  if (totalPages <= 1) {
    return (
      <p className="mt-6 text-center text-sm text-muted" data-testid="catalog-total">
        {total} {t.common.items}
      </p>
    );
  }

  function href(p: number) {
    const qs = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => {
      if (v) qs.set(k, v);
    });
    qs.set("page", String(p));
    qs.set("limit", String(limit));
    return `/${locale}${basePath}?${qs.toString()}`;
  }

  return (
    <nav
      className="mt-8 flex flex-wrap items-center justify-center gap-2"
      aria-label={t.common.pagination}
      data-testid="catalog-pager"
      data-total={total}
      data-page={page}
    >
      {page <= 1 ? (
        <span aria-disabled="true" className="inline-flex min-h-11 items-center rounded-lg border border-border px-3 text-sm opacity-40">← {t.common.prev}</span>
      ) : (
        <Link href={href(page - 1)} className="inline-flex min-h-11 items-center rounded-lg border border-border px-3 text-sm hover:border-[#0064d2]" aria-label={t.common.prev}>← {t.common.prev}</Link>
      )}
      <span className="text-sm text-muted">
        {t.common.page} {page} / {totalPages} · {total} {t.common.items}
      </span>
      {page >= totalPages ? (
        <span aria-disabled="true" className="inline-flex min-h-11 items-center rounded-lg border border-border px-3 text-sm opacity-40">{t.common.next} →</span>
      ) : (
        <Link href={href(page + 1)} className="inline-flex min-h-11 items-center rounded-lg border border-border px-3 text-sm hover:border-[#0064d2]" aria-label={t.common.next}>{t.common.next} →</Link>
      )}
    </nav>
  );
}
