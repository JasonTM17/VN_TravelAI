"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, Plane } from "lucide-react";
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

  const links = [
    { href: `/${locale}`, label: t.nav.home },
    { href: `/${locale}/hotels`, label: t.nav.hotels },
    { href: `/${locale}/flights`, label: t.nav.flights },
    { href: `/${locale}/tours`, label: t.nav.tours },
    { href: `/${locale}/transport`, label: locale === "en" ? "Transport" : "Combo" },
    { href: `/${locale}/ai`, label: t.nav.ai },
  ];

  const other = locale === "vi" ? "en" : "vi";
  const switched = pathname?.replace(`/${locale}`, `/${other}`) || `/${other}`;

  return (
    <header className="nav-blue sticky top-0 z-50 text-white shadow-md">
      <div className="mx-auto flex h-[60px] max-w-6xl items-center justify-between gap-4 px-4">
        <Link href={`/${locale}`} className="flex items-center gap-2 font-bold tracking-tight">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/25">
            <Plane className="h-4 w-4" />
          </span>
          <span className="text-lg">{t.brand}</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm text-white/90 transition hover:bg-white/10 hover:text-white",
                pathname === l.href && "bg-white/15 font-semibold text-white",
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            href={switched}
            className="rounded-md border border-white/30 px-2.5 py-1 text-xs font-semibold uppercase text-white/90 hover:bg-white/10"
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
                className="rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-[#0064d2]"
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
              <Link href={`/${locale}/login`} className="text-sm font-medium text-white/95 hover:text-white">
                {t.nav.login}
              </Link>
              <Link
                href={`/${locale}/register`}
                className="rounded-md bg-[#ff6d00] px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-[#e65100]"
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
            <Link href={switched} className="rounded-md px-2 py-2 text-sm uppercase">
              {other}
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
