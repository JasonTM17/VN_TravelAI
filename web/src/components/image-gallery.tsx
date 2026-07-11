"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  clampSlideIndex,
  nextSlideIndex,
  normalizeImageList,
  prevSlideIndex,
} from "@/lib/gallery-slides";
import { getDict, tFormat, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Props = {
  images?: Array<string | null | undefined> | null;
  alt: string;
  fallback?: string;
  className?: string;
  aspectClass?: string;
  priority?: boolean;
  locale?: Locale;
};

export function ImageGallery({
  images,
  alt,
  fallback = "/images/categories/hotels.jpg",
  className,
  aspectClass = "aspect-[4/3]",
  priority = false,
  locale = "vi",
}: Props) {
  const t = getDict(locale);
  const slides = normalizeImageList(images, fallback);
  const [index, setIndex] = useState(0);
  const safe = clampSlideIndex(index, slides.length);
  const multi = slides.length > 1;

  const goPrev = useCallback(() => {
    setIndex((i) => prevSlideIndex(i, slides.length));
  }, [slides.length]);
  const goNext = useCallback(() => {
    setIndex((i) => nextSlideIndex(i, slides.length));
  }, [slides.length]);

  return (
    <div
      className={cn("relative overflow-hidden rounded-3xl border border-border shadow-elevated", className)}
      data-testid="image-gallery"
      data-slide-count={slides.length}
    >
      <div className={cn("relative w-full", aspectClass)}>
        <Image
          key={slides[safe]}
          src={slides[safe]}
          alt={`${alt} (${safe + 1}/${slides.length})`}
          fill
          className="object-cover"
          priority={priority}
          sizes="(max-width:768px) 100vw, 50vw"
        />
      </div>

      {multi ? (
        <>
          <button
            type="button"
            aria-label={t.common.prevImage}
            className="absolute left-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm hover:bg-black/60"
            onClick={goPrev}
            data-testid="gallery-prev"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            aria-label={t.common.nextImage}
            className="absolute right-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm hover:bg-black/60"
            onClick={goNext}
            data-testid="gallery-next"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={tFormat(t.common.goToImage, { n: i + 1 })}
                aria-current={i === safe}
                className="flex h-11 w-11 items-center justify-center rounded-full"
                onClick={() => setIndex(i)}
              >
                <span aria-hidden="true" className={cn("h-2.5 w-2.5 rounded-full transition-colors", i === safe ? "bg-white" : "bg-white/50 hover:bg-white/80")} />
              </button>
            ))}
          </div>
          <div className="absolute right-3 top-3 rounded-md bg-black/50 px-2 py-0.5 text-xs font-medium text-white">
            {safe + 1}/{slides.length}
          </div>
        </>
      ) : null}
    </div>
  );
}
