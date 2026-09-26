# 04: Build Plan

**Date:** 2026-09-26 · **Status:** Awaiting approval
**Inputs:** [02-requirements.md](02-requirements.md) (stories), [03-design.md](03-design.md) (stack, model, UI), prototype in `docs/prototype/`

## How we'll work
- **One milestone at a time.** Each milestone ends with: app running, tests green, commit(s) pushed, a short demo summary, and **your approval** before the next one starts.
- **Branching:** `main` is always deployable. Each milestone is built on `m<N>-<name>` and merged when you approve it.
- **Definition of done (every milestone):**
  - Lint, typecheck and tests pass in CI.
  - New pages are responsive at 375 / 768 / 1280 px, keyboard-usable, with no axe critical/serious issues.
  - Server actions are Zod-validated and policy-checked.
  - Seed data covers the new features.
- **Local run target:** `pnpm i && docker compose up -d && pnpm db:migrate && pnpm db:seed && pnpm dev`

---

## M1: Foundation (scaffold, data, auth, layout)
**Goal:** A running skeleton with the real schema, seed data, login, and the MarketHub look.

| Task | Stories |
|---|---|
| Next.js 16 + TS strict + Tailwind v4 + shadcn/ui; pnpm; ESLint + Prettier; Vitest + Playwright setup | PLT-03 |
| GitHub Actions CI: lint, typecheck, unit tests, E2E smoke (Postgres service) | — |
| `docker-compose.yml` (Postgres 16); `.env.example`; README quick start | — |
| Drizzle schema for **all** entities in the design §3 + migrations; money helpers (minor units), currency conversion | — |
| Seed script: categories, 12 sellers, ~200 products with variants, tiers and images, reviews, 12-month price history, orders, RFQs and quotes, zones and pickup stations, coupons, flash deals, banners, demo users | PLT-01 |
| Better Auth: email/password + Google (optional env), sessions, roles; `policy.ts`; route guards for `/account`, `/seller`, `/admin` | CUS-12 (login/register/reset) |
| Demo mode: "Try as…" role switcher + test-mode banner | PLT-01 |
| Design tokens (light/dark CSS vars), fonts, `SiteHeader` (search shell, currency switcher, Retail/Business toggle, cart badge), `MegaMenu`, `MobileNav`, `SiteFooter` | CUS-11 (UI), PLT-03 |

**Acceptance:** The app boots locally from the README steps. You can sign in as each demo role and reach only the allowed areas. The header and footer match the prototype. CI is green.

## M2: Catalogue & discovery (storefront)
**Goal:** Browse, search and evaluate products like on Amazon and Alibaba.

| Task | Stories |
|---|---|
| Home: hero carousel (pausable), category grid, flash-deal rail with an honest countdown, recommended / Ready-to-Ship bulk / top sellers rails, trust strip | CUS-01 |
| Search service: Postgres FTS + `pg_trgm`; `/api/search/suggest` autocomplete; Products/Suppliers toggle | CUS-02 |
| Search/category results: facets (category, price, rating, brand, location, Ready-to-Ship, MOQ, verified, in stock), sort, URL-synced filters, mobile filter sheet, pagination | CUS-03, B2B-03 |
| Product page: gallery, variants with stock, Buy Box / Bulk Buy Box, **pricing service** (tiers, MOQ, flash deals, currency), delivery estimate, specs, seller card | CUS-04, B2B-02 |
| Reviews display: histogram, filters, sort, verified badge, photos, helpful votes | CUS-05 |
| Recommendations: frequently bought together, also viewed, more from seller | CUS-16 |
| Seller storefront page | CUS-15 |
| Wishlist (heart on cards + page) | CUS-14 |
| Currency switcher persisted (cookie/profile); Retail/Business view | CUS-11 |
| Price history chart on the product page + "Watch price" (creates an alert) | CUS-18 (part 1) |
| SEO: metadata, Product/Review/Breadcrumb JSON-LD, sitemap.xml, robots.txt, canonical URLs for facets | PLT-04 |

**Acceptance:** A shopper can find a product via search or category, filter and sort, see correct retail vs tier prices in GHS/NGN/USD, and wishlist or watch it. Lighthouse SEO ≥ 95 on home, search and product pages.

## M3: Cart, checkout & orders
**Goal:** The full retail purchase flow with local and global payments (test mode).

| Task | Stories |
|---|---|
| Cart (guest cookie + user; merge on login), grouped by seller, cart drawer, all costs shown, coupons | CUS-07, CUS-17 |
| Checkout: linear 4 steps, guest-first, ≤ 12 fields, address book | CUS-08, CUS-12 (addresses) |
| Delivery: shipping zones, doorstep vs **pickup station** picker, fees and ETA per seller sub-order | CUS-09 |
| Payments: Stripe (USD) + Paystack (GHS/NGN, card + MoMo) test mode, **pay on delivery**; signature-verified idempotent webhooks; stock reservation | CUS-10 |
| Order creation → seller sub-orders; confirmation page; order history + tracking timeline | CUS-13 |
| Write/edit reviews after delivery (verified purchase only) | CUS-06 |
| Notifications: in-app bell + transactional emails (order placed/shipped) | PLT-02 |
| Cron: price-drop alerts (in-app + email), housekeeping (reservations, price snapshots) | CUS-18 (part 2) |

