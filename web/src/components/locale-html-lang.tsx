"use client";

import { useEffect } from "react";
import type { Locale } from "@/lib/i18n";

/** Sets <html lang> for the active route locale (root layout cannot read [locale]). */
export function LocaleHtmlLang({ locale }: { locale: Locale }) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return null;
}
