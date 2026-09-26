"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Slide {
  id: string;
  eyebrow: string | null;
  title: string;
  subtitle: string | null;
  ctaLabel: string;
  href: string;
  imageUrl: string | null;
  theme: string;
}

const THEME: Record<string, { bg: string; accent: string; eyebrow: string }> = {
  teal: { bg: "bg-primary-soft", accent: "bg-primary text-primary-fg hover:bg-primary-hover", eyebrow: "text-primary" },
  indigo: { bg: "bg-business-soft", accent: "bg-business text-white hover:opacity-90", eyebrow: "text-business" },
  amber: {
    bg: "bg-amber-50 dark:bg-amber-950/40",
    accent: "bg-amber-800 text-white hover:bg-amber-900",
    eyebrow: "text-amber-800 dark:text-amber-300",
  },
};

const RM = "(prefers-reduced-motion: reduce)";
function subscribeReducedMotion(cb: () => void) {
  const m = window.matchMedia(RM);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
}
const getReducedMotion = () => window.matchMedia(RM).matches;

/**
 * Accessible hero carousel: auto-advances every 7s, pauses on hover/focus and with a
 * visible pause button (WCAG 2.2.2), and never auto-plays under reduced motion.
 */
export function HeroCarousel({ slides }: { slides: Slide[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hover, setHover] = useState(false);
  const reduced = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, () => true);
  useEffect(() => {
    if (paused || hover || reduced || slides.length < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % slides.length), 7000);
    return () => clearInterval(t);
  }, [paused, hover, reduced, slides.length]);

  if (!slides.length) return null;
  const s = slides[i]!;
  const theme = THEME[s.theme] ?? THEME.teal!;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured promotions"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocusCapture={() => setHover(true)}
      onBlurCapture={() => setHover(false)}
      className={cn("relative overflow-hidden rounded-lg", theme.bg)}
    >
      <div
        role="group"
        aria-roledescription="slide"
        aria-label={`${i + 1} of ${slides.length}`}
        className="grid min-h-[340px] items-center gap-6 p-7 pb-20 md:grid-cols-[1fr_320px] md:p-12 md:pb-20 lg:grid-cols-[1fr_360px]"
      >
        <div className="flex max-w-xl flex-col gap-4">
          {s.eyebrow ? (
            <span className={cn("self-start rounded-full bg-bg px-3 py-1 text-[13px] font-bold", theme.eyebrow)}>
              {s.eyebrow}
            </span>
          ) : null}
          <h1 className="text-3xl leading-tight font-extrabold md:text-[44px]">{s.title}</h1>
          {s.subtitle ? <p className="text-base leading-relaxed text-muted md:text-[17px]">{s.subtitle}</p> : null}
          <div className="mt-1 flex flex-wrap gap-3">
            <Link
              href={s.href as never}
              className={cn(
                "inline-flex h-12 items-center rounded-md px-6 font-semibold no-underline hover:no-underline",
                theme.accent,
              )}
            >
              {s.ctaLabel}
            </Link>
            <Link
              href="/search"
              className="inline-flex h-12 items-center rounded-md border border-border-strong bg-bg px-6 font-semibold text-text no-underline hover:no-underline"
            >
              Browse all
            </Link>
          </div>
        </div>
        {s.imageUrl ? (
          <div className="relative hidden aspect-square overflow-hidden rounded-[14px] bg-image shadow-[var(--shadow-card)] md:block">
            <Image src={s.imageUrl} alt="" fill sizes="360px" className="object-cover" priority={i === 0} />
          </div>
        ) : null}
      </div>
      {slides.length > 1 ? (
        <div className="absolute bottom-5 left-7 flex items-center gap-2 md:left-12">
          <button
            type="button"
            onClick={() => setI((x) => (x - 1 + slides.length) % slides.length)}
            aria-label="Previous slide"
            className="flex size-10 items-center justify-center rounded-full border border-border bg-bg text-text"
          >
            <ChevronLeft className="size-4" aria-hidden />
          </button>
          {slides.map((sl, k) => (
            <button
              key={sl.id}
              type="button"
              onClick={() => setI(k)}
              aria-label={`Show slide ${k + 1}: ${sl.title}`}
              aria-current={k === i ? "true" : undefined}
              className="flex h-10 min-w-6 items-center justify-center"
            >
              <span
                className={cn(
                  "block h-2 rounded-full transition-all",
                  k === i ? "w-7 bg-ink dark:bg-text" : "w-2 bg-muted",
                )}
              />
            </button>
          ))}
          <button
            type="button"
            onClick={() => setI((x) => (x + 1) % slides.length)}
            aria-label="Next slide"
            className="flex size-10 items-center justify-center rounded-full border border-border bg-bg text-text"
          >
            <ChevronRight className="size-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            aria-label={paused ? "Play slideshow" : "Pause slideshow"}
            className="ml-1 flex size-10 items-center justify-center rounded-full border border-border bg-bg text-text"
          >
            {paused ? <Play className="size-4" aria-hidden /> : <Pause className="size-4" aria-hidden />}
          </button>
        </div>
      ) : null}
    </section>
  );
}
