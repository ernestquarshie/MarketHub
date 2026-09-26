"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createContext, useContext, useMemo, useState, useTransition } from "react";
import { Bell, BellRing, Building2, Check, Heart, MapPin, Minus, Plus, ShieldCheck, Truck, ZoomIn } from "lucide-react";
import { toast } from "sonner";
import { convert, formatMoney, percentOff, type Currency, type Rates } from "@/lib/money";
import { effectiveMoq, findTier, priceLine, sortTiers, type TierInput } from "@/lib/pricing";
import { addToCart, removePriceAlert, setPriceAlert, toggleWishlist } from "@/server/actions/shop";
import { cn } from "@/lib/utils";
import { Countdown } from "./countdown";
import { shortDate } from "@/lib/format";

export interface PurchaseData {
  product: {
    id: string;
    slug: string;
    title: string;
    currency: Currency;
    retailPrice: number;
    compareAtPrice: number | null;
    moq: number;
    leadTimeDays: number;
    readyToShip: boolean;
    sample: { enabled: boolean; price: number | null; maxQty: number };
    tiers: TierInput[];
    deal: { dealPrice: number; endsAt: string; startsAt: string; stockCap: number; claimed: number } | null;
    variants: { id: string; options: Record<string, string>; priceOverride: number | null; available: number }[];
    images: { url: string; alt: string; variantOption: string | null }[];
  };
  currency: Currency;
  rates: Rates;
  view: "retail" | "business";
  viewer: { signedIn: boolean; isBusiness: boolean; inWishlist: boolean; alert: { targetPrice: number | null } | null };
  delivery: {
    zoneName: string;
    currency: Currency;
    doorstepFee: number;
    pickupFee: number;
    etaMin: number;
    etaMax: number;
    stationName: string | null;
    /** Server "today" (ISO) so delivery dates render identically on server and client. */
    today: string;
  } | null;
}

interface Ctx extends PurchaseData {
  selected: Record<string, string>;
  select: (name: string, value: string) => void;
  variant: PurchaseData["product"]["variants"][number] | null;
  qty: number;
  setQty: (n: number) => void;
  business: boolean;
  money: (minor: number) => string;
}

const PurchaseContext = createContext<Ctx | null>(null);
function usePurchase() {
  const c = useContext(PurchaseContext);
  if (!c) throw new Error("usePurchase outside provider");
  return c;
}

export function optionNames(variants: PurchaseData["product"]["variants"]) {
  const names: string[] = [];
  for (const v of variants) for (const k of Object.keys(v.options)) if (!names.includes(k)) names.push(k);
  return names;
}

export function PurchaseProvider({ data, children }: { data: PurchaseData; children: React.ReactNode }) {
  const first = data.product.variants.find((v) => v.available > 0) ?? data.product.variants[0] ?? null;
  const [selected, setSelected] = useState<Record<string, string>>(first?.options ?? {});
  const business = data.view === "business";
  const moq = effectiveMoq({ ...data.product, retailPrice: data.product.retailPrice }, business);
  const [qty, setQtyRaw] = useState(business ? moq : 1);

  const variant = useMemo(() => {
    const names = Object.keys(selected);
    return (
      data.product.variants.find((v) => names.every((n) => v.options[n] === selected[n])) ??
      data.product.variants.find((v) => Object.entries(v.options).some(([k, val]) => selected[k] === val)) ??
      null
    );
  }, [selected, data.product.variants]);

  const value: Ctx = {
    ...data,
    selected,
    select: (name, val) => setSelected((s) => ({ ...s, [name]: val })),
    variant,
    qty,
    setQty: (n) => setQtyRaw(Math.max(1, Math.min(100_000, Math.floor(n) || 1))),
    business,
    money: (minor) => formatMoney(convert(minor, data.product.currency, data.currency, data.rates), data.currency),
  };
  return <PurchaseContext.Provider value={value}>{children}</PurchaseContext.Provider>;
}

function usePrice() {
  const c = usePurchase();
  const p = c.product;
  return priceLine(
    {
      retailPrice: p.retailPrice,
      variantPriceOverride: c.variant?.priceOverride,
      compareAtPrice: p.compareAtPrice,
      moq: p.moq,
      tiers: p.tiers,
      flashDeal: p.deal
        ? {
            dealPrice: p.deal.dealPrice,
            startsAt: new Date(p.deal.startsAt),
            endsAt: new Date(p.deal.endsAt),
            stockCap: p.deal.stockCap,
            claimed: p.deal.claimed,
          }
        : null,
    },
    { qty: c.qty, isBusinessBuyer: c.business },
  );
}

