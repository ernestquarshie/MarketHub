"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { toggleWishlist } from "@/server/actions/shop";
import { cn } from "@/lib/utils";

export function WishlistHeart({ productId, title, initial }: { productId: string; title: string; initial: boolean }) {
  const [saved, setSaved] = useState(initial);
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? `Remove ${title} from wishlist` : `Save ${title} to wishlist`}
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await toggleWishlist(productId);
          if (r.ok) setSaved(!!r.saved);
          else if (r.needsLogin) {
            toast(r.message, { action: { label: "Sign in", onClick: () => router.push("/login") } });
          } else toast.error(r.message);
        })
      }
      className={cn(
        "absolute top-2.5 right-2.5 z-10 flex size-9 items-center justify-center rounded-full bg-bg shadow-md transition-colors",
        saved ? "text-deal" : "text-muted hover:text-text",
      )}
    >
      <Heart className={cn("size-[18px]", saved && "fill-current")} aria-hidden />
    </button>
  );
}
