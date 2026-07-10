"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { getDict, isLocale } from "@/lib/i18n";

export function Breadcrumb({
  items,
  locale: localeProp,
}: {
  items: Array<{ label: string; href?: string }>;
  locale?: string;
}) {
  const params = useParams();
  const fromParams = typeof params?.locale === "string" ? params.locale : "vi";
  const raw = localeProp ?? fromParams;
  const t = getDict(isLocale(raw) ? raw : "vi");

  return (
    <nav aria-label={t.common.breadcrumb} className="mb-6 flex flex-wrap items-center gap-1 text-sm text-muted">
      {items.map((item, i) => (
        <span key={`${item.label}-${i}`} className="inline-flex items-center gap-1">
          {i > 0 ? <ChevronRight className="h-3.5 w-3.5" /> : null}
          {item.href ? (
            <Link href={item.href} className="hover:text-ocean">
              {item.label}
            </Link>
          ) : (
            <span className="font-medium text-foreground">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
