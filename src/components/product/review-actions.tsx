"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import { reportReview, voteHelpful } from "@/server/actions/shop";
import { cn } from "@/lib/utils";

export function ReviewActions({
  reviewId,
  helpful,
  voted,
  slug,
}: {
  reviewId: string;
  helpful: number;
  voted: boolean;
  slug: string;
}) {
  const [pending, start] = useTransition();
  const [state, setState] = useState({ helpful, voted });
  const router = useRouter();
  const needLogin = () => router.push(`/login?next=/p/${slug}` as never);
  return (
    <div className="flex items-center gap-3 text-[13px] text-muted">
      <button
        type="button"
        aria-pressed={state.voted}
        disabled={pending || state.voted}
        onClick={() =>
          start(async () => {
            const r = await voteHelpful(reviewId);
            if (r.ok) setState((s) => ({ helpful: s.helpful + 1, voted: true }));
            else if (r.needsLogin) needLogin();
            else toast.error(r.message);
          })
        }
        className={cn(
          "inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border-strong px-3 text-text",
          state.voted && "border-primary bg-primary-soft",
        )}
      >
        <ThumbsUp className="size-3.5" aria-hidden /> Helpful ({state.helpful})
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await reportReview(reviewId);
            if (r.ok) toast.success(r.message);
            else if (r.needsLogin) needLogin();
            else toast.error(r.message);
          })
        }
        className="min-h-9 underline-offset-2 hover:underline"
      >
        Report
      </button>
    </div>
  );
}
