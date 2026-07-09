import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import { getDict } from "@/lib/i18n";

export function Footer({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  return (
    <footer className="mt-20 border-t border-border bg-indigo-night text-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3">
        <div>
          <div className="text-lg font-semibold">{t.brand}</div>
          <p className="mt-2 text-sm text-white/70">{t.tagline}</p>
        </div>
        <div className="text-sm text-white/70">
          <div className="font-medium text-white">Product</div>
          <div className="mt-2 flex flex-col gap-1">
            <Link href={`/${locale}/explore`}>{t.nav.explore}</Link>
            <Link href={`/${locale}/ai`}>{t.nav.ai}</Link>
            <Link href={`/${locale}/hotels`}>{t.nav.hotels}</Link>
          </div>
        </div>
        <div className="text-sm text-white/70">
          <div className="font-medium text-white">MVP notes</div>
          <p className="mt-2">
            Mock flights & payments. AI via n8n orchestrator. Images by Grok Imagine.
          </p>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/50">
        © {new Date().getFullYear()} TravelAI · MIT
      </div>
    </footer>
  );
}
