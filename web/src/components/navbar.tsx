"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, Sparkles } from "lucide-react";
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
    { href: `/${locale}/explore`, label: t.nav.explore },
    { href: `/${locale}/hotels`, label: t.nav.hotels },
    { href: `/${locale}/flights`, label: t.nav.flights },
    { href: `/${locale}/tours`, label: t.nav.tours },
    { href: `/${locale}/ai`, label: t.nav.ai },
  ];

  const other = locale === "vi" ? "en" : "vi";
  const switched = pathname?.replace(`/${locale}`, `/${other}`) || `/${other}`;

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href={`/${locale}`} className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ocean text-white shadow-glow">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="gradient-text text-lg">{t.brand}</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm text-muted transition hover:bg-ocean/10 hover:text-ocean",
                pathname === l.href && "bg-ocean/10 font-medium text-ocean",
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            href={switched}
            className="rounded-full border border-border px-3 py-1.5 text-xs font-medium uppercase text-muted hover:border-ocean hover:text-ocean"
          >
            {other}
          </Link>
          {authed ? (
            <>
              <Link href={`/${locale}/bookings`} className="text-sm text-muted hover:text-ocean">
                {t.nav.bookings}
              </Link>
              <button
                type="button"
                className="rounded-full bg-indigo-night px-4 py-1.5 text-sm text-white"
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
              <Link href={`/${locale}/login`} className="text-sm text-muted hover:text-ocean">
                {t.nav.login}
              </Link>
              <Link
                href={`/${locale}/register`}
                className="rounded-full bg-ocean px-4 py-1.5 text-sm font-medium text-white shadow-glow"
              >
                {t.nav.register}
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="md:hidden"
          aria-label="Menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-border bg-white px-4 py-3 md:hidden">
          <div className="flex flex-col gap-2">
            {links.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="py-2 text-sm">
                {l.label}
              </Link>
            ))}
            <Link href={switched} className="py-2 text-sm uppercase">
              {other}
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
