"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Heart } from "lucide-react";
import { api } from "@/lib/api";
import { getAccessToken } from "@/lib/auth-storage";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function WishlistButton({
  locale,
  itemType,
  itemId,
  label = "Wishlist",
}: {
  locale: Locale;
  itemType: "hotel" | "tour" | "destination";
  itemId: string;
  label?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={loading || saved}
        data-testid="wishlist-add"
        className={cn(
          "inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition",
          saved
            ? "border-coral/40 bg-coral/10 text-coral"
            : "border-border bg-white text-foreground hover:border-ocean hover:text-ocean",
        )}
        onClick={async () => {
          setError(null);
          const token = getAccessToken();
          if (!token) {
            router.push(`/${locale}/login?next=/${locale}/wishlist`);
            return;
          }
          setLoading(true);
          try {
            await api.addWishlist(token, { itemType, itemId });
            setSaved(true);
          } catch (e) {
            setError(e instanceof Error ? e.message : "Failed");
          } finally {
            setLoading(false);
          }
        }}
      >
        <Heart className={cn("h-4 w-4", saved && "fill-current")} />
        {loading ? "..." : saved ? "Saved" : label}
      </button>
      {error ? <span className="max-w-[200px] text-right text-xs text-coral">{error}</span> : null}
    </div>
  );
}
