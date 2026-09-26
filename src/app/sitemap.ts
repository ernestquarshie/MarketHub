import type { MetadataRoute } from "next";
import { eq } from "drizzle-orm";
import { db, schema } from "@/server/db";

// Rebuilt at request time (hourly cache) so new products appear without a redeploy.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
  const [products, categories, sellers] = await Promise.all([
    db
      .select({ slug: schema.product.slug, updatedAt: schema.product.updatedAt })
      .from(schema.product)
      .where(eq(schema.product.status, "published")),
    db.select({ slug: schema.category.slug }).from(schema.category),
    db
      .select({ slug: schema.seller.slug, updatedAt: schema.seller.updatedAt })
      .from(schema.seller)
      .where(eq(schema.seller.status, "approved")),
  ]);
  const url = (path: string) => new URL(path, base).toString();
  return [
    { url: url("/"), changeFrequency: "daily", priority: 1 },
    { url: url("/deals"), changeFrequency: "hourly", priority: 0.8 },
    { url: url("/sellers"), changeFrequency: "weekly", priority: 0.6 },
    ...categories.map((c) => ({ url: url(`/c/${c.slug}`), changeFrequency: "daily" as const, priority: 0.7 })),
    ...products.map((p) => ({
      url: url(`/p/${p.slug}`),
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...sellers.map((s) => ({
      url: url(`/store/${s.slug}`),
      lastModified: s.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
  ];
}
