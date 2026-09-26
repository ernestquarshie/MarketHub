# 02: Requirements (PRD)

**Product:** MarketHub (working name): a multi-vendor B2C + B2B marketplace
**Date:** 2026-09-26 · **Status:** Awaiting approval
**Inputs:** [00-brief.md](00-brief.md), [01-references.md](01-references.md)

---

## 1. Goals and success metrics
This is a portfolio/demo build, so "success" means clients can see production-grade quality.

| Goal | Metric (target) |
|---|---|
| Looks and feels professional | Lighthouse Performance ≥ 90 (mobile) and Accessibility / SEO / Best Practices ≥ 95 on key pages |
| Every critical flow works end to end | 100% pass on Playwright E2E: retail purchase, B2B RFQ → quote → order, seller listing, admin moderation |
| Accessible | 0 critical/serious axe violations; WCAG 2.2 AA |
| Fast | LCP < 2.5 s, INP < 200 ms, CLS < 0.1 on 4G mobile |
| Easy to demo | One-click demo logins for all 4 roles; realistic seeded data; the database can be reset |
| Credible engineering | Typed codebase, CI green (lint, typecheck, tests), documented README |

## 2. Personas
1. **Ama (retail shopper, Accra):** Shops on mobile and pays with MoMo. Wants trustworthy sellers, clear delivery fees and pickup-station delivery.
2. **David (retail shopper, London):** Pays by card in USD/GBP. Expects Amazon-level speed, reviews and a delivery-date promise.
3. **Chidi (business buyer, Lagos, owns a phone-accessory shop):** Buys in bulk. Needs tiered pricing, MOQ, samples, and quotes from multiple suppliers.
4. **Mei (seller/supplier, a manufacturer):** Sells retail and wholesale. Needs easy listing, inventory, order handling, and answers to RFQs and messages.
5. **Ern (platform admin):** Approves sellers, moderates content, manages categories and promos, and watches sales analytics.

## 3. Roles
`guest` · `customer` (retail) · `business buyer` (a customer with a verified business profile) · `seller` · `admin`

---

## 4. User stories (MoSCoW)
**IDs:** CUS = customer storefront · B2B = business · SEL = seller · ADM = admin · PLT = platform.
**AC** = acceptance criteria.

### 4.1 Customer storefront