**Acceptance:** E2E test passes for search → product → cart → checkout (Paystack MoMo test, Stripe test card, and POD) → confirmation → tracking. A delivered order enables a review. A price drop triggers an alert.

## M4: B2B sourcing & messaging
**Goal:** The Alibaba half: business accounts, RFQs, quotes, samples and negotiation.

| Task | Stories |
|---|---|
| Business account upgrade form + status; Business badge | B2B-01 |
| Post RFQ (specs, qty, target price, deadline, attachments); My RFQs | B2B-04 |
| Quote comparison table (best value highlighted per column; mobile cards); accept → order at quoted price; decline | B2B-05 |
| Sample orders (sample price, max qty, bypass MOQ) | B2B-06 |
| Messaging: threads from product, seller, RFQ or quote; unread badges; attachments | CUS-19, B2B-07 |
| Notifications for quotes received and new messages | PLT-02 |

**Acceptance:** E2E test passes: business buyer posts an RFQ → seller quotes (seeded or live) → buyer compares, messages and accepts → order is created at the quoted price. A sample order bypasses MOQ.

## M5: Seller Centre
**Goal:** Sellers can run their shop.

| Task | Stories |
|---|---|
| Seller application flow (pending until the admin approves) | SEL-01 |
| Dashboard KPIs + sales chart, to-fulfil list, matching RFQs, low stock | SEL-02 |
| Product editor (tabs: basics, media via Cloudinary with required alt text, variants & stock, pricing & tiers, B2B options, shipping, SEO); drafts/publish | SEL-03 |
| Inventory table with inline and bulk edit | SEL-04 |
| Orders: list/filter, status updates with tracking no., printable packing slip | SEL-05 |
| RFQ inbox + quote form | SEL-06 |
| Messages inbox | SEL-07 |
| Storefront editor | SEL-08 |

**Acceptance:** E2E test passes: seller creates a product with variants and tiers → it appears in search → a buyer orders it → the seller ships it with a tracking no. → the buyer sees an updated timeline.

## M6: Admin
**Goal:** The operator console.

| Task | Stories |
|---|---|
| Dashboard: GMV, orders, AOV, users, sellers; charts by day/category/country/payment method; top products and sellers | ADM-01 |
| Approval queues: sellers, business verifications, flagged products, reported reviews | ADM-02, ADM-03, ADM-04, ADM-08 |
| Catalogue: product search/edit/unpublish/feature; category tree editor (drag and drop) + attributes | ADM-04, ADM-05 |
| Orders: search, detail, status change, refund (test mode) | ADM-06 |
| Users: search, role change, disable | ADM-07 |
| Promotions: coupons, flash-deal scheduler, banners | ADM-09 |
| Settings: currency rates, shipping zones, pickup stations, POD per region, commission | ADM-10 |
| Reset demo data | PLT-01 |

**Acceptance:** E2E test passes: the admin approves a pending seller, schedules a flash deal (shown on home), refunds an order, and hides a reported review. Non-admins get 403 on every admin route and action (tested).

## M7: MVP hardening
**Goal:** Ready for Stage 5 testing and a client demo.

| Task |
|---|
| Accessibility sweep (axe on all key pages; keyboard walkthrough; screen-reader labels) |
| Performance: image sizes, caching/ISR, bundle checks; Lighthouse CI budgets |
| Security pass: authz test matrix, rate limits, upload checks, headers (CSP, HSTS), secrets scan |
| Empty, error and loading states; 404/500 pages; privacy, terms and cookie consent pages |
| README + demo script (a 5-minute walkthrough for clients) |

**Acceptance:** All Must stories are demonstrable. CI is green. Lighthouse and axe targets from the PRD are met on key pages. Then **Stage 5** (formal test plan) begins.

---

## After the MVP (Should items, only with your go-ahead)
Returns (CUS-20), recently viewed (CUS-21), Protected Order disputes (CUS-22, ADM-11), quote PDFs (B2B-08), seller coupons (SEL-09), review replies (SEL-10), audit log (ADM-12), dark mode toggle (PLT-05).

## Milestone order and sizing
| Milestone | Relative size | Depends on |
|---|---|---|
| M1 Foundation | M | — |
| M2 Catalogue | L | M1 |
| M3 Checkout | L | M2 |
| M4 B2B | M | M2 (M3 for accept → order) |
| M5 Seller Centre | L | M1–M3 |
| M6 Admin | M | M1–M3 |
| M7 Hardening | M | all |

## Risks and mitigations
| Risk | Mitigation |
|---|---|
| GitHub push currently blocked (repo not authorised for this session) | Commits are kept locally; push once `ernestquarshie/MarketHub` is added to the session's sources |
| Paystack/Stripe test keys not available yet | Provider interface with a **mock provider** for local dev and E2E; real test keys plugged in via env when you have them |
| Product photography | Prototype photos (AI-generated, in `docs/prototype/images`) seed the catalogue; more can be generated for all ~200 products, or a smaller photographed subset can be reused |
| Scope size (~50 Must stories) | Strict milestone gates; Should items stay out of the MVP |
