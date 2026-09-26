import Link from "next/link";
import type { ProductCardData } from "@/server/queries/catalog";
import type { Currency, Rates } from "@/lib/money";
import { ProductCard } from "./product-card";

export function ProductRail({
  title,
  products,
  currency,
  rates,
  view,
  href,
  id,
}: {
  title: string;
  products: ProductCardData[];
  currency: Currency;
  rates: Rates;
  view: "retail" | "business";
  href?: string;
  id: string;
}) {
  if (!products.length) return null;
  return (
    <section aria-labelledby={id} className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 id={id} className="text-xl font-bold md:text-[22px]">
          {title}
        </h2>
        {href ? (
          <Link href={href as never} className="text-sm font-semibold">
            See all<span className="sr-only"> {title}</span>
          </Link>
        ) : null}
      </div>
      <ul className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-6">
        {products.map((p) => (
          <li key={p.id} className="w-[46vw] shrink-0 snap-start sm:w-auto">
            <ProductCard product={p} currency={currency} rates={rates} view={view} />
          </li>
        ))}
      </ul>
    </section>
  );
}
