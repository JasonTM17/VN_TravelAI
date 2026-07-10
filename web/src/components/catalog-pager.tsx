import Link from "next/link";

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
  const totalPages = Math.max(1, Math.ceil(total / Math.max(limit, 1)));
  if (totalPages <= 1) {
    return (
      <p className="mt-6 text-center text-sm text-muted" data-testid="catalog-total">
        {total} items
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
      aria-label="Pagination"
      data-testid="catalog-pager"
      data-total={total}
      data-page={page}
    >
      <Link
        href={href(Math.max(1, page - 1))}
        className={`inline-flex min-h-11 items-center rounded-lg border border-border px-3 text-sm ${page <= 1 ? "pointer-events-none opacity-40" : "hover:border-[#0064d2]"}`}
        aria-disabled={page <= 1}
      >
        ←
      </Link>
      <span className="text-sm text-muted">
        {page} / {totalPages} · {total}
      </span>
      <Link
        href={href(Math.min(totalPages, page + 1))}
        className={`inline-flex min-h-11 items-center rounded-lg border border-border px-3 text-sm ${page >= totalPages ? "pointer-events-none opacity-40" : "hover:border-[#0064d2]"}`}
        aria-disabled={page >= totalPages}
      >
        →
      </Link>
    </nav>
  );
}
