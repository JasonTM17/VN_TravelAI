"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PromoSlide } from "@/lib/gallery-slides";
import { nextSlideIndex, prevSlideIndex } from "@/lib/gallery-slides";
import { cn } from "@/lib/utils";

export function PromoCarousel({ slides }: { slides: PromoSlide[] }) {
  const [index, setIndex] = useState(0);
  if (slides.length === 0) return null;
  const safe = ((index % slides.length) + slides.length) % slides.length;
  const current = slides[safe];

  return (
    <div className="relative w-full" data-testid="promo-carousel" data-slide-count={slides.length}>
      {/* Desktop: horizontal strip of all promos */}
      <div className="hidden gap-4 md:flex md:overflow-x-auto md:pb-1">
        {slides.map((p) => (
          <PromoCard key={p.href + p.img} p={p} className="min-w-[280px] flex-1 md:min-w-[240px]" />
        ))}
      </div>

      {/* Mobile: one slide at a time with controls */}
      <div className="md:hidden">
        <PromoCard p={current} className="w-full" />
        {slides.length > 1 ? (
          <div className="mt-3 flex items-center justify-between gap-2">
            <button
              type="button"
              aria-label="Previous promo"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-white shadow-sm"
              onClick={() => setIndex((i) => prevSlideIndex(i, slides.length))}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex gap-1.5">
              {slides.map((_, i) => (
                <span
                  key={i}
                  className={cn("h-2 w-2 rounded-full", i === safe ? "bg-[#0064d2]" : "bg-border")}
                />
              ))}
            </div>
            <button
              type="button"
              aria-label="Next promo"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-white shadow-sm"
              onClick={() => setIndex((i) => nextSlideIndex(i, slides.length))}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function PromoCard({ p, className }: { p: PromoSlide; className?: string }) {
  return (
    <Link
      href={p.href}
      className={cn(
        "group relative block h-48 overflow-hidden rounded-xl shadow-md",
        className,
      )}
    >
      <Image
        src={p.img}
        alt={p.title}
        fill
        className="object-cover transition duration-500 group-hover:scale-105"
        sizes="(max-width:768px) 100vw, 33vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      <div className="absolute bottom-4 left-4 right-4">
        <span
          className={
            p.badgeTone === "error"
              ? "mb-2 inline-block rounded bg-red-600 px-2 py-0.5 text-xs font-bold text-white"
              : p.badgeTone === "info"
                ? "mb-2 inline-block rounded bg-[#0064d2] px-2 py-0.5 text-xs font-bold text-white"
                : "mb-2 inline-block rounded bg-[#ff6d00] px-2 py-0.5 text-xs font-bold text-white"
          }
        >
          {p.badge}
        </span>
        <div className="text-lg font-bold leading-tight text-white">{p.title}</div>
      </div>
    </Link>
  );
}
