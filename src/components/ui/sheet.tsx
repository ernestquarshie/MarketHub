"use client";

import * as React from "react";
import { Dialog } from "radix-ui";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Sheet = Dialog.Root;
export const SheetTrigger = Dialog.Trigger;
export const SheetClose = Dialog.Close;

export function SheetContent({
  side = "left",
  title,
  className,
  children,
  ...props
}: React.ComponentProps<typeof Dialog.Content> & { side?: "left" | "right" | "bottom"; title: string }) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
      <Dialog.Content
        className={cn(
          "fixed z-50 flex flex-col bg-bg shadow-[var(--shadow-popover)] outline-none",
          side === "left" && "inset-y-0 left-0 w-[88vw] max-w-sm",
          side === "right" && "inset-y-0 right-0 w-[88vw] max-w-md",
          side === "bottom" && "inset-x-0 bottom-0 max-h-[85vh] rounded-t-2xl",
          className,
        )}
        {...props}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <Dialog.Title className="font-display text-lg font-bold">{title}</Dialog.Title>
          <Dialog.Close
            className="inline-flex size-11 items-center justify-center rounded-md hover:bg-surface"
            aria-label="Close"
          >
            <X className="size-5" aria-hidden />
          </Dialog.Close>
        </div>
        <Dialog.Description className="sr-only">{title}</Dialog.Description>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </Dialog.Content>
    </Dialog.Portal>
  );
}
