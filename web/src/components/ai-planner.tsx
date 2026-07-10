"use client";

import { useState } from "react";
import Link from "next/link";
import { api, type Itinerary } from "@/lib/api";
import { getAccessToken } from "@/lib/auth-storage";
import { getDict, tFormat, type Locale } from "@/lib/i18n";
import { formatVnd } from "@/lib/utils";

export function AiPlanner({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const [message, setMessage] = useState(
    locale === "vi"
      ? "3 ngày Hội An budget 5 triệu cho couple"
      : "3 days Hoi An budget 5 million VND for a couple",
  );
  const [destination, setDestination] = useState("Hội An");
  const [days, setDays] = useState(3);
  const [budget, setBudget] = useState(5_000_000);
  const [chatLog, setChatLog] = useState<Array<{ role: "user" | "ai"; text: string; degraded?: boolean }>>([]);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function ensureToken() {
    const token = getAccessToken();
    if (!token) {
      setError("auth");
      return null;
    }
    return token;
  }

  return (
    <div className="space-y-6">
      {error === "auth" ? (
        <div className="rounded-xl border border-coral/30 bg-coral/5 p-3 text-sm">
          <Link href={`/${locale}/login`} className="font-medium text-ocean underline">
            {t.nav.login}
          </Link>{" "}
          to use AI Concierge.
        </div>
      ) : null}

      <div className="rounded-2xl border border-border bg-card p-4 shadow-elevated">
        <div className="mb-3 max-h-64 space-y-2 overflow-y-auto">
          {chatLog.length === 0 ? (
            <p className="text-sm text-muted">{t.ai.placeholder}</p>
          ) : (
            chatLog.map((m, i) => (
              <div
                key={i}
                className={`rounded-xl px-3 py-2 text-sm ${m.role === "user" ? "ml-8 bg-ocean/10" : "mr-8 bg-border/40"}`}
              >
                {m.text}
                {m.degraded ? (
                  <div className="mt-1 text-xs text-coral">{t.ai.degraded}</div>
                ) : null}
              </div>
            ))
          )}
        </div>
        <form
          className="flex gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            const token = await ensureToken();
            if (!token) return;
            setLoading(true);
            setError(null);
            setChatLog((prev) => [...prev, { role: "user", text: message }]);
            try {
              const res = await api.chat(token, message);
              setChatLog((prev) => [
                ...prev,
                { role: "ai", text: res.data.reply, degraded: res.data.degraded },
              ]);
            } catch (err) {
              setError(err instanceof Error ? err.message : "chat failed");
            } finally {
              setLoading(false);
            }
          }}
        >
          <input
            className="flex-1 rounded-xl border border-border px-3 py-2 text-sm"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t.ai.placeholder}
          />
          <button type="submit" disabled={loading} className="rounded-xl bg-indigo-night px-4 py-2 text-sm text-white">
            {t.ai.chat}
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 shadow-elevated">
        <h2 className="font-semibold">{t.ai.generate}</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <label className="text-sm sm:col-span-1">
            {t.ai.destination}
            <input className="mt-1 w-full rounded-xl border border-border px-3 py-2" value={destination} onChange={(e) => setDestination(e.target.value)} />
          </label>
          <label className="text-sm">
            {t.ai.days}
            <input type="number" min={1} max={21} className="mt-1 w-full rounded-xl border border-border px-3 py-2" value={days} onChange={(e) => setDays(Number(e.target.value))} />
          </label>
          <label className="text-sm">
            {t.ai.budget}
            <input type="number" className="mt-1 w-full rounded-xl border border-border px-3 py-2" value={budget} onChange={(e) => setBudget(Number(e.target.value))} />
          </label>
        </div>
        <button
          type="button"
          disabled={loading}
          className="mt-4 rounded-full bg-coral px-5 py-2.5 text-sm font-semibold text-white shadow-glow"
          onClick={async () => {
            const token = await ensureToken();
            if (!token) return;
            setLoading(true);
            setError(null);
            try {
              const res = await api.createItinerary(token, {
                destination,
                days,
                budgetVnd: budget,
                style: "couple",
                travelers: 2,
              });
              setItinerary(res.data);
            } catch (err) {
              setError(err instanceof Error ? err.message : "itinerary failed");
            } finally {
              setLoading(false);
            }
          }}
        >
          {loading ? t.common.loading : t.ai.generate}
        </button>
      </div>

      {itinerary ? (
        <div className="rounded-2xl border border-border bg-white p-5 shadow-elevated" data-testid="itinerary-board">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-xl font-semibold">{itinerary.destination}</h3>
            <div className="text-sm text-ocean font-medium">
              {formatVnd(itinerary.estimatedBudgetVnd)}
              {itinerary.degraded ? (
                <span className="ml-2 text-xs text-coral">({t.ai.degraded})</span>
              ) : null}
            </div>
          </div>
          <ol className="mt-4 space-y-4">
            {itinerary.days?.map((d) => (
              <li key={d.day} className="rounded-xl border border-border/80 bg-background p-4">
                <div className="font-semibold text-ocean">
                  {tFormat(t.common.dayLabel, { n: d.day })} — {d.title}
                </div>
                <ul className="mt-2 space-y-2 text-sm">
                  {d.activities?.map((a, idx) => (
                    <li key={idx} className="flex gap-3">
                      <span className="w-12 shrink-0 font-medium text-muted">{a.time}</span>
                      <span>
                        <span className="font-medium">{a.title}</span>
                        <span className="block text-muted">{a.description}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
          {itinerary.hotelSuggestions?.length ? (
            <div className="mt-4">
              <div className="text-sm font-medium">{t.common.hotelSuggestions}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {itinerary.hotelSuggestions.map((h) => (
                  <Link
                    key={h.slug}
                    href={`/${locale}/hotels/${h.slug}`}
                    className="rounded-full bg-ocean/10 px-3 py-1 text-xs font-medium text-ocean hover:bg-ocean/20"
                  >
                    {h.name}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {error && error !== "auth" ? <p className="text-sm text-coral">{error}</p> : null}
    </div>
  );
}
