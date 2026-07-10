import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import { getDict } from "@/lib/i18n";

export function Footer({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  return (
    <footer className="mt-16 border-t border-white/10 bg-[#0b1f3a] text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-3 md:px-8">
        <div>
          <div className="text-xl font-black italic tracking-tight">{t.brand}</div>
          <p className="mt-2 max-w-sm text-sm text-white/70">{t.tagline}</p>
          <p className="mt-3 text-xs text-white/45">
            © {new Date().getFullYear()} {t.brand}. {t.footer.credit}
          </p>
        </div>
        <div className="text-sm text-white/75">
          <div className="font-semibold text-white">{t.footer.about}</div>
          <div className="mt-2 flex flex-col gap-1.5">
            <Link href={`/${locale}/explore`} className="hover:text-white">
              {t.nav.explore}
            </Link>
            <Link href={`/${locale}/hotels`} className="hover:text-white">
              {t.nav.hotels}
            </Link>
            <Link href={`/${locale}/flights`} className="hover:text-white">
              {t.nav.flights}
            </Link>
            <Link href={`/${locale}/ai`} className="hover:text-white">
              {t.nav.ai}
            </Link>
          </div>
        </div>
        <div className="text-sm text-white/75">
          <div className="font-semibold text-white">{t.footer.support}</div>
          <div className="mt-2 flex flex-col gap-1.5">
            <Link href={`/${locale}/bookings`} className="hover:text-white">
              {t.footer.bookingGuide}
            </Link>
            <Link href={`/${locale}/wishlist`} className="hover:text-white">
              {t.nav.wishlist}
            </Link>
            <Link href={`/${locale}/account`} className="hover:text-white">
              {t.auth.account}
            </Link>
            <span>{t.footer.privacy}</span>
            <span>{t.footer.terms}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
