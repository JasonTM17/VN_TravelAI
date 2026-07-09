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

  async function load(token: string) {
    const res = await api.listWishlist(token);
    setItems(res.data ?? []);
  }

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      setError("auth");
      return;
    }
    load(token)
      .catch(() => setError("load"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-muted">{t.common.loading}</p>;
  if (error === "auth") {
    return (
      <EmptyState
        title={t.nav.login}
        description={locale === "en" ? "Log in to see your wishlist." : "Đăng nhập để xem danh sách yêu thích."}
        ctaHref={`/${locale}/login`}
        ctaLabel={t.nav.login}
      />
    );
  }
  if (!items.length) {
    return (
      <EmptyState
        title={t.empty.title}
        description={
          locale === "en"
            ? "Save hotels or tours from detail pages."
            : "Lưu khách sạn hoặc tour từ trang chi tiết."
        }
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
                await api.removeWishlist(token, item.id);
                setItems((prev) => prev.filter((x) => x.id !== item.id));
              }}
            >
              {locale === "en" ? "Remove" : "Xóa"}
            </button>
          </div>
        );
      })}
    </div>
  );
}
