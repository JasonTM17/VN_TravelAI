"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { getDict, type Locale } from "@/lib/i18n";
import { api } from "@/lib/api";
import { clearSession, getAccessToken, getRefreshToken } from "@/lib/auth-storage";
import { isAdminRole, readJwtRole } from "@/lib/jwt-role";
import { cn } from "@/lib/utils";

export function Navbar({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [admin, setAdmin] = useState(false);

  useEffect(() => {
    const token = getAccessToken();
    setAuthed(Boolean(token));
    setAdmin(isAdminRole(readJwtRole(token)));
  }, [pathname]);

  const links = [
    { href: `/${locale}/hotels`, label: t.nav.hotels },
    { href: `/${locale}/flights`, label: t.nav.flights },
    { href: `/${locale}/tours`, label: t.nav.tours },
    { href: `/${locale}/transport`, label: t.nav.transport },
    { href: `/${locale}/explore`, label: t.nav.explore },
    { href: `/${locale}/ai`, label: t.nav.ai },
  ];

  const other = locale === "vi" ? "en" : "vi";
  const switched = pathname?.replace(`/${locale}`, `/${other}`) || `/${other}`;

  const linkClass = (href: string) =>
    cn(
      "inline-flex min-h-11 items-center rounded-md px-2 text-sm font-medium text-white/90 transition hover:bg-white/10 hover:text-white",
      pathname?.startsWith(href) && "font-semibold text-white",
    );

  return (
    <header className="sticky top-0 z-50 bg-[#0064d2] text-white shadow-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 md:h-[60px] md:px-8">
        <div className="flex min-w-0 items-center gap-6">
          <Link
            href={`/${locale}`}
            className="shrink-0 text-xl font-black italic tracking-tight text-white md:text-2xl"
          >
            {t.brand}
          </Link>
          <nav className="hidden items-center gap-1 lg:flex" aria-label={t.common.primaryNav}>
            {links.map((l) => (
              <Link key={l.href} href={l.href} className={linkClass(l.href)}>
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="hidden items-center gap-1 md:flex">
          <Link
            href={switched}
            className="inline-flex min-h-11 items-center rounded-md px-2 text-xs font-semibold uppercase text-white/90 hover:bg-white/10"
          >
            {other}
          </Link>
          {authed ? (
            <>
              <Link href={`/${locale}/wishlist`} className={linkClass(`/${locale}/wishlist`)}>
                {t.nav.wishlist}
              </Link>
              <Link href={`/${locale}/bookings`} className={linkClass(`/${locale}/bookings`)}>
                {t.nav.bookings}
              </Link>
              <Link href={`/${locale}/account`} className={linkClass(`/${locale}/account`)}>
                {t.auth.account}
              </Link>
              {admin ? (
                <Link href={`/${locale}/admin`} className={linkClass(`/${locale}/admin`)}>
                  {t.nav.admin}
                </Link>
              ) : null}
              <button
                type="button"
                className="ml-1 inline-flex min-h-11 items-center rounded-lg bg-white px-3 text-sm font-semibold text-[#0064d2]"
                onClick={async () => {
                  const rt = getRefreshToken();
                  if (rt) {
                    try {
                      await api.logout(rt);
                    } catch {
                      /* ignore logout network errors */
                    }
                  }
                  clearSession();
                  setAuthed(false);
                  setAdmin(false);
                  router.push(`/${locale}`);
                }}
              >
                {t.nav.logout}
              </button>
            </>
          ) : (
            <>
              <Link
                href={`/${locale}/login`}
                className="inline-flex min-h-11 items-center px-2 text-sm font-medium text-white hover:underline"
              >
                {t.nav.login}
              </Link>
              <Link
                href={`/${locale}/register`}
                className="inline-flex min-h-11 items-center rounded-lg bg-[#ff6d00] px-4 text-sm font-bold text-white shadow-sm hover:bg-[#e65100]"
              >
                {t.nav.register}
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-md hover:bg-white/10 md:hidden"
          aria-label={t.common.menu}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open ? (
        <div className="max-h-[70vh] overflow-y-auto border-t border-white/15 bg-[#0057b8] px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="inline-flex min-h-11 items-center rounded-md px-2 text-sm"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href={`/${locale}/ai`}
              onClick={() => setOpen(false)}
              className="inline-flex min-h-11 items-center rounded-md px-2 text-sm"
            >
              {t.nav.ai}
            </Link>
            <Link
              href={`/${locale}/explore`}
              onClick={() => setOpen(false)}
              className="inline-flex min-h-11 items-center rounded-md px-2 text-sm"
            >
              {t.nav.explore}
            </Link>
            <Link
              href={switched}
              onClick={() => setOpen(false)}
              className="inline-flex min-h-11 items-center rounded-md px-2 text-sm uppercase"
            >
              {other}
            </Link>
            {authed ? (
              <>
                <Link
                  href={`/${locale}/wishlist`}
                  onClick={() => setOpen(false)}
                  className="inline-flex min-h-11 items-center rounded-md px-2 text-sm"
                >
                  {t.nav.wishlist}
                </Link>
                <Link
                  href={`/${locale}/bookings`}
                  onClick={() => setOpen(false)}
                  className="inline-flex min-h-11 items-center rounded-md px-2 text-sm"
                >
                  {t.nav.bookings}
                </Link>
                <Link
                  href={`/${locale}/account`}
                  onClick={() => setOpen(false)}
                  className="inline-flex min-h-11 items-center rounded-md px-2 text-sm"
                >
                  {t.auth.account}
                </Link>
                {admin ? (
                  <Link
                    href={`/${locale}/admin`}
                    onClick={() => setOpen(false)}
                    className="inline-flex min-h-11 items-center rounded-md px-2 text-sm font-semibold"
                  >
                    {t.nav.admin}
                  </Link>
                ) : null}
                <button
                  type="button"
                  className="inline-flex min-h-11 items-center rounded-md px-2 text-left text-sm"
                  onClick={() => {
                    clearSession();
                    setAuthed(false);
                    setAdmin(false);
                    setOpen(false);
                    router.push(`/${locale}`);
                  }}
                >
                  {t.nav.logout}
                </button>
              </>
            ) : (
              <>
                <Link
                  href={`/${locale}/login`}
                  onClick={() => setOpen(false)}
                  className="inline-flex min-h-11 items-center rounded-md px-2 text-sm"
                >
                  {t.nav.login}
                </Link>
                <Link
                  href={`/${locale}/register`}
                  onClick={() => setOpen(false)}
                  className="inline-flex min-h-11 items-center rounded-md px-2 text-sm font-semibold text-[#ffb380]"
                >
                  {t.nav.register}
                </Link>
              </>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
