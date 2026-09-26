import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/account", "/cart", "/checkout", "/seller", "/admin", "/api/", "/login", "/register", "/search?"],
      },
    ],
    sitemap: new URL("/sitemap.xml", base).toString(),
  };
}
