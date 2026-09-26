import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { parseSearchParams } from "@/lib/search-params";
import { getPrefs } from "@/server/prefs";
import { getRates } from "@/server/queries/catalog";
import { searchProducts, searchSuppliers } from "@/server/services/search";
import { ResultsView } from "@/components/search/results-view";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";

const getCategory = cache(async (slug: string) => {
  const c = await db.query.category.findFirst({
    where: eq(schema.category.slug, slug),
    with: {
      parent: { columns: { slug: true, name: true } },
      children: { columns: { slug: true, name: true }, orderBy: asc(schema.category.sortOrder) },
    },
  });
  return c ?? null;
});

export async function generateMetadata({ params, searchParams }: PageProps<"/c/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const c = await getCategory(slug);
  if (!c) return { title: "Category not found" };
  const sp = await searchParams;
  const filtered = Object.keys(sp).length > 0;
  return {
    title: `${c.name} — retail and wholesale`,
    description: `Shop ${c.name.toLowerCase()} from verified sellers. Retail prices, bulk tiers and quotes, with delivery across Ghana, Nigeria and worldwide.`,
    alternates: { canonical: `/c/${slug}` },
    robots: filtered ? { index: false, follow: true } : undefined,
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps<"/c/[slug]">) {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) notFound();
  const sp = parseSearchParams(await searchParams, slug);
  const [prefs, rates] = await Promise.all([getPrefs(), getRates()]);
  const [result, suppliers] = await Promise.all([
    searchProducts(sp, prefs.currency, rates),
    sp.type === "suppliers" ? searchSuppliers(sp.q, slug) : Promise.resolve(null),
  ]);

  const crumbs = [{ name: "Home", href: "/" }];
  if (category.parent) crumbs.push({ name: category.parent.name, href: `/c/${category.parent.slug}` });
  crumbs.push({ name: category.name, href: `/c/${category.slug}` });

  return (
    <ResultsView
      title={category.name}
      breadcrumb={<Breadcrumbs items={crumbs} />}
      params={sp}
      basePath={`/c/${slug}`}
      result={result}
      suppliers={suppliers}
      currency={prefs.currency}
      rates={rates}
      view={prefs.view}
      subcategories={category.children}
    />
  );
}
