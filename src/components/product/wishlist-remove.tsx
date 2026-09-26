"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { toggleWishlist } from "@/server/actions/shop";

export function WishlistRemove({ productId }: { productId: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await toggleWishlist(productId);
          toast(r.message);
        })
      }
      className="h-9 rounded-md border border-border-strong text-sm font-semibold hover:bg-surface disabled:opacity-60"
    >
      {pending ? "Removing…" : "Remove"}
    </button>
  );
}
