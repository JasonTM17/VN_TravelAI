import Link from "next/link";
import { Compass } from "lucide-react";

export function EmptyState({
  title,
  description,
  ctaHref,
  ctaLabel,
}: {
  title: string;
  description: string;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card px-6 py-16 text-center shadow-elevated">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-ocean/10 text-ocean">
        <Compass className="h-7 w-7" />
      </div>
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-muted">{description}</p>
      {ctaHref && ctaLabel ? (
        <Link
          href={ctaHref}
          className="mt-6 rounded-full bg-ocean px-5 py-2.5 text-sm font-medium text-white shadow-glow transition hover:bg-ocean-deep"
        >
          {ctaLabel}
        </Link>
      ) : null}
    </div>
  );
}
