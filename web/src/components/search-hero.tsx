"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import type { Dictionary, Locale } from "@/lib/i18n";

export function SearchHero({ locale, t }: { locale: Locale; t: Dictionary }) {
  const router = useRouter();
  const [q, setQ] = useState("");

  return (
    <form
      className="mx-auto mt-8 flex w-full max-w-2xl overflow-hidden rounded-2xl border border-white/30 bg-white/95 shadow-glow backdrop-blur"
      onSubmit={(e) => {
        e.preventDefault();
        router.push(`/${locale}/search?q=${encodeURIComponent(q.trim())}`);
      }}
    >
      <div className="flex flex-1 items-center gap-2 px-4">
        <Search className="h-5 w-5 text-ocean" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t.home.searchPlaceholder}
          className="w-full bg-transparent py-4 text-sm outline-none placeholder:text-muted"
          aria-label={t.home.searchPlaceholder}
        />
      </div>
      <button
        type="submit"
        className="bg-ocean px-6 text-sm font-semibold text-white transition hover:bg-teal-700"
      >
        {t.home.searchCta}
      </button>
    </form>
  );
}