| ID | Priority | Story | Acceptance criteria |
|---|---|---|---|
| CUS-01 | **Must** | As a shopper I can browse the home page with categories, deals and recommendation rails | Hero/promo banner; category grid; Flash Deals rail with an honest countdown; "Recommended" and "Top sellers" rails; loads in < 2.5 s LCP |
| CUS-02 | **Must** | Search with autocomplete | Suggestions (products, categories, suppliers) after 2 chars; typo-tolerant; Products/Suppliers toggle; the result count is shown |
| CUS-03 | **Must** | Filter and sort results | Facets: category, price range, rating, brand, seller location, Ready-to-Ship, MOQ ≤ X, in stock. Sort: relevance, price ↑↓, rating, newest, best-selling. Filters are kept in the URL (shareable) |
| CUS-04 | **Must** | View a product detail page | Gallery with zoom; title, rating, "X sold"; variant selector (size/colour) with stock per variant; Buy Box with price in the selected currency, delivery estimate, stock, qty, Add to Cart, Buy Now; description and specs; seller card; reviews |
| CUS-05 | **Must** | Read and filter reviews | Star histogram; filter by stars; "verified purchase" badge; photos; sort by most helpful or newest; helpful vote |
| CUS-06 | **Must** | Write a review after delivery | Only buyers of a delivered order can review; 1–5 stars, text, up to 4 photos; editable for 30 days |
| CUS-07 | **Must** | Cart | Add, update qty, remove; grouped by seller; shipping, tax, discounts and total visible **in the cart**; kept for guests (cookie) and merged when logging in |
| CUS-08 | **Must** | Guest or account checkout | Guest checkout is the primary option; linear steps (Address → Delivery → Payment → Review); ≤ 12 fields; inline validation that keeps entered data |
| CUS-09 | **Must** | Choose delivery method | Doorstep or **pickup station** (pickup stations listed by region); fee and ETA per option |
| CUS-10 | **Must** | Pay with local or global methods (test mode) | Paystack (card + mobile money) for GHS/NGN; Stripe card for USD; **pay on delivery** option (configurable per region); webhook confirms payment |
| CUS-11 | **Must** | Switch currency | GHS / NGN / USD selector; prices converted with admin-set rates; the currency choice persists |
| CUS-12 | **Must** | Account: sign up, log in, profile, address book | Email + password and "Continue with Google"; password reset; multiple addresses |
| CUS-13 | **Must** | Order history and tracking | Order list; detail page with a status timeline (Placed → Paid → Shipped → Out for delivery / At pickup station → Delivered); per-seller sub-orders |
| CUS-14 | **Must** | Wishlist / favourites | Heart on any product card; wishlist page; move to cart |
| CUS-15 | **Must** | Seller storefront page | Banner, logo, story, badges (Verified, Star Seller), ratings, products with search, policies |
| CUS-16 | **Must** | Recommendations | "Frequently bought together" (co-purchase), "Customers also viewed", "More from this seller"; rule-based |
| CUS-17 | **Must** | Coupons | Apply a code in the cart; validation (expiry, minimum spend, seller- or platform-wide); the discount is shown line by line |
| CUS-18 | **Must** | Price-drop alerts + price history *(promoted)* | "Watch price" with an optional target price; an in-app + email notification when the price ≤ target; a 12-month price-history chart on the product page |
| CUS-19 | **Must** | Message a seller | From the product or seller page; threaded conversation; product context attached; unread badge |
| CUS-20 | **Should** | Returns / refund request | Request a return within the seller's window; reason + photos; status tracked; the seller approves or rejects |
| CUS-21 | **Should** | Recently viewed | Last 20 products, on the home page and in the account area |
| CUS-22 | **Should** | Protected Order and disputes | "Protected Order" badge; the buyer can open a dispute before confirming receipt; admin resolves it (simulated escrow status) |
| CUS-23 | **Could** | Templated AI-style review summary | "Customers say…" built from review keywords |
| CUS-24 | **Could** | Product comparison (up to 4) | Side-by-side specs table |

### 4.2 B2B (business buyers)

| ID | Priority | Story | Acceptance criteria |
|---|---|---|---|
| B2B-01 | **Must** | Upgrade to a Business account | Business name, registration no., country, industry; the admin verifies it; a "Business" badge appears |
| B2B-02 | **Must** | See tiered bulk pricing and MOQ | The product page shows a tier table (e.g. 1–9 / 10–99 / 100+); the price updates live with qty; qty below MOQ is blocked with a message; retail users see retail price plus "Business pricing available" |
| B2B-03 | **Must** | Filter by MOQ, Ready-to-Ship, supplier location, verified supplier | These facets are available in search |
| B2B-04 | **Must** | Post an RFQ | Product/category, specs, qty, target price, currency, delivery country, deadline, attachments; visible to matching sellers |
| B2B-05 | **Must** | Receive and compare quotes | Quote list per RFQ in a **comparison table** (unit price, total, MOQ, lead time, shipping, seller rating, verified); accept one → it converts to an order at the quoted price |
| B2B-06 | **Must** | Order samples *(promoted)* | "Order sample" button where the seller enables samples; sample price, max 1–3 units, bypasses MOQ; tracked as a normal order |
| B2B-07 | **Must** | Negotiate by messaging | The same messaging as CUS-19, and it can attach an RFQ or quote |
| B2B-08 | **Should** | Pro-forma invoice / quote PDF | Download a PDF of an accepted quote/order |
| B2B-09 | **Could** | Reorder in one click | Past bulk order → cart at current tier prices |

### 4.3 Seller centre

