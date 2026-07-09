import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function Breadcrumb({
  items,
}: {
  items: Array<{ label: string; href?: string }>;
}) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1 text-sm text-muted">
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
