"use client";

import { SlidersHorizontal } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

/** Mobile/tablet container for the facet sidebar (server-rendered children). */
export function FilterSheet({ count, children }: { count: number; children: React.ReactNode }) {
  return (
    <Sheet>
      <SheetTrigger className="inline-flex h-10 items-center gap-2 rounded-md border border-border-strong bg-bg px-3.5 text-sm font-semibold lg:hidden">
        <SlidersHorizontal className="size-4" aria-hidden />
        Filters{count ? ` (${count})` : ""}
      </SheetTrigger>
      <SheetContent side="left" title="Filters">
        <div className="p-4">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
