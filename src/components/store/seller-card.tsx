import Link from "next/link";
import { BadgeCheck, MapPin, Star } from "lucide-react";
import type { SellerCardData } from "@/server/queries/catalog";
import { initials } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const COUNTRY: Record<string, string> = {
  GH: "Ghana",
  NG: "Nigeria",
  CN: "China",
  GB: "United Kingdom",
  US: "United States",
};

export function yearsOnPlatform(joinedAt: Date) {
  return Math.max(1, Math.floor((Date.now() - new Date(joinedAt).getTime()) / (365.25 * 86_400_000)));
}

export function SellerCard({ seller: s, extra }: { seller: SellerCardData; extra?: React.ReactNode }) {
  return (
    <article className="relative flex h-full flex-col gap-3 rounded-[14px] border border-border bg-bg p-5 transition-shadow hover:shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary-soft font-display text-[17px] font-extrabold text-primary">
          {initials(s.name)}
        </span>
        <div className="flex min-w-0 flex-col">
          <h3 className="font-sans text-[15px] font-semibold">
            <Link
              href={`/store/${s.slug}` as never}
              className="text-text after:absolute after:inset-0 hover:text-primary hover:no-underline"
            >
              {s.name}
            </Link>
          </h3>
          <span className="flex items-center gap-1 text-[13px] text-muted">
            <MapPin className="size-3.5" aria-hidden />
            {s.city}, {COUNTRY[s.country] ?? s.country}
          </span>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {s.isVerified ? (
          <Badge tone="verified">
            <BadgeCheck className="size-3.5" aria-hidden /> Verified
          </Badge>
        ) : null}
        {s.isStarSeller ? <Badge tone="star">Star Seller</Badge> : null}
        <Badge tone="neutral">{yearsOnPlatform(s.joinedAt)} yrs</Badge>
      </div>
      <dl className="grid grid-cols-3 gap-2 text-xs text-muted tabular">
        <div>
          <dt>Rating</dt>
          <dd className="flex items-center gap-0.5 text-[15px] font-bold text-text">
            <Star className="size-3.5 fill-star text-star" aria-hidden />
            {s.ratingCount ? s.ratingAvg.toFixed(1) : "New"}
          </dd>
        </div>
        <div>
          <dt>Response</dt>
          <dd className="text-[15px] font-bold text-text">{s.responseRate}%</dd>
        </div>
        <div>
          <dt>Products</dt>
          <dd className="text-[15px] font-bold text-text">{s.productCount}</dd>
        </div>
      </dl>
      {extra}
    </article>
  );
}
