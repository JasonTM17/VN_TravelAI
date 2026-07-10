"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import { getAccessToken } from "@/lib/auth-storage";
import type { Locale } from "@/lib/i18n";
import { getDict } from "@/lib/i18n";

export function ReviewForm({
  locale,
  hotelId,
  tourId,
}: {
  locale: Locale;
  hotelId?: string;
  tourId?: string;
}) {
  const t = getDict(locale);
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  return (
    <form
      data-testid="review-form"
      className="mt-4 space-y-3 rounded-xl border border-border bg-white p-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
        setOk(false);
        const token = getAccessToken();
        if (!token) {
          router.push(`/${locale}/login?next=${encodeURIComponent(window.location.pathname)}`);
          return;
        }
        setLoading(true);
        try {
          await api.createReview(token, {
            hotelId,
            tourId,
            rating,
            body: body.trim(),
          });
          setOk(true);
          setBody("");
          router.refresh();
        } catch (err) {
          setError(err instanceof Error ? err.message : t.common.error);
        } finally {
          setLoading(false);
        }
      }}
    >
      <h3 className="text-sm font-semibold">{t.review.write}</h3>
      <label className="block text-xs text-muted">
        {t.review.rating}
        <select
          data-testid="review-rating"
          className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
          value={rating}
          onChange={(ev) => setRating(Number(ev.target.value))}
        >
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n} ★
            </option>
          ))}
        </select>
      </label>
      <label className="block text-xs text-muted">
        {t.review.body}
        <textarea
          data-testid="review-body"
          className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
          rows={3}
          value={body}
          onChange={(ev) => setBody(ev.target.value)}
          required
          minLength={3}
          maxLength={4000}
        />
      </label>
      {error ? <p className="text-xs text-coral">{error}</p> : null}
      {ok ? (
        <p data-testid="review-ok" className="text-xs text-ocean">
          {t.review.thanks}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={loading}
        className="rounded-full bg-ocean px-4 py-2 text-sm font-semibold text-white shadow-glow disabled:opacity-60"
      >
        {loading ? "..." : t.review.submit}
      </button>
    </form>
  );
}
