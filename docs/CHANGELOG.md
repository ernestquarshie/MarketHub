# Changelog: approvals and decisions

| Date | Stage | Decision / approval |
|---|---|---|
| 2026-09-26 | 0 — Discovery | Answers captured: multi-vendor B2C + B2B; must-haves = admin, payments, search/reviews, B2B tools; markets = Africa + global; goal = portfolio/demo (test-mode payments). Brief drafted, pending approval. |
| 2026-09-26 | 0 — Discovery | **Approved** by Ern. Stage 1 references chosen: Amazon, Alibaba, Jumia, Etsy, Temu/AliExpress (plus Claude picks). |
| 2026-09-26 | 1 — References | Reference analysis drafted (29-row best-of table), pending approval. |
| 2026-09-26 | 1 — References | **Approved** by Ern. Promoted into v1: price alerts + price history, B2B sample orders. AI assistant stays Future. |
| 2026-09-26 | 2 — Requirements | PRD drafted (~50 Must stories, MVP = Must), pending approval. |
| 2026-09-26 | 2 — Requirements | **Approved** by Ern. GitHub repo set: `git@github.com:ernestquarshie/MarketHub.git` — all stage docs and code committed there. |
| 2026-09-26 | 3 — Design | Design drafted: Next.js 16 + TS + Tailwind v4/shadcn, Neon Postgres + Drizzle, Better Auth, Stripe + Paystack (test), Vercel. Pending approval. |
| 2026-09-26 | 3 — Design | **Approved** by Ern. Stack: Neon + Drizzle + Better Auth + Cloudinary. Brand: MarketHub, teal/coral/indigo. Clickable HTML prototype (home + product page) requested before Stage 4. |
| 2026-09-26 | 3 — Design | Clickable prototype published (Home, Product desktop, Product mobile); sources in `docs/prototype/`. Pending review. |
| 2026-09-26 | 3 — Design | Prototype revised per Ern: icon placeholders replaced with 27 AI-generated sample product photos (Canva). Real build will use seller-uploaded photos via Cloudinary. |
| 2026-09-26 | 3 — Design | Prototype **approved** by Ern. |
| 2026-09-26 | 4 — Build plan | Build plan drafted: M1 Foundation → M2 Catalogue → M3 Checkout → M4 B2B → M5 Seller Centre → M6 Admin → M7 Hardening. Pending approval. |
| 2026-09-26 | 4 — Build plan | **Approved** by Ern. |
| 2026-09-26 | 4 — M1 Foundation | Built on branch `m1-foundation`: scaffold, schema (44 tables), seed, Better Auth + roles, layout, tests + CI. 29 unit + 21 E2E/a11y tests passing. Pending demo approval. |
| 2026-09-26 | 4 — M1 Foundation | **Approved** by Ern ("Go on"). Merged to `main`. M2 Catalogue started on `m2-catalogue`. |
| 2026-09-26 | 4 — M2 Catalogue | Built on `m2-catalogue`: catalogue expanded to 50 products/15 sellers (20 new AI sample photos), Postgres search + autocomplete, search/category pages with facets, product page (variants, retail + bulk buy boxes, delivery estimate, reviews, price history, recommendations), home rails, deals, sellers, storefronts, wishlist + price alerts, add-to-cart (pulled forward from M3), SEO (JSON-LD, sitemap, robots). 38 unit + 39 E2E/a11y tests passing; Lighthouse (warm) home 97/100/100/92→fixed, product 99 perf. Pending demo approval. |