| ID | Priority | Story | Acceptance criteria |
|---|---|---|---|
| SEL-01 | **Must** | Apply to become a seller | Store name, contact, business details, payout info (placeholder); status Pending until the admin approves |
| SEL-02 | **Must** | Seller dashboard | KPIs: sales (7/30 days), orders to fulfil, open RFQs, unread messages, low-stock alerts; sales chart |
| SEL-03 | **Must** | Create and edit products | Title, category, description (rich text), images (up to 8, drag to reorder), variants (options + SKU + stock + price), retail price, **tier pricing**, MOQ, lead time, sample enabled + price, Ready-to-Ship, shipping weight; draft or publish |
| SEL-04 | **Must** | Manage inventory | Stock per variant; low-stock threshold; bulk edit stock/price in a table |
| SEL-05 | **Must** | Manage orders | List + filters; update status (Processing → Shipped with tracking no. → Delivered); print a packing slip |
| SEL-06 | **Must** | Respond to RFQs | See matching RFQs; submit a quote (unit price, MOQ, lead time, shipping, validity, note) |
| SEL-07 | **Must** | Messages inbox | Same threads as the buyer side |
| SEL-08 | **Must** | Edit storefront | Banner, logo, story, policies (shipping, returns) |
| SEL-09 | **Should** | Seller coupons | Create store-level coupons |
| SEL-10 | **Should** | Reply to reviews | One public reply per review |
| SEL-11 | **Could** | Bulk CSV product import | Upload CSV → preview → import |

### 4.4 Admin

| ID | Priority | Story | Acceptance criteria |
|---|---|---|---|
| ADM-01 | **Must** | Admin dashboard | GMV, orders, AOV, conversion proxy, new users, new sellers; charts by day/category/country; top products and sellers |
| ADM-02 | **Must** | Manage sellers | Approve/reject applications; suspend; toggle Verified and Star Seller badges; view seller performance |
| ADM-03 | **Must** | Manage business buyer verification | Approve or reject business accounts |
| ADM-04 | **Must** | Manage products | Search all products; unpublish or feature; edit any product; flagged-products queue |
| ADM-05 | **Must** | Manage categories | Tree CRUD (3 levels); attributes per category (used by facets); icons/images |
| ADM-06 | **Must** | Manage orders | Search/filter all orders; view detail; change status; refund (test mode) |
| ADM-07 | **Must** | Manage users | Search; view; change role; disable account |
| ADM-08 | **Must** | Moderate reviews | Queue of reported reviews; hide/restore |
| ADM-09 | **Must** | Promotions | Platform coupons; flash-deal scheduling (product, deal price, start/end); home-page banners |
| ADM-10 | **Must** | Settings | Currency rates, shipping zones and fees, pickup stations, pay-on-delivery toggle per region, commission % (display only) |
| ADM-11 | **Should** | Disputes | Resolve Protected Order disputes (refund buyer / release to seller) |
| ADM-12 | **Should** | Audit log | Log of admin actions (who, what, when) |
| ADM-13 | **Could** | CSV exports | Orders, users, products |

### 4.5 Platform

| ID | Priority | Story | Acceptance criteria |
|---|---|---|---|
| PLT-01 | **Must** | Demo mode | A "Try as…" switcher for shopper / business / seller / admin; banner saying payments are in test mode; admin can reset the database to seed data |
| PLT-02 | **Must** | Notifications | In-app bell + transactional emails (order placed/shipped, quote received, price drop, message), sent via a dev mail catcher or Resend free tier |
| PLT-03 | **Must** | Responsive and accessible | Mobile-first; 375 / 768 / 1280 px; keyboard navigable; WCAG 2.2 AA |
| PLT-04 | **Must** | SEO | SSR/SSG pages; unique titles and meta; Product + Review + Breadcrumb JSON-LD; sitemap.xml; robots.txt; clean URLs (`/p/[slug]`, `/c/[slug]`, `/store/[slug]`) |
| PLT-05 | **Should** | Dark mode | Follows the system setting, with a toggle |
| PLT-06 | **Could** | PWA install | Manifest + offline fallback page |

---

## 5. MVP cut
**MVP = all Must items above** (the customer storefront, B2B, seller centre, admin and platform essentials, plus the two promoted items: price alerts/history and sample orders).
Should items are worked on after the MVP is accepted. Could items go in the backlog.

> ⚠️ Scope note: this MVP is large (≈50 Must stories). It will be delivered in milestones (see the Stage 4 build plan). Each milestone is demoable on its own.

## 6. Sitemap

