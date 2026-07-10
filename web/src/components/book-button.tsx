"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { api, type HotelRoomType } from "@/lib/api";
import { getAccessToken } from "@/lib/auth-storage";
import type { Locale } from "@/lib/i18n";

export function BookButton({
  locale,
  itemType,
  itemId,
  label,
  roomTypes,
}: {
  locale: Locale;
  itemType: "hotel" | "tour" | "flight" | "transport";
  itemId: string;
  label: string;
  /** Optional PMS room types (hotel only). */
  roomTypes?: HotelRoomType[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoPay = process.env.NEXT_PUBLIC_BOOK_AUTOPAY === "true";

  const defaultRt = roomTypes?.[0]?.id ?? "";
  const [roomTypeId, setRoomTypeId] = useState(defaultRt);
  const selectedRt = useMemo(
    () => roomTypes?.find((r) => r.id === roomTypeId) ?? roomTypes?.[0],
    [roomTypes, roomTypeId],
  );
  const defaultRp = selectedRt?.ratePlans?.[0]?.id ?? "";
  const [ratePlanId, setRatePlanId] = useState(defaultRp);
  const selectedRp = useMemo(
    () => selectedRt?.ratePlans?.find((p) => p.id === ratePlanId) ?? selectedRt?.ratePlans?.[0],
    [selectedRt, ratePlanId],
  );

  const showPms = itemType === "hotel" && (roomTypes?.length ?? 0) > 0;

  return (
    <div className="flex w-full max-w-sm flex-col items-end gap-2">
      {showPms ? (
        <div className="w-full space-y-2 rounded-xl border border-border bg-white/80 p-3 text-left text-sm">
          <label className="block text-xs font-medium text-muted">
            {locale === "vi" ? "Loại phòng" : "Room type"}
            <select
              className="mt-1 w-full rounded-lg border border-border bg-card px-2 py-1.5 text-sm"
              value={selectedRt?.id ?? ""}
              onChange={(e) => {
                setRoomTypeId(e.target.value);
                const next = roomTypes?.find((r) => r.id === e.target.value);
                setRatePlanId(next?.ratePlans?.[0]?.id ?? "");
              }}
            >
              {(roomTypes ?? []).map((rt) => (
                <option key={rt.id} value={rt.id}>
                  {locale === "vi" ? rt.nameVi : rt.nameEn} · {rt.basePriceVnd.toLocaleString("vi-VN")}₫
                </option>
              ))}
            </select>
          </label>
          {selectedRt?.ratePlans?.length ? (
            <label className="block text-xs font-medium text-muted">
              {locale === "vi" ? "Gói giá" : "Rate plan"}
              <select
                className="mt-1 w-full rounded-lg border border-border bg-card px-2 py-1.5 text-sm"
                value={selectedRp?.id ?? ""}
                onChange={(e) => setRatePlanId(e.target.value)}
              >
                {selectedRt.ratePlans.map((rp) => (
                  <option key={rp.id} value={rp.id}>
                    {locale === "vi" ? rp.nameVi : rp.nameEn}
                    {rp.breakfastIncluded ? (locale === "vi" ? " · ăn sáng" : " · breakfast") : ""}
                    {!rp.refundable ? (locale === "vi" ? " · không HT" : " · non-ref") : ""}
                    {" · "}
                    {rp.priceVnd.toLocaleString("vi-VN")}₫
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
      ) : null}
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
                ...(showPms && selectedRt
                  ? {
                      roomTypeId: selectedRt.id,
                      ratePlanId: selectedRp?.id,
                    }
                  : {}),
              },
              crypto.randomUUID(),
            );
            if (autoPay) {
              await api.payBooking(token, booking.data.id, "success");
            }
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
      {error ? <span className="max-w-[220px] text-right text-xs text-coral">{error}</span> : null}
    </div>
  );
}
