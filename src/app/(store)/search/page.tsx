import type { Metadata } from "next";
import { parseSearchParams } from "@/lib/search-params";
import { getPrefs } from "@/server/prefs";
import { getRates } from "@/server/queries/catalog";
import { searchProducts, searchSuppliers } from "@/server/services/search";
import { ResultsView } from "@/components/search/results-view";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";

export async function generateMetadata({ searchParams }: PageProps<"/search">): Promise<Metadata> {
  const p = parseSearchParams(await searchParams);
  return {
    title: p.q ? `Results for “${p.q}”` : "Search products and suppliers",
    // Faceted/paginated result pages shouldn't compete with category pages in search engines.
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const params = parseSearchParams(await searchParams);
  const [prefs, rates] = await Promise.all([getPrefs(), getRates()]);
  const [result, suppliers] = await Promise.all([
    searchProducts(params, prefs.currency, rates),
    params.type === "suppliers" ? searchSuppliers(params.q, params.category) : Promise.resolve(null),
  ]);

  return (
    <ResultsView
      title={params.q ? `Results for “${params.q}”` : "All products"}
      breadcrumb={<Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Search" }]} />}
      params={params}
      basePath="/search"
      result={result}
      suppliers={suppliers}
      currency={prefs.currency}
      rates={rates}
      view={prefs.view}
    />
  );
}
