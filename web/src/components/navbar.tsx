"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { getDict, type Locale } from "@/lib/i18n";
import { clearSession, getAccessToken } from "@/lib/auth-storage";
import { cn } from "@/lib/utils";

export function Navbar({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    setAuthed(Boolean(getAccessToken()));
  }, [pathname]);

  // Stitch WanderViet / Traveloka nav order
  const links = [
    { href: `/${locale}/hotels`, label: t.nav.hotels },
    { href: `/${locale}/flights`, label: t.nav.flights },
    { href: `/${locale}/tours`, label: t.nav.tours },
    { href: `/${locale}/transport`, label: t.nav.transport },
  ];

  const other = locale === "vi" ? "en" : "vi";
  const switched = pathname?.replace(`/${locale}`, `/${other}`) || `/${other}`;

  return (
    <header className="sticky top-0 z-50 bg-[#0064d2] text-white shadow-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 md:h-[60px] md:px-8">
        <div className="flex items-center gap-8">
          <Link
            href={`/${locale}`}
            className="text-xl font-black italic tracking-tight text-white md:text-2xl"
          >
            {t.brand}
          </Link>
          <nav className="hidden items-center gap-6 lg:flex">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "text-sm font-medium text-white/90 transition hover:text-white",
                  pathname?.startsWith(l.href) && "font-semibold text-white",
                )}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href={switched}
            className="rounded-md px-2 py-1 text-xs font-semibold uppercase text-white/90 hover:bg-white/10"
          >
            {other}
          </Link>
          {authed ? (
            <>
              <Link href={`/${locale}/wishlist`} className="text-sm text-white/90 hover:text-white">
                {t.nav.wishlist}
              </Link>
              <Link href={`/${locale}/bookings`} className="text-sm text-white/90 hover:text-white">
                {t.nav.bookings}
              </Link>
              <button
                type="button"
                className="rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-[#0064d2]"
                onClick={() => {
                  clearSession();
                  setAuthed(false);
                  router.push(`/${locale}`);
                }}
              >
                {t.nav.logout}
              </button>
            </>
          ) : (
            <>
              <Link href={`/${locale}/login`} className="text-sm font-medium text-white hover:underline">
                {t.nav.login}
              </Link>
              <Link
                href={`/${locale}/register`}
                className="rounded-lg bg-[#ff6d00] px-4 py-1.5 text-sm font-bold text-white shadow-sm hover:bg-[#e65100]"
              >
                {t.nav.register}
              </Link>
            </>
          )}
        </div>

        <button type="button" className="md:hidden" aria-label="Menu" onClick={() => setOpen((v) => !v)}>
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-white/15 bg-[#0057b8] px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {links.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-md px-2 py-2 text-sm">
                {l.label}
              </Link>
            ))}
            <Link href={`/${locale}/ai`} onClick={() => setOpen(false)} className="rounded-md px-2 py-2 text-sm">
              {t.nav.ai}
            </Link>
            <Link href={switched} className="rounded-md px-2 py-2 text-sm uppercase">
              {other}
            </Link>
            {!authed ? (
              <>
                <Link href={`/${locale}/login`} className="rounded-md px-2 py-2 text-sm">
                  {t.nav.login}
                </Link>
                <Link href={`/${locale}/register`} className="rounded-md px-2 py-2 text-sm font-semibold text-[#ffb380]">
                  {t.nav.register}
                </Link>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </header>
  );
}
