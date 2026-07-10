"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Building2, Plane, Map, Search, MapPin, CalendarDays } from "lucide-react";
import type { Dictionary, Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Tab = "hotel" | "flight" | "tour";

export function SearchHero({ locale, t }: { locale: Locale; t: Dictionary }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("hotel");
  const [q, setQ] = useState("");
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  });

  const tabs: Array<{ id: Tab; label: string; icon: ReactNode }> = [
    { id: "hotel", label: t.nav.hotels, icon: <Building2 className="h-4 w-4" /> },
    { id: "flight", label: t.nav.flights, icon: <Plane className="h-4 w-4" /> },
    { id: "tour", label: t.nav.tours, icon: <Map className="h-4 w-4" /> },
  ];

  return (
    <div className="mx-auto w-full max-w-4xl animate-fade-in-up rounded-2xl bg-white p-3 shadow-float sm:p-5">
      <div className="search-tabs mb-4 flex gap-0 overflow-x-auto border-b border-border">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            data-active={tab === item.id}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 px-4 py-3 text-sm text-muted transition",
              tab === item.id && "border-b-2 border-[#0064d2] font-semibold text-[#0064d2]",
            )}
            onClick={() => setTab(item.id)}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>

      <form
        className="grid gap-3 md:grid-cols-4 md:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          const query = q.trim();
          if (tab === "hotel") {
            router.push(`/${locale}/hotels${query ? `?q=${encodeURIComponent(query)}` : ""}`);
          } else if (tab === "tour") {
            router.push(`/${locale}/tours${query ? `?q=${encodeURIComponent(query)}` : ""}`);
          } else {
            router.push(`/${locale}/flights`);
          }
        }}
      >
        <label className="text-left md:col-span-2">
          <span className="mb-1 block text-sm font-semibold text-[#1a1a1a]">{t.home.searchDestLabel}</span>
          <span className="relative block">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t.home.searchPlaceholder}
              className="input-field pl-10"
              aria-label={t.home.searchPlaceholder}
            />
          </span>
        </label>
        <label className="text-left">
          <span className="mb-1 block text-sm font-semibold text-[#1a1a1a]">{t.home.searchDateLabel}</span>
          <span className="relative block">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input-field pl-10"
            />
          </span>
        </label>
        <button type="submit" className="btn-accent h-[46px] w-full px-6">
          <Search className="h-4 w-4" />
          {t.home.searchCta}
        </button>
      </form>
    </div>
  );
}
