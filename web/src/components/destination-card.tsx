import Image from "next/image";
import Link from "next/link";
import type { Destination } from "@/lib/api";
import type { Locale } from "@/lib/i18n";

export function DestinationCard({
  destination,
  locale,
}: {
  destination: Destination;
  locale: Locale;
}) {
  const name = locale === "en" ? destination.nameEn : destination.nameVi;
  const href = `/${locale}/destinations/${destination.slug}`;
  const img = destination.heroImageUrl?.startsWith("/")
    ? destination.heroImageUrl
    : `/images/destinations/${destination.slug}.jpg`;

  return (
    <Link
      href={href}
      className="card-hover group block overflow-hidden rounded-2xl border border-border bg-card shadow-elevated"
      data-testid="destination-card"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image
          src={img}
          alt={name}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
          sizes="(max-width:768px) 100vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-indigo-night/70 via-transparent to-transparent" />
        <div className="absolute bottom-3 left-3 right-3">
          <div className="text-xs font-medium uppercase tracking-wide text-white/80">
            {destination.countryCode}
          </div>
          <h3 className="text-lg font-semibold text-white">{name}</h3>
        </div>
      </div>
    </Link>
  );
}
