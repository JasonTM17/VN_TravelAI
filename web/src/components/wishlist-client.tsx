"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, type WishlistItem } from "@/lib/api";
import { getAccessToken } from "@/lib/auth-storage";
import { EmptyState } from "@/components/ui/empty-state";
import { formatVnd } from "@/lib/utils";
import { getDict, type Locale } from "@/lib/i18n";

export function WishlistClient({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      setError("auth");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.listWishlist(token);
      setItems(res.data ?? []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.common.error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // Initial browser-only auth lookup.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <p className="text-sm text-muted">{t.common.loading}</p>;
  if (error === "auth") {
    return (
      <EmptyState
        title={t.nav.login}
        description={t.catalog.wishlistLogin}
        ctaHref={`/${locale}/login`}
        ctaLabel={t.nav.login}
      />
    );
  }
  if (error) {
    return (
      <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        <p>{error}</p>
        <button type="button" className="mt-2 font-semibold underline" onClick={() => void load()}>
          {t.common.retry}
        </button>
      </div>
    );
  }
  if (!items.length) {
    return (
      <EmptyState
        title={t.empty.title}
        description={t.catalog.wishlistEmpty}
        ctaHref={`/${locale}/hotels`}
        ctaLabel={t.nav.hotels}
      />
    );
  }

  return (
    <div className="space-y-3" data-testid="wishlist-list">
      {items.map((item) => {
        const href =
          item.slug && item.itemType === "hotel"
            ? `/${locale}/hotels/${item.slug}`
            : item.slug && item.itemType === "tour"
              ? `/${locale}/tours/${item.slug}`
              : item.slug && item.itemType === "destination"
                ? `/${locale}/destinations/${item.slug}`
                : `/${locale}/hotels`;

        return (
          <div
            key={item.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-elevated"
          >
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-ocean">{item.itemType}</div>
              <Link href={href} className="font-semibold hover:text-ocean">
                {item.title ?? item.itemId}
              </Link>
              {item.priceFromVnd != null ? (
                <div className="mt-1 text-sm text-muted">{formatVnd(item.priceFromVnd)}</div>
              ) : null}
            </div>
            <button
              type="button"
              className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted hover:border-coral hover:text-coral"
              data-testid="wishlist-remove"
              onClick={async () => {
                const token = getAccessToken();
                if (!token) return;
                setError(null);
                try {
                  await api.removeWishlist(token, item.id);
                  setItems((prev) => prev.filter((x) => x.id !== item.id));
                } catch (cause) {
                  setError(cause instanceof Error ? cause.message : t.common.error);
                }
              }}
            >
              {t.common.remove}
            </button>
          </div>
        );
      })}
    </div>
  );
}
