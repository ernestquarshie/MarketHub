import Image from "next/image";
import Link from "next/link";
import type { ProductCardData } from "@/server/queries/catalog";
import { convert, formatMoney, type Currency, type Rates } from "@/lib/money";

export function BulkCard({
  product: p,
  tiers,
  currency,
  rates,
}: {
  product: ProductCardData;
  tiers: { minQty: number; maxQty: number | null; unitPrice: number }[];
  currency: Currency;
  rates: Rates;
}) {
  const money = (m: number) => formatMoney(convert(m, p.currency, currency, rates), currency);
  return (
    <article className="relative flex h-full gap-3.5 rounded-[14px] border border-business-border bg-bg p-3.5 transition-shadow hover:shadow-[var(--shadow-card)]">
      <div className="relative h-[140px] w-[110px] shrink-0 overflow-hidden rounded-md bg-image sm:w-[124px]">
        {p.image ? <Image src={p.image.url} alt="" fill sizes="124px" className="object-cover" /> : null}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <h3 className="font-sans text-sm font-medium">
          <Link
            href={`/p/${p.slug}` as never}
            className="line-clamp-2 text-text after:absolute after:inset-0 hover:no-underline"
          >
            {p.title}
          </Link>
        </h3>
        <ul className="grid grid-cols-3 gap-1" aria-label="Bulk prices">
          {tiers.slice(0, 3).map((t) => (
            <li key={t.minQty} className="flex flex-col rounded-sm bg-business-soft px-1.5 py-1">
              <span className="text-[13px] font-bold text-business tabular">{money(t.unitPrice)}</span>
              <span className="text-[11px] text-muted">
                {t.minQty.toLocaleString("en-US")}
                {t.maxQty ? `–${t.maxQty.toLocaleString("en-US")}` : "+"}
              </span>
            </li>
          ))}
        </ul>
        <span className="text-xs text-muted">
          MOQ {p.moq.toLocaleString("en-US")} · Ships in {p.leadTimeDays} days
        </span>
        <span className="text-xs font-medium text-muted">{p.seller.name}</span>
      </div>
    </article>
  );
}
