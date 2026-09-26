# 01: Reference Site Analysis

**Date:** 2026-09-26 · **Status:** Awaiting approval
**Sites studied:** Amazon, Alibaba.com, Jumia, Etsy, Temu/AliExpress. Also used: Baymard Institute checkout and product-page UX research.
**Rule:** We borrow **patterns only**. No logos, copy, colours or proprietary designs.

---

## 1. Amazon: B2C gold standard
- **IA / navigation:** A dominant search bar with a category scope dropdown, an "All" mega-menu drawer, and an account/orders/cart cluster at the top right. Pages are search-first; browsing is secondary.
- **Key layouts:** Home is a grid of themed cards ("Keep shopping", "Deals"). The product page has three columns: gallery | title, rating, bullets, variants | a sticky **Buy Box** (price, delivery date, stock, Add to Cart / Buy Now).
- **Signature features:**
  - A delivery-date promise ("Arrives Tue") shown up front.
  - Customer reviews with a star histogram, verified-purchase badges, photo reviews and an AI review summary.
  - "Frequently bought together" and "Customers also viewed".
  - Order tracking and self-serve returns.
  - The AI assistant (now **Alexa for Shopping**, merged with Rufus in May 2026) lives *inside the main search bar*. It offers price tracking with target-price alerts, a one-year price history, and comparison guides.
- **Conversion flow:** Search → product → Buy Now (1-click) or Cart → a single-page checkout with saved address and payment.
- **Visual style:** Dense and utilitarian, with high information density. The strong yellow/orange CTAs are functional rather than pretty.
- **Perf / a11y:** Very fast perceived load (server-rendered, lazy images). Clutter hurts scanning.
- **Borrow:** Buy Box, delivery promise, review system, recommendation rails, order tracking, AI search.
- **Avoid:** Visual clutter, sponsored-result overload, confusing variant selectors.

## 2. Alibaba.com: B2B gold standard
- **IA / navigation:** Search with a Products / Manufacturers toggle, category mega-menu, and prominent "Request for Quotation" and "Trade Assurance" entry points.
- **Key layouts:** The product page shows a **tiered price table** (e.g. 2–99 pcs $5.20 · 100–499 $4.80 · 500+ $4.30), MOQ, lead time, customization options, and a supplier card (years on platform, response rate, verified badge). "Contact supplier" and "Start order" sit side by side.
- **Signature features:**
  - **Trade Assurance:** escrow-style payment protection until delivery is confirmed.
  - **Verified Supplier** badges backed by third-party inspection.
  - **RFQ:** post one request and get quotes from many suppliers.
  - Samples, integrated **buyer ↔ supplier messaging** with an audit trail.
  - AI sourcing agent (Accio).
  - "Ready-to-Ship" items with low MOQs (1–50).
- **Conversion flow:** Search → compare suppliers → message / RFQ → negotiate → order with protection.
- **Visual style:** Orange accent, card-heavy, supplier-centric.
- **Borrow:** Tiered pricing table, MOQ, RFQ board, supplier trust profile, messaging, order protection concept, "Ready-to-Ship" filter.
- **Avoid:** Slow, cluttered pages and hard-to-compare quotes; rebuild those as a clean comparison table.

## 3. Jumia: African marketplace realities
- **IA / navigation:** Category sidebar on the home page, **Flash Sales** with countdown, and "Official Stores".
- **Signature features:**
  - **Pickup stations** (cheaper than doorstep delivery). Jumia Ghana and Nigeria run pickup-station networks.
  - **Cash on delivery** and mobile money alongside cards (JumiaPay).
  - J-Force agents who order on behalf of customers.
  - Clear delivery fees by region.
- **Conversion flow:** Browse deals → cart → choose **doorstep vs pickup station** → choose payment method (including pay on delivery).
- **Visual style:** Bright orange, deal-heavy, banner-driven.
- **Borrow:** Pickup-station delivery option, **mobile money + pay on delivery** at checkout, region-based shipping fees, flash-sale module, "Official Store" badge.
- **Avoid:** Banner overload and low-quality product imagery.

## 4. Etsy: seller identity and discovery
- **Signature features:**
  - Rich **seller shop pages** (banner, story, policies, shop reviews).
  - "Star Seller" badge.
  - Favourites / collections.
  - Clean, image-first product page with "Other items from this shop".
  - Message-the-seller.
  - Gift options.
- **Visual style:** Airy, generous whitespace, warm typography. The most *pleasant* of the five.
- **Borrow:** Seller storefront page, seller badges, favourites/collections, calm visual style for the product page.
- **Avoid:** Weak search relevance and an inconsistent listing quality.

## 5. Temu / AliExpress: deal-driven discovery
- **Signature features:**
  - Flash deals with countdowns.
  - "Bundle & save".
  - Infinite discovery feed ("You may also like").
  - Coupons at checkout.
  - Price-drop alerts.
  - Social proof ("1.2k sold").
  - Buyer protection messaging.
- **Borrow (sparingly):** "X sold" social proof, coupon codes, flash deals, infinite recommendation feed.
- **Avoid:** Dark patterns (spin-to-win games, fake urgency, pre-checked add-ons, nagging pop-ups). They damage trust and accessibility, which is wrong for a portfolio piece.

