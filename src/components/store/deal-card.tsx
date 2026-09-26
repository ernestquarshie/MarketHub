import Image from "next/image";
import Link from "next/link";
import type { ProductCardData } from "@/server/queries/catalog";
import { percentOff, type Currency, type Rates } from "@/lib/money";
import { Price } from "./price";

export function DealCard({
  card,
  claimedPct,
  currency,
  rates,
}: {
  card: ProductCardData;
  claimedPct: number;
  currency: Currency;
  rates: Rates;
}) {
  const deal = card.dealPrice ?? card.retailPrice;
  const was = card.compareAtPrice && card.compareAtPrice > card.retailPrice ? card.compareAtPrice : card.retailPrice;
  const off = percentOff(was, deal);
  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-[14px] border border-border bg-bg transition-shadow hover:shadow-[var(--shadow-card)]">
      <div className="relative aspect-square bg-image">
        {card.image ? (
          <Image src={card.image.url} alt="" fill sizes="(min-width: 1280px) 16vw, 45vw" className="object-cover" />
        ) : null}
        {off ? (
          <span className="absolute top-2.5 left-2.5 rounded-sm bg-deal px-2 py-0.5 text-xs font-bold text-white">
            −{off}%
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <h3 className="font-sans text-sm font-normal">
          <Link
            href={`/p/${card.slug}` as never}
            className="line-clamp-2 text-text after:absolute after:inset-0 hover:no-underline"
          >
            {card.title}
          </Link>
        </h3>
        <Price amount={deal} from={card.currency} to={currency} rates={rates} was={was} className="text-lg text-deal" />
        <div className="mt-auto flex flex-col gap-1">
          <div
            className="h-1.5 overflow-hidden rounded-full bg-surface-2"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={claimedPct}
            aria-label="Deal claimed"
          >
            <div className="h-full bg-deal" style={{ width: `${claimedPct}%` }} />
          </div>
          <span className="text-xs text-muted">{claimedPct}% claimed</span>
        </div>
      </div>
    </article>
  );
}
