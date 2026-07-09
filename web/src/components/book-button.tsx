"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import { getAccessToken } from "@/lib/auth-storage";
import type { Locale } from "@/lib/i18n";

export function BookButton({
  locale,
  itemType,
  itemId,
  label,
}: {
  locale: Locale;
  itemType: "hotel" | "tour" | "flight";
  itemId: string;
  label: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={loading}
        className="rounded-full bg-ocean px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:-translate-y-0.5 disabled:opacity-60"
        onClick={async () => {
          setError(null);
          const token = getAccessToken();
          if (!token) {
            router.push(`/${locale}/login?next=/${locale}/bookings`);
            return;
          }
          setLoading(true);
          try {
            const start = new Date();
            start.setDate(start.getDate() + 7);
            const end = new Date(start);
            end.setDate(end.getDate() + 2);
            const startDate = start.toISOString().slice(0, 10);
            const endDate = end.toISOString().slice(0, 10);
            const booking = await api.createBooking(
              token,
              {
                itemType,
                itemId,
                guests: 2,
                startDate,
                endDate: itemType === "hotel" ? endDate : undefined,
              },
              crypto.randomUUID(),
            );
            await api.payBooking(token, booking.data.id, "success");
            router.push(`/${locale}/bookings`);
          } catch (e) {
            setError(e instanceof Error ? e.message : "Failed");
          } finally {
            setLoading(false);
          }
        }}
      >
        {loading ? "..." : label}
      </button>
      {error ? <span className="max-w-[200px] text-right text-xs text-coral">{error}</span> : null}
    </div>
  );
}
