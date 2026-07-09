"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="rounded-2xl border border-coral/30 bg-white p-8 text-center shadow-elevated">
      <h2 className="text-xl font-semibold text-foreground">Something went wrong</h2>
      <p className="mt-2 text-sm text-muted">{error.message}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-full bg-ocean px-5 py-2 text-sm font-medium text-white"
      >
        Retry
      </button>
    </div>
  );
}
