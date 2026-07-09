"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Building2, Plane, Map, Search } from "lucide-react";
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
    <div className="mx-auto mt-8 w-full max-w-3xl animate-fade-in-up rounded-2xl bg-white p-3 shadow-float sm:p-4">
      <div className="search-tabs mb-3 flex gap-1 border-b border-border px-1">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            data-active={tab === item.id}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-2.5 text-sm text-muted transition",
              tab === item.id && "text-[#0064d2]",
            )}
            onClick={() => setTab(item.id)}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>

      <form
        className="grid gap-2 sm:grid-cols-[1.4fr_1fr_auto]"
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
        <label className="text-left text-xs font-medium text-muted">
          {locale === "en" ? "Destination / hotel" : "Thành phố, khách sạn, điểm đến"}
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t.home.searchPlaceholder}
            className="input-field mt-1"
            aria-label={t.home.searchPlaceholder}
          />
        </label>
        <label className="text-left text-xs font-medium text-muted">
          {locale === "en" ? "Date" : "Chọn ngày"}
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input-field mt-1"
          />
        </label>
        <button type="submit" className="btn-accent mt-auto h-[46px] self-end px-6">
          <Search className="h-4 w-4" />
          {t.home.searchCta}
        </button>
      </form>
    </div>
  );
}
