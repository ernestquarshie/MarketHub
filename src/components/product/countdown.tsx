"use client";

import { useSyncExternalStore } from "react";
import { dayTime } from "@/lib/format";

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const pad = (n: number) => String(n).padStart(2, "0");
  return { h: pad(Math.floor(s / 3600)), m: pad(Math.floor((s % 3600) / 60)), s: pad(s % 60), done: s === 0 };
}

// A shared one-second clock; null on the server so SSR and hydration agree.
function subscribeClock(cb: () => void) {
  const t = setInterval(cb, 1000);
  return () => clearInterval(t);
}
const getNow = () => Math.floor(Date.now() / 1000) * 1000;
const getServerNow = () => null;

/**
 * Honest countdown to a real end time. Updates visually every second but is not announced
 * by screen readers each tick (the static end time is available as text).
 */
export function Countdown({ endsAt, className }: { endsAt: string; className?: string }) {
  const end = new Date(endsAt).getTime();
  const now = useSyncExternalStore(subscribeClock, getNow, getServerNow);
  const p = parts(end - (now ?? end - 1));
  const endLabel = dayTime(new Date(endsAt));
  return (
    <span className={className}>
      <span aria-hidden className="tabular">
        {now === null ? "--:--:--" : p.done ? "Ended" : `${p.h}:${p.m}:${p.s}`}
      </span>
      <span className="sr-only">Ends {endLabel}</span>
    </span>
  );
}