```
Storefront
├── /                         Home
├── /search?q=&filters        Search results (Products | Suppliers)
├── /c/[category]             Category listing
├── /p/[product-slug]         Product detail
├── /store/[seller-slug]      Seller storefront
├── /deals                    Flash deals
├── /cart                     Cart
├── /checkout                 Checkout (address → delivery → payment → review)
├── /order/[id]/confirmation  Order confirmation
├── /rfq/new                  Post RFQ
├── /login  /register  /forgot-password
└── /account
    ├── /orders  /orders/[id]       Orders + tracking
    ├── /wishlist
    ├── /price-alerts
    ├── /messages  /messages/[thread]
    ├── /rfqs  /rfqs/[id]           My RFQs + quote comparison
    ├── /addresses  /profile
    ├── /business                   Business account upgrade
    └── /returns                    (Should)

Seller Centre  (/seller)
├── /seller/apply
├── /seller                 Dashboard
├── /seller/products  /new  /[id]
├── /seller/inventory
├── /seller/orders  /[id]
├── /seller/rfqs  /[id]
├── /seller/messages
└── /seller/store           Storefront settings

Admin  (/admin)
├── /admin                  Dashboard / analytics
├── /admin/sellers  /admin/business-verifications
├── /admin/products  /admin/categories
├── /admin/orders  /admin/users  /admin/reviews
├── /admin/promotions       Coupons, flash deals, banners
└── /admin/settings         Currencies, shipping zones, pickup stations, payments

System: /sitemap.xml  /robots.txt  /api/*  /api/webhooks/{stripe,paystack}
```

## 7. Non-functional requirements
- **Performance:** LCP < 2.5 s, INP < 200 ms, CLS < 0.1 (mobile 4G). JS < 200 KB gzip per storefront route. Images via a CDN in AVIF/WebP with responsive sizes. Server-rendered catalogue pages with caching.
- **Accessibility:** WCAG 2.2 AA. Semantic landmarks, labels, visible focus, 4.5:1 contrast, targets ≥ 24 px, reduced-motion support, alt text required on product images (enforced in the seller form), accessible carousels (pausable, keyboard operable), and the countdown is not announced every second.
- **SEO:** See PLT-04. Canonical URLs for faceted pages; noindex on the cart, checkout and account pages.
- **Security:**
  - Server-side authorization on every route and action (role + ownership checks).
  - Input validation (Zod) on all inputs; parameterised queries (ORM); CSRF protection.
  - Rate limiting on auth, search and messaging.
  - Bcrypt/argon2 passwords; secure HTTP-only cookies.
  - Signature-verified payment webhooks.
  - No secrets in the repo (`.env.example` only).
  - File uploads are type- and size-checked.
- **Privacy / GDPR (and Ghana DPA / Nigeria NDPA):** Cookie consent for non-essential cookies; privacy policy and terms pages; the user can export or delete their account; minimal personal data; no real payment data stored (the provider tokenises it).
- **Reliability:** Idempotent order creation and payment webhooks; stock reserved at checkout and decremented on payment.
- **Browsers / devices:** The last 2 versions of Chrome, Edge, Firefox and Safari; iOS Safari 16+; Android Chrome. Breakpoints 375 / 768 / 1280.
- **Maintainability:** TypeScript strict; lint + format; CI; unit/integration/E2E tests; README with local setup in ≤ 5 commands.

## 8. Out of scope (v1)
- Real money movement, real seller payouts, KYC and tax filing.
- Native mobile apps.
- Real logistics / carrier API integrations (tracking numbers are entered manually).
- Multi-language translations (the structure is i18n-ready; English only).
- Live chat with support staff, and video calls.
- Advertising / sponsored listings.

## 9. Future ideas (backlog)
- AI shopping assistant in the search bar (natural-language queries, comparisons)
- AI-generated review summaries (replacing the templated version)
- Sponsored listings / seller ads
- Subscribe & Save for repeat purchases
- Third-party inspection booking for B2B orders
- Real carrier integrations (DHL, GIG Logistics) and live tracking
- Seller payouts via Paystack Split / Stripe Connect
- Loyalty points / membership programme
- Multi-language (French for West Africa, Chinese for suppliers)
- Live-stream shopping
- Native apps (React Native / Expo)
