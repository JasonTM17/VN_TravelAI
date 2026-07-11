"use client";

import { useState } from "react";
import { api, type Flight } from "@/lib/api";
import { BookButton } from "@/components/book-button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatVnd } from "@/lib/utils";
import { getDict, localeTag, type Locale } from "@/lib/i18n";
import { localDateDaysFromNow } from "@/lib/local-date";

export function FlightSearch({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const [from, setFrom] = useState("HAN");
  const [to, setTo] = useState("SGN");
  const [date, setDate] = useState(() => localDateDaysFromNow(7));
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function searchFlights() {
    setLoading(true);
    setSearched(true);
    setError(null);
    try {
      const res = await api.searchFlights(from.trim(), to.trim(), date);
      setFlights(res.data ?? []);
    } catch (cause) {
      setFlights([]);
      setError(cause instanceof Error ? cause.message : t.common.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <form
        className="grid gap-3 rounded-2xl border border-border bg-card p-4 shadow-elevated md:grid-cols-4"
        onSubmit={async (e) => {
          e.preventDefault();
          void searchFlights();
        }}
      >
        <label className="text-sm">
          {t.common.flightFrom}
          <input className="mt-1 w-full rounded-xl border border-border px-3 py-2 uppercase" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label className="text-sm">
          {t.common.flightTo}
          <input className="mt-1 w-full rounded-xl border border-border px-3 py-2 uppercase" value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
        <label className="text-sm">
          {t.common.flightDate}
          <input type="date" className="mt-1 w-full rounded-xl border border-border px-3 py-2" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <button type="submit" className="self-end rounded-xl bg-ocean py-2.5 font-medium text-white shadow-glow">
          {loading ? t.common.loading : t.home.searchCta}
        </button>
      </form>

      <div className="mt-6 space-y-3">
        {error ? (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <p>{error}</p>
            <button type="button" className="mt-2 font-semibold underline" onClick={() => void searchFlights()}>
              {t.common.retry}
            </button>
          </div>
        ) : null}
        {searched && !loading && !error && flights.length === 0 ? (
          <EmptyState title={t.empty.title} description={t.empty.description} />
        ) : null}
        {flights.map((f) => (
          <div key={f.id + f.departAt} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-white p-4 shadow-elevated">
            <div>
              <div className="font-semibold">
                {f.airline} · {f.flightNumber}
              </div>
              <div className="text-sm text-muted">
                {f.from} → {f.to} · {new Date(f.departAt).toLocaleString(localeTag(locale))} · {f.cabin}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="font-semibold text-ocean">{formatVnd(f.priceVnd)}</div>
              <BookButton locale={locale} itemType="flight" itemId={f.id} label={t.common.book} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
