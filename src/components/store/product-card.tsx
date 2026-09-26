import Image from "next/image";
import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import type { ProductCardData } from "@/server/queries/catalog";
import type { Currency, Rates } from "@/lib/money";
import { percentOff } from "@/lib/money";
import { compactNumber } from "@/lib/utils";
import { Price } from "./price";
import { RatingStars } from "./rating-stars";

export function ProductCard({
  product: p,
  currency,
  rates,
  view,
  priority = false,
}: {
  product: ProductCardData;
  currency: Currency;
  rates: Rates;
  view: "retail" | "business";
  priority?: boolean;
}) {
  const href = `/p/${p.slug}` as const;
  const retailNow = p.dealPrice ?? p.retailPrice;
  const was = p.dealPrice
    ? p.compareAtPrice && p.compareAtPrice > p.retailPrice
      ? p.compareAtPrice
      : p.retailPrice
    : p.compareAtPrice;
  const off = was ? percentOff(was, retailNow) : 0;
  const showBusiness = view === "business" && p.lowestTierPrice != null;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-[14px] border border-border bg-bg transition-shadow hover:border-border-strong hover:shadow-[var(--shadow-card)]">
      <Link href={href} className="relative block aspect-square bg-image" tabIndex={-1} aria-hidden>
        {p.image ? (
          <Image
            src={p.image.url}
            alt=""
            fill
            sizes="(min-width: 1280px) 16vw, (min-width: 768px) 25vw, 50vw"
            className="object-cover"
            priority={priority}
          />
        ) : null}
        {off > 0 && view === "retail" ? (
          <span className="absolute top-2.5 left-2.5 rounded-sm bg-deal px-2 py-0.5 text-xs font-bold text-white">
            −{off}%
          </span>
        ) : null}
      </Link>
      <div className="flex flex-1 flex-col gap-1.5 p-3 sm:px-3.5 sm:pb-3.5">
        <h3 className="font-sans text-sm leading-snug font-normal">
          <Link
            href={href}
            className="line-clamp-2 text-text after:absolute after:inset-0 hover:text-primary hover:no-underline"
          >
            {p.title}
          </Link>
        </h3>
        {p.ratingCount > 0 ? (
          <span className="flex items-center gap-1.5 text-[13px]">
            <RatingStars value={p.ratingAvg} />
            <span className="text-muted tabular">({p.ratingCount})</span>
          </span>
        ) : null}
        {showBusiness ? (
          <span className="flex flex-col gap-0.5">
            <span className="text-business">
              <Price
                amount={p.lowestTierPrice!}
                from={p.currency}
                to={currency}
                rates={rates}
                className="text-[17px]"
                suffix="/unit"
              />
            </span>
            <span className="text-xs text-muted">
              MOQ {p.moq} · {p.leadTimeDays}-day lead time
            </span>
          </span>
        ) : (
          <span className="flex flex-wrap items-baseline gap-x-2">
            <Price
              amount={retailNow}
              from={p.currency}
              to={currency}
              rates={rates}
              was={was}
              className={p.dealPrice ? "text-lg text-deal" : "text-lg"}
            />
            {p.soldCount > 0 ? (
              <span className="text-xs text-muted tabular">{compactNumber(p.soldCount)} sold</span>
            ) : null}
          </span>
        )}
        <span className="mt-auto flex items-center gap-1 text-xs text-muted">
          {p.seller.name}
          {p.seller.isVerified ? <BadgeCheck className="size-3.5 text-primary" aria-label="Verified seller" /> : null}
        </span>
      </div>
    </article>
  );
}
