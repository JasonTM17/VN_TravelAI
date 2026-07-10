"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { getDict, isLocale } from "@/lib/i18n";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const params = useParams();
  const raw = typeof params?.locale === "string" ? params.locale : "vi";
  const t = getDict(isLocale(raw) ? raw : "vi");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="rounded-2xl border border-coral/30 bg-white p-8 text-center shadow-elevated">
      <h2 className="text-xl font-semibold text-foreground">{t.common.somethingWrong}</h2>
      <p className="mt-2 text-sm text-muted">{error.message}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-full bg-ocean px-5 py-2 text-sm font-medium text-white"
      >
        {t.common.retry}
      </button>
    </div>
  );
}
