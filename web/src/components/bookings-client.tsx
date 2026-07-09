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

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      setError("auth");
      return;
    }
    api
      .listBookings(token)
      .then((res) => setBookings(res.data ?? []))
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
      {bookings.map((b) => (
        <div key={b.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-elevated">
          <div>
            <div className="font-medium capitalize">
              {b.itemType} · {String((b.itemSnapshot as { name?: string; title?: string; flightNumber?: string })?.name ??
                (b.itemSnapshot as { title?: string })?.title ??
                (b.itemSnapshot as { flightNumber?: string })?.flightNumber ??
                b.itemId.slice(0, 8))}
            </div>
            <div className="text-sm text-muted">
              {b.startDate?.toString?.().slice?.(0, 10) ?? b.startDate} · {b.guests} guests
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={b.status} />
            <div className="font-semibold text-ocean">{formatVnd(b.totalVnd)}</div>
          </div>
        </div>
      ))}
      <Link href={`/${locale}/hotels`} className="inline-block text-sm text-ocean hover:underline">
        {t.nav.hotels}
      </Link>
    </div>
  );
}