## 6. Cross-cutting UX research (Baymard)
- Average cart abandonment is **~70%**. The top causes are unexpected extra costs (39%), forced account creation (19%), a long or complex checkout (18%) and missing payment methods (10%).
- Therefore: **guest checkout as the primary option**, all costs shown in the cart, **≈12 form fields** instead of the ~20 average, a linear checkout, inline validation that keeps entered data, and local payment methods.

---

## 7. "Best of" synthesis

| # | Feature | Source | Decision |
|---|---|---|---|
| 1 | Search-first header with category scope + autocomplete | Amazon | **Adopt** |
| 2 | Products / Suppliers search toggle | Alibaba | **Adopt** |
| 3 | Faceted filters (price, rating, brand, MOQ, Ready-to-Ship, location) | Amazon + Alibaba | **Adopt** |
| 4 | Product page Buy Box with delivery-date promise | Amazon | **Adopt** |
| 5 | Tiered bulk price table + MOQ on product page | Alibaba | **Adopt** |
| 6 | Retail/Business mode (B2B pricing shown to business accounts) | Amazon Business + Alibaba | **Adapt** (one catalogue, two views) |
| 7 | Request for Quotation (RFQ) board + quote comparison | Alibaba | **Adapt** (cleaner comparison table) |
| 8 | Buyer ↔ seller messaging | Alibaba + Etsy | **Adopt** |
| 9 | Order protection (escrow-style status, demo only) | Alibaba Trade Assurance | **Adapt** ("Protected Order" badge + dispute flow, simulated) |
| 10 | Verified / Star seller badges + supplier trust card | Alibaba + Etsy | **Adopt** |
| 11 | Seller storefront pages | Etsy | **Adopt** |
| 12 | Reviews: histogram, verified purchase, photos, helpful votes | Amazon | **Adopt** |
| 13 | AI review summary | Amazon | **Could** (templated summary in v1) |
| 14 | Recommendations: "Frequently bought together", "Also viewed" | Amazon | **Adopt** (rule-based) |
| 15 | Wishlist / favourites | Etsy + Amazon | **Adopt** |
| 16 | Price-drop alerts + price history | Amazon / Temu | **Could** |
| 17 | AI shopping assistant in search | Amazon | **Future** |
| 18 | Flash deals with honest countdown | Jumia / Temu | **Adopt** |
| 19 | Coupons / promo codes | Temu | **Adopt** |
| 20 | "X sold" social proof (real data only) | Temu / AliExpress | **Adapt** |
| 21 | Pickup station vs doorstep delivery | Jumia | **Adopt** |
| 22 | Paystack (cards + mobile money) + Stripe, pay on delivery | Jumia + brief | **Adopt** (test mode) |
| 23 | Multi-currency display (GHS / NGN / USD) | Brief | **Adopt** |
| 24 | Guest checkout, all costs in cart, short linear checkout | Baymard | **Adopt** |
| 25 | Order tracking timeline + self-serve returns | Amazon | **Adopt** (returns = Should) |
| 26 | Sample orders | Alibaba | **Could** |
| 27 | Sales agent ordering (J-Force) | Jumia | **Skip** |
| 28 | Gamified spin-to-win, fake urgency, pre-checked add-ons | Temu | **Skip** (dark patterns) |
| 29 | Dense ad-heavy layout | Amazon | **Skip**: use Etsy-like calm visuals with Amazon-like density only where it helps |

## 8. Resulting product principles
1. **Search-first, trust-heavy:** clear prices, real badges, protected orders.
2. **One catalogue, two modes:** Retail and Business pricing on the same product.
3. **Local and global:** mobile money, pickup stations and multi-currency sit alongside Stripe.
4. **Calm, premium visuals:** Etsy's whitespace with Amazon's information hierarchy.
5. **No dark patterns.** Accessible (WCAG 2.2 AA) by default.

## Sources
- [Amazon unifies Alexa+ and Rufus (GeekWire, 2026)](https://www.geekwire.com/2026/amazon-unifies-alexa-and-rufus-as-ai-rivals-move-into-online-shopping/)
- [Amazon Rufus personalised features (About Amazon)](https://www.aboutamazon.com/news/retail/amazon-rufus-ai-assistant-personalized-shopping-features)
- [Alibaba.com global influence guide 2026 (Alibaba Seller Blog)](https://seller.alibaba.com/blogs/2026/global/b2b-ecommerce/alibaba-com-global-influence-guide-2026)
- [Alibaba RFQ (Alibaba.com)](https://www.alibaba.com/supplier/rfq-on-alibaba.html)
- [Jumia overview (Pattern)](https://www.pattern.com/blog/everything-you-need-to-know-about-african-marketplace-jumia)
- [Jumia Ghana pick-up stations](https://www.jumia.com.gh/sp-pickups/)
- [Checkout flow UX (Baymard)](https://baymard.com/blog/checkout-flow-ux-optimization)
- [Product page UX 2026 (Baymard)](https://baymard.com/blog/current-state-ecommerce-product-page-ux)
