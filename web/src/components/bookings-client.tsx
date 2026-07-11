"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, type Booking } from "@/lib/api";
import { getAccessToken } from "@/lib/auth-storage";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatVnd } from "@/lib/utils";
import { getDict, localeTag, type Locale } from "@/lib/i18n";

export function BookingsClient({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [paymentErrorId, setPaymentErrorId] = useState<string | null>(null);

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
  if (error === "load") {
    return (
      <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        <p>{t.common.error}</p>
        <button
          type="button"
          className="mt-3 rounded-lg border border-red-300 px-3 py-2 font-semibold hover:bg-red-100"
          onClick={() => {
            const token = getAccessToken();
            if (!token) return;
            setLoading(true);
            setError(null);
            void reload(token).catch(() => setError("load")).finally(() => setLoading(false));
          }}
        >
          {t.common.retry}
        </button>
      </div>
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
                {new Intl.DateTimeFormat(localeTag(locale), { dateStyle: "medium" }).format(new Date(b.startDate))} · {b.guests} {locale === "vi" ? "khách" : b.guests === 1 ? "guest" : "guests"}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={b.status} />
              <div className="font-semibold text-ocean">{formatVnd(b.totalVnd, localeTag(locale))}</div>
              {payable ? (
                <button
                  type="button"
                  disabled={payingId === b.id}
                  className="rounded-full bg-coral px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
                  onClick={async () => {
                    const token = getAccessToken();
                    if (!token) return;
                    setPayingId(b.id);
                    setPaymentErrorId(null);
                    try {
                      await api.payBooking(token, b.id, "success");
                      await reload(token);
                    } catch {
                      setPaymentErrorId(b.id);
                    } finally {
                      setPayingId(null);
                    }
                  }}
                >
                  {payingId === b.id ? t.common.loading : t.booking.pay}
                </button>
              ) : null}
              {paymentErrorId === b.id ? (
                <p role="alert" className="basis-full text-right text-xs text-red-700">
                  {t.common.error}. {t.common.retry}.
                </p>
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
