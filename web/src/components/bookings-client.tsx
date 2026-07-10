"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, type Booking } from "@/lib/api";
import { getAccessToken } from "@/lib/auth-storage";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatVnd } from "@/lib/utils";
import { getDict, type Locale } from "@/lib/i18n";

export function BookingsClient({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);

  async function reload(token: string) {
    const res = await api.listBookings(token);
    setBookings(res.data ?? []);
  }

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      setError("auth");
      return;
    }
    reload(token)
      .catch(() => setError("load"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-muted">{t.common.loading}</p>;
  if (error === "auth") {
    return (
      <EmptyState
        title={t.nav.login}
        description={t.booking.empty}
        ctaHref={`/${locale}/login`}
        ctaLabel={t.nav.login}
      />
    );
  }
  if (!bookings.length) {
    return (
      <EmptyState
        title={t.booking.empty}
        description={t.empty.description}
        ctaHref={`/${locale}/hotels`}
        ctaLabel={t.nav.hotels}
      />
    );
  }

  return (
    <div className="space-y-3">
      {bookings.map((b) => {
        const payable = b.status === "pending_payment" || b.status === "draft";
        return (
          <div
            key={b.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-elevated"
          >
            <div>
              <div className="font-medium capitalize">
                {b.itemType} ·{" "}
                {String(
                  (b.itemSnapshot as { name?: string; title?: string; flightNumber?: string })?.name ??
                    (b.itemSnapshot as { title?: string })?.title ??
                    (b.itemSnapshot as { flightNumber?: string })?.flightNumber ??
                    b.itemId.slice(0, 8),
                )}
              </div>
              <div className="text-sm text-muted">
                {b.startDate?.toString?.().slice?.(0, 10) ?? b.startDate} · {b.guests} guests
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={b.status} />
              <div className="font-semibold text-ocean">{formatVnd(b.totalVnd)}</div>
              {payable ? (
                <button
                  type="button"
                  disabled={payingId === b.id}
                  className="rounded-full bg-coral px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
                  onClick={async () => {
                    const token = getAccessToken();
                    if (!token) return;
                    setPayingId(b.id);
                    try {
                      await api.payBooking(token, b.id, "success");
                      await reload(token);
                    } catch {
                      /* keep list */
                    } finally {
                      setPayingId(null);
                    }
                  }}
                >
                  {payingId === b.id ? t.common.loading : t.booking.pay}
                </button>
              ) : null}
            </div>
          </div>
        );
      })}
      <Link href={`/${locale}/hotels`} className="inline-block text-sm text-ocean hover:underline">
        {t.nav.hotels}
      </Link>
    </div>
  );
}