// ---------------------------------------------------------------------------
// Gallery
// ---------------------------------------------------------------------------
export function ProductGallery() {
  const c = usePurchase();
  const images = c.product.images;
  const colour = c.selected.Colour ?? c.selected.Pattern;
  const variantIndex = images.findIndex((i) => i.variantOption && i.variantOption === colour);
  const [index, setIndex] = useState<number | null>(null);
  const [zoom, setZoom] = useState(false);
  const current = index ?? (variantIndex >= 0 ? variantIndex : 0);
  const img = images[current];

  return (
    <div className="flex flex-col gap-3 lg:sticky lg:top-4">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-image">
        {img ? (
          <Image
            src={img.url}
            alt={img.alt}
            fill
            priority
            sizes="(min-width: 1024px) 40vw, 100vw"
            className={cn("object-cover transition-transform duration-300", zoom && "scale-150")}
          />
        ) : null}
        {c.product.deal && !c.business ? (
          <span className="absolute top-3 left-3 rounded-sm bg-deal px-2.5 py-1 text-[13px] font-bold text-white">
            Flash deal
          </span>
        ) : null}
        {img ? (
          <button
            type="button"
            onClick={() => setZoom((z) => !z)}
            aria-pressed={zoom}
            aria-label={zoom ? "Zoom out" : "Zoom in"}
            className="absolute right-3 bottom-3 flex size-10 items-center justify-center rounded-md bg-bg/90 text-text shadow"
          >
            <ZoomIn className="size-5" aria-hidden />
          </button>
        ) : null}
      </div>
      {images.length > 1 ? (
        <ul className="grid grid-cols-5 gap-2" aria-label="Product images">
          {images.map((im, i) => (
            <li key={im.url + i}>
              <button
                type="button"
                onClick={() => {
                  setIndex(i);
                  setZoom(false);
                }}
                aria-label={`Show image ${i + 1} of ${images.length}`}
                aria-current={i === current ? "true" : undefined}
                className={cn(
                  "relative block aspect-square w-full overflow-hidden rounded-md border-2 bg-image",
                  i === current ? "border-primary" : "border-transparent hover:border-border-strong",
                )}
              >
                <Image src={im.url} alt="" fill sizes="96px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Headline price (info column)
// ---------------------------------------------------------------------------
export function HeadlinePrice() {
  const c = usePurchase();
  const price = usePrice();
  const p = c.product;
  if (c.business) return null;
  const off = price.wasPrice ? percentOff(price.wasPrice, price.unitPrice) : 0;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-baseline gap-3">
        {off ? (
          <span className="rounded-sm bg-deal-soft px-2 py-0.5 text-sm font-bold text-deal-strong">−{off}%</span>
        ) : null}
        <span
          className={cn(
            "font-display text-[34px] leading-none font-extrabold tabular",
            price.source === "flash_deal" && "text-deal",
          )}
        >
          {c.money(price.unitPrice)}
        </span>
        {price.wasPrice ? (
          <span className="text-[15px] text-muted tabular">
            Was <span className="line-through">{c.money(price.wasPrice)}</span>
          </span>
        ) : null}
      </div>
      {price.source === "flash_deal" && p.deal ? (
        <span className="text-sm font-semibold text-deal-strong">
          Flash deal ends in <Countdown endsAt={p.deal.endsAt} />
        </span>
      ) : null}
      {p.tiers.length ? (
        <p className="text-sm text-business">
          Buying {sortTiers(p.tiers)[0]!.minQty}+? Switch to <strong>Business</strong> in the header for bulk prices
          from {c.money(Math.min(...p.tiers.map((t) => t.unitPrice)))}/unit.
        </p>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Variant options
// ---------------------------------------------------------------------------
const SWATCH: Record<string, string> = {
  "Graphite black": "#1F2937",
  Black: "#111827",
  "Pearl white": "#F8FAFC",
  White: "#FFFFFF",
  "Deep teal": "#0F4C3F",
  Teal: "#0F766E",
  Navy: "#1E293B",
  Coral: "#F97361",
  Grey: "#9CA3AF",
  Olive: "#556B2F",
  Sage: "#9CAF88",
  Tan: "#B07A4F",
  "Sky blue": "#7DB7E8",
  "Blush pink": "#F4B6C2",
  Natural: "#E9DFC9",
  "Space grey": "#6B7280",
  Silver: "#D1D5DB",
  Yellow: "#FACC15",
  "Brushed steel": "#C0C4C9",
  Graphite: "#374151",
};

export function VariantOptions() {
  const c = usePurchase();
  const names = optionNames(c.product.variants);
  if (!names.length || c.product.variants.length < 2) {
    const only = c.product.variants[0];
    if (!only) return null;
    return (
      <p className="text-sm text-muted">
        {Object.entries(only.options)
          .map(([k, v]) => `${k}: ${v}`)
          .join(" · ")}
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      {names.map((name) => {
        const values = [...new Set(c.product.variants.map((v) => v.options[name]).filter(Boolean))] as string[];
        const isColour = name === "Colour";
        return (
          <fieldset key={name} className="flex flex-col gap-2">
            <legend className="mb-2 text-sm">
              <strong>{name}:</strong> {c.selected[name]}
            </legend>
            <div className="flex flex-wrap gap-2">
              {values.map((val) => {
                const candidate = c.product.variants.find(
                  (v) =>
                    v.options[name] === val &&
                    Object.entries(c.selected).every(([k, sv]) => k === name || v.options[k] === sv),
                );
                const soldOut = candidate ? candidate.available <= 0 : false;
                const checked = c.selected[name] === val;
                const id = `opt-${name}-${val}`.replace(/\W+/g, "-");
                return (
                  <label
                    key={val}
                    htmlFor={id}
                    className={cn(
                      "relative flex min-h-11 cursor-pointer items-center gap-2 rounded-md border-2 px-3 text-sm font-medium has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-primary",
                      checked ? "border-primary bg-primary-soft" : "border-border hover:border-border-strong",
                      soldOut && "opacity-50",
                    )}
                  >
                    <input
                      id={id}
                      type="radio"
                      name={name}
                      value={val}
                      checked={checked}
                      onChange={() => c.select(name, val)}
                      className="sr-only"
                    />
                    {isColour && SWATCH[val] ? (
                      <span
                        aria-hidden
                        className="size-5 rounded-full border border-border-strong"
                        style={{ background: SWATCH[val] }}
                      />
                    ) : null}
                    {val}
                    {soldOut ? <span className="text-xs text-muted">(sold out)</span> : null}
                  </label>
                );
              })}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Business pricing table (Alibaba-style)
// ---------------------------------------------------------------------------
export function TierTable({ rfqHref }: { rfqHref: string }) {
  const c = usePurchase();
  const [pending, start] = useTransition();
  const router = useRouter();
  const p = c.product;
  if (!p.tiers.length && !p.sample.enabled) return null;
  const tiers = sortTiers(p.tiers);
  const active = c.business ? findTier(tiers, c.qty) : null;
  const base = c.variant?.priceOverride ?? p.retailPrice;

  return (
    <section aria-labelledby="bulk-h" className="overflow-hidden rounded-lg border border-business-border">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 bg-business-soft px-4 py-3">
        <h2 id="bulk-h" className="flex items-center gap-2 font-sans text-sm font-bold text-business-strong">
          <Building2 className="size-4 text-business" aria-hidden /> Business pricing
        </h2>
        <span className="text-[13px] text-business">
          MOQ {Math.max(p.moq, tiers[0]?.minQty ?? 1)} · Lead time {p.leadTimeDays} days
          {p.readyToShip ? " · Ready to ship" : ""}
        </span>
      </div>
      {tiers.length ? (
        <ul aria-label="Unit price by quantity" className="grid grid-cols-[repeat(auto-fit,minmax(110px,1fr))]">
          {tiers.map((t) => {
            const on = active?.minQty === t.minQty;
            const save = percentOff(base, t.unitPrice);
            return (
              <li
                key={t.minQty}
                aria-current={on ? "true" : undefined}
                className={cn(
                  "flex flex-col gap-0.5 border-t-[3px] px-4 py-3",
                  on ? "border-business bg-business-soft" : "border-transparent",
                )}
              >
                <span className="font-display text-xl font-bold text-business tabular">{c.money(t.unitPrice)}</span>
                <span className="text-[13px] text-muted">
                  {t.minQty.toLocaleString("en-US")}
                  {t.maxQty ? `–${t.maxQty.toLocaleString("en-US")}` : "+"} units
                </span>
                {save > 0 ? <span className="text-xs font-semibold text-success">Save {save}%</span> : null}
              </li>
            );
          })}
        </ul>
      ) : null}
      <div className="flex flex-wrap gap-2.5 border-t border-border px-4 py-3">
        {p.sample.enabled && p.sample.price !== null ? (
          <button
            type="button"
            disabled={pending || !c.variant}
            onClick={() =>
              start(async () => {
                const r = await addToCart({ variantId: c.variant!.id, qty: 1, sample: true });
                if (r.ok) toast.success(r.message);
                else if ("needsLogin" in r && r.needsLogin) router.push(`/login?next=/p/${p.slug}` as never);
                else toast.error(r.message);
              })
            }
            className="inline-flex h-10 flex-1 items-center justify-center rounded-md border border-business px-3 text-sm font-semibold text-business hover:bg-business-soft disabled:opacity-60"
          >
            Order a sample · {p.sample.price === 0 ? "free" : c.money(p.sample.price)}
          </button>
        ) : null}
        <Link
          href={rfqHref as never}
          className="inline-flex h-10 flex-1 items-center justify-center rounded-md bg-business px-3 text-sm font-semibold text-white no-underline hover:no-underline hover:opacity-90 dark:bg-business-soft dark:text-business-strong"
        >
          Request a quote
        </Link>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Buy box
// ---------------------------------------------------------------------------
export function BuyBox() {
  const c = usePurchase();
  const router = useRouter();
  const price = usePrice();
  const [pending, start] = useTransition();
  const [delivery, setDelivery] = useState<"doorstep" | "pickup">("doorstep");
  const [saved, setSaved] = useState(c.viewer.inWishlist);
  const [alertOpen, setAlertOpen] = useState(false);
  const [target, setTarget] = useState("");
  const p = c.product;
  const available = c.variant?.available ?? 0;
  const moq = effectiveMoq({ ...p }, c.business);
  const step = c.business ? (c.qty >= 100 ? 50 : 10) : 1;
  const blockedBusiness = c.business && !c.viewer.isBusiness;

  const d = c.delivery;
  const fee = d ? (delivery === "doorstep" ? d.doorstepFee : d.pickupFee) : 0;
  const feeInDisplay = d ? convert(fee, d.currency, c.currency, c.rates) : 0;
  const lead = p.readyToShip ? 0 : p.leadTimeDays;
  const eta = d
    ? (() => {
        const from = new Date(new Date(d.today).getTime() + (d.etaMin + lead) * 86_400_000);
        const to = new Date(new Date(d.today).getTime() + (d.etaMax + lead) * 86_400_000);
        const f = shortDate;
        return d.etaMin === d.etaMax ? f(from) : `${f(from)} – ${f(to)}`;
      })()
    : null;
  const lineDisplay = convert(price.lineTotal, p.currency, c.currency, c.rates);

  function add(buyNow: boolean) {
    if (!c.variant) return;
    start(async () => {
      const r = await addToCart({ variantId: c.variant!.id, qty: c.qty });
      if (r.ok) {
        if (buyNow) router.push("/cart");
        else toast.success(r.message, { action: { label: "View cart", onClick: () => router.push("/cart") } });
      } else if ("needsLogin" in r && r.needsLogin) {
        toast.error(r.message, {
          action: { label: "Sign in", onClick: () => router.push(`/login?next=/p/${p.slug}` as never) },
        });
      } else toast.error(r.message);
    });
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-bg p-5 shadow-[0_4px_16px_rgb(15_23_42/0.05)]">
      <div className="flex flex-col gap-0.5">
        <span
          className={cn(
            "font-display text-[28px] font-extrabold tabular",
            c.business ? "text-business" : price.source === "flash_deal" ? "text-deal" : "text-text",
          )}
        >
          {c.money(price.unitPrice)}
          {c.business ? <span className="font-sans text-sm font-medium text-muted"> /unit</span> : null}
        </span>
        <span className="text-sm text-muted tabular">
          {price.source === "tier" && price.tier
            ? `Tier ${price.tier.minQty}${price.tier.maxQty ? `–${price.tier.maxQty}` : "+"} units · you save ${percentOff(price.wasPrice ?? 0, price.unitPrice)}% vs retail`
            : price.source === "flash_deal"
              ? "Flash deal price"
              : c.business
                ? `Minimum order ${moq} units`
                : "Price includes VAT where applicable"}
        </span>
      </div>

      {d ? (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-semibold">Delivery to {d.zoneName}</legend>
          {(
            [
              ["doorstep", "Doorstep delivery", d.doorstepFee, Truck],
              ["pickup", d.stationName ? `Pickup station · ${d.stationName}` : "Pickup station", d.pickupFee, MapPin],
            ] as const
          ).map(([key, label, f, Icon]) =>
            key === "pickup" && d.zoneName === "International" ? null : (
              <label
                key={key}
                className={cn(
                  "flex cursor-pointer items-start gap-2.5 rounded-md border-2 px-3 py-2.5 has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-primary",
                  delivery === key ? "border-primary bg-primary-soft" : "border-border",
                )}
              >
                <input
                  type="radio"
                  name="delivery"
                  value={key}
                  checked={delivery === key}
                  onChange={() => setDelivery(key)}
                  className="mt-1 accent-[var(--primary)]"
                />
                <span className="flex flex-col">
                  <span className="flex items-center gap-1.5 text-sm font-semibold">
                    <Icon className="size-4 text-primary" aria-hidden /> {label}
                  </span>
                  <span className="text-[13px] text-muted tabular">
                    {eta} · {formatMoney(convert(f, d.currency, c.currency, c.rates), c.currency)}
                  </span>
                </span>
              </label>
            ),
          )}
        </fieldset>
      ) : null}

      <p className={cn("text-[15px] font-semibold", available > 0 ? "text-success" : "text-danger")}>
        {available <= 0 ? "Out of stock" : available < 20 ? `In stock — only ${available} left` : "In stock"}
      </p>

      <div className="flex items-center gap-3">
        <span id="qty-label" className="text-sm font-semibold">
          Quantity
        </span>
        <div
          role="group"
          aria-labelledby="qty-label"
          className="flex items-center overflow-hidden rounded-md border border-border-strong"
        >
          <button
            type="button"
            aria-label="Decrease quantity"
            onClick={() => c.setQty(Math.max(c.business ? moq : 1, c.qty - step))}
            disabled={c.qty <= (c.business ? moq : 1)}
            className="flex size-11 items-center justify-center bg-surface disabled:opacity-40"
          >
            <Minus className="size-4" aria-hidden />
          </button>
          <label htmlFor="qty" className="sr-only">
            Quantity
          </label>
          <input
            id="qty"
            type="number"
            inputMode="numeric"
            min={c.business ? moq : 1}
            value={c.qty}
            onChange={(e) => c.setQty(Number(e.target.value))}
            className="h-11 w-16 [appearance:textfield] border-x border-border-strong bg-bg text-center font-semibold tabular [&::-webkit-inner-spin-button]:appearance-none"
          />
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => c.setQty(c.qty + step)}
            className="flex size-11 items-center justify-center bg-surface"
          >
            <Plus className="size-4" aria-hidden />
          </button>
        </div>
      </div>
      {price.error?.code === "BELOW_MOQ" ? (
        <p role="alert" className="text-sm font-medium text-danger">
          Minimum order at business prices is {price.error.moq} units.
        </p>
      ) : null}

      <div className="flex justify-between border-t border-border pt-3 text-[15px] tabular">
        <span className="text-muted">
          Total ({c.qty} {c.qty === 1 ? "item" : "items"} + delivery)
        </span>
        <strong>{formatMoney(lineDisplay + feeInDisplay, c.currency)}</strong>
      </div>

      {blockedBusiness ? (
        <div className="flex flex-col gap-2 rounded-md bg-business-soft p-3 text-sm text-business-strong">
          Business prices are for verified business accounts.
          <Link
            href={(c.viewer.signedIn ? "/account/business" : `/login?next=/p/${p.slug}`) as never}
            className="font-semibold text-business"
          >
            {c.viewer.signedIn ? "Verify your business" : "Sign in to a business account"}
          </Link>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => add(false)}
        disabled={pending || available <= 0 || !!price.error || blockedBusiness}
        className="h-12 rounded-lg bg-primary text-base font-bold text-primary-fg hover:bg-primary-hover disabled:opacity-50"
      >
        {pending ? "Adding…" : "Add to cart"}
      </button>
      <button
        type="button"
        onClick={() => add(true)}
        disabled={pending || available <= 0 || !!price.error || blockedBusiness}
        className="h-12 rounded-lg bg-ink text-base font-bold text-ink-fg hover:opacity-90 disabled:opacity-50 dark:bg-text dark:text-bg"
      >
        Buy now
      </button>

      <ul className="flex flex-col gap-2 text-[13px] text-muted">
        <li className="flex gap-2">
          <ShieldCheck className="size-[18px] shrink-0 text-primary" aria-hidden />
          <span>
            <strong className="text-text">Protected order.</strong> Payment is released to the seller after you confirm
            delivery.
          </span>
        </li>
        <li>Pay with mobile money, card or on delivery</li>
      </ul>

      <div className="flex gap-2.5">
        <button
          type="button"
          aria-pressed={saved}
          onClick={() =>
            start(async () => {
              const r = await toggleWishlist(p.id);
              if (r.ok) {
                setSaved(!!r.saved);
                toast.success(r.message);
              } else if (r.needsLogin) router.push(`/login?next=/p/${p.slug}` as never);
              else toast.error(r.message);
            })
          }
          className={cn(
            "inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-md border border-border-strong text-sm font-semibold",
            saved ? "text-deal" : "text-text",
          )}
        >
          <Heart className={cn("size-4", saved && "fill-current")} aria-hidden /> {saved ? "Saved" : "Wishlist"}
        </button>
        <button
          type="button"
          aria-expanded={alertOpen}
          aria-controls="price-alert"
          onClick={() => {
            if (!c.viewer.signedIn) return router.push(`/login?next=/p/${p.slug}` as never);
            setAlertOpen((o) => !o);
          }}
          className={cn(
            "inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-md border border-border-strong text-sm font-semibold",
            c.viewer.alert && "bg-primary-soft",
          )}
        >
          {c.viewer.alert ? <BellRing className="size-4" aria-hidden /> : <Bell className="size-4" aria-hidden />}
          {c.viewer.alert ? "Watching price" : "Watch price"}
        </button>
      </div>
      {alertOpen ? (
        <form
          id="price-alert"
          className="flex flex-col gap-2 rounded-md bg-surface p-3"
          onSubmit={(e) => {
            e.preventDefault();
            const n = target.trim() ? Number(target) : null;
            start(async () => {
              const r = await setPriceAlert({ productId: p.id, targetMajor: n });
              if (r.ok) {
                toast.success(r.message);
                setAlertOpen(false);
              } else toast.error(r.message);
            });
          }}
        >
          <label htmlFor="alert-target" className="text-sm font-semibold">
            Notify me when the price drops to (optional)
          </label>
          <div className="flex gap-2">
            <input
              id="alert-target"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder={`${c.currency} target`}
              className="h-10 min-w-0 flex-1 rounded-md border border-border-strong bg-bg px-2.5 text-sm"
            />
            <button type="submit" className="h-10 rounded-md bg-primary px-4 text-sm font-semibold text-primary-fg">
              <Check className="size-4" aria-hidden />
              <span className="sr-only">Save alert</span>
            </button>
          </div>
          {c.viewer.alert ? (
            <button
              type="button"
              onClick={() =>
                start(async () => {
                  const r = await removePriceAlert(p.id);
                  toast(r.message);
                  setAlertOpen(false);
                })
              }
              className="self-start text-sm font-semibold text-danger"
            >
              Stop watching
            </button>
          ) : null}
        </form>
      ) : null}
    </div>
  );
}

/** Sticky add-to-cart bar on small screens. */
export function MobileBuyBar() {
  const c = usePurchase();
  const price = usePrice();
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-border bg-bg px-4 py-3 shadow-[0_-4px_16px_rgb(15_23_42/0.06)] lg:hidden">
      <span className="flex flex-col">
        <span className="text-xs text-muted">{c.business ? "Per unit" : "Price"}</span>
        <strong className={cn("tabular", c.business && "text-business")}>{c.money(price.unitPrice)}</strong>
      </span>
      <button
        type="button"
        disabled={
          pending ||
          !c.variant ||
          (c.variant?.available ?? 0) <= 0 ||
          !!price.error ||
          (c.business && !c.viewer.isBusiness)
        }
        onClick={() =>
          start(async () => {
            const r = await addToCart({ variantId: c.variant!.id, qty: c.qty });
            if (r.ok) toast.success(r.message, { action: { label: "View cart", onClick: () => router.push("/cart") } });
            else toast.error(r.message);
          })
        }
        className="h-12 flex-1 rounded-lg bg-primary font-bold text-primary-fg disabled:opacity-50"
      >
        {pending ? "Adding…" : "Add to cart"}
      </button>
    </div>
  );
}
