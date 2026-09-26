"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { BadgeCheck, FolderTree, Search } from "lucide-react";
import type { Suggestion } from "@/server/services/search";
import { cn } from "@/lib/utils";

interface Option {
  id: string;
  href: string;
  label: string;
  kind: "product" | "category" | "supplier" | "query";
  image?: string | null;
  verified?: boolean;
}

/**
 * Search box with accessible autocomplete (ARIA 1.2 combobox + listbox).
 * Without JavaScript it is a plain GET form to /search.
 */
export function SearchBar({
  categories,
  className,
}: {
  categories: { id: string; slug: string; name: string }[];
  className?: string;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const listId = useId();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [scope, setScope] = useState(sp.get("c") ?? "");
  const [data, setData] = useState<Suggestion | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const abortRef = useRef<AbortController | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) return;
    const t = setTimeout(async () => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      try {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(term)}`, { signal: ctrl.signal });
        if (res.ok) setData(await res.json());
      } catch {
        /* aborted or offline: keep the plain form behaviour */
      }
    }, 150);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const options: Option[] = [];
  const shown = q.trim().length >= 2 ? data : null;
  if (shown) {
    options.push({ id: "q", href: `/search?q=${encodeURIComponent(q.trim())}`, label: q.trim(), kind: "query" });
    for (const p of shown.products)
      options.push({ id: `p-${p.slug}`, href: `/p/${p.slug}`, label: p.title, kind: "product", image: p.image });
    for (const c of shown.categories)
      options.push({ id: `c-${c.slug}`, href: `/c/${c.slug}`, label: c.name, kind: "category" });
    for (const s of shown.suppliers)
      options.push({
        id: `s-${s.slug}`,
        href: `/store/${s.slug}`,
        label: s.name,
        kind: "supplier",
        verified: s.isVerified,
      });
  }
  const expanded = open && options.length > 0;

  function go(href: string) {
    setOpen(false);
    router.push(href as never);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(options.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(-1, i - 1));
    } else if (e.key === "Escape") {
      if (expanded) {
        e.preventDefault();
        setOpen(false);
        setActive(-1);
      } else setQ("");
    } else if (e.key === "Enter" && expanded && active >= 0) {
      e.preventDefault();
      go(options[active]!.href);
    }
  }

  const sectionLabel: Record<Option["kind"], string> = {
    query: "",
    product: "Products",
    category: "Categories",
    supplier: "Suppliers",
  };

  return (
    <div ref={wrapRef} className={cn("relative w-full", className)}>
      <form
        role="search"
        action="/search"
        onSubmit={(e) => {
          e.preventDefault();
          const params = new URLSearchParams();
          if (q.trim()) params.set("q", q.trim());
          if (scope) params.set("c", scope);
          go(`/search${params.size ? `?${params}` : ""}`);
        }}
        className="flex h-12 w-full overflow-hidden rounded-[10px] border-2 border-primary bg-bg focus-within:ring-2 focus-within:ring-primary/30"
      >
        <label htmlFor="search-scope" className="sr-only">
          Search in
        </label>
        <select
          id="search-scope"
          name="c"
          value={scope}
          onChange={(e) => setScope(e.target.value)}
          className="hidden max-w-40 cursor-pointer border-r border-border bg-surface px-3 text-sm font-medium text-text outline-none md:block"
        >
          <option value="">All</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <label htmlFor="search-q" className="sr-only">
          Search MarketHub
        </label>
        <input
          id="search-q"
          name="q"
          type="search"
          role="combobox"
          aria-expanded={expanded}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={expanded && active >= 0 ? `${listId}-${options[active]!.id}` : undefined}
          autoComplete="off"
          enterKeyHint="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search products, suppliers and categories"
          className="min-w-0 flex-1 bg-transparent px-4 text-[15px] text-text outline-none placeholder:text-muted"
        />
        <button
          type="submit"
          aria-label="Search"
          className="flex w-14 shrink-0 items-center justify-center bg-primary text-primary-fg hover:bg-primary-hover"
        >
          <Search className="size-5" aria-hidden />
        </button>
      </form>

      <ul
        id={listId}
        role="listbox"
        aria-label="Search suggestions"
        hidden={!expanded}
        className="absolute inset-x-0 top-[calc(100%+6px)] z-40 max-h-[70vh] overflow-y-auto rounded-md border border-border bg-bg py-1.5 shadow-[var(--shadow-popover)]"
      >
        {options.map((o, i) => {
          const header = o.kind !== "query" && options[i - 1]?.kind !== o.kind ? sectionLabel[o.kind] : null;
          return (
            <li key={o.id} role="presentation">
              {header ? (
                <div
                  role="presentation"
                  className="px-3.5 pt-2 pb-1 text-[11px] font-bold tracking-wide text-muted uppercase"
                >
                  {header}
                </div>
              ) : null}
              <div
                id={`${listId}-${o.id}`}
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => go(o.href)}
                onMouseEnter={() => setActive(i)}
                className={cn(
                  "flex min-h-11 cursor-pointer items-center gap-3 px-3.5 text-sm",
                  i === active ? "bg-surface" : "",
                )}
              >
                {o.kind === "query" ? <Search className="size-4 text-muted" aria-hidden /> : null}
                {o.kind === "category" ? <FolderTree className="size-4 text-muted" aria-hidden /> : null}
                {o.kind === "product" ? (
                  <span className="relative size-9 shrink-0 overflow-hidden rounded-sm bg-image">
                    {o.image ? <Image src={o.image} alt="" fill sizes="36px" className="object-cover" /> : null}
                  </span>
                ) : null}
                {o.kind === "supplier" ? (
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-sm bg-primary-soft text-xs font-bold text-primary">
                    {o.label.slice(0, 2).toUpperCase()}
                  </span>
                ) : null}
                <span className="line-clamp-1 flex-1">
                  {o.kind === "query" ? (
                    <>
                      Search for <strong>&ldquo;{o.label}&rdquo;</strong>
                    </>
                  ) : (
                    o.label
                  )}
                </span>
                {o.verified ? <BadgeCheck className="size-4 text-primary" aria-label="Verified" /> : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
