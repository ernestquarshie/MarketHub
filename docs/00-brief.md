# 00 — Discovery Brief

**Project:** Ecommerce Webapp (working name: **MarketHub**, placeholder until a brand is chosen)
**Owner:** Ern
**Date:** 2026-09-26
**Status:** Awaiting approval

## 1. Purpose
A professional multi-vendor marketplace that takes the best of Amazon (a retail shopping experience built on trust, fast search, reviews and a one-click-style checkout) and Alibaba (B2B sourcing with bulk pricing, MOQs, request-for-quote and supplier messaging), and adds standout patterns from other top ecommerce sites.

## 2. Type
**Marketplace:** multi-vendor, **B2C and B2B** on one platform.

## 3. Audiences and primary actions
| Audience | Who they are | #1 action |
|---|---|---|
| Retail shopper (B2C) | Individual buying single items | **Buy** (search → product → cart → checkout) |
| Business buyer (B2B) | SME or reseller sourcing in bulk | **Request a quote** or buy at tiered bulk pricing |
| Seller / supplier | A vendor listing products | **List products** and fulfil orders |
| Platform admin | The operator (Ern / client) | **Moderate and manage** catalogue, sellers, orders and users |

## 4. Goal and constraints
- **Goal:** A **portfolio/demo** showcase for prospective clients. It must look production-grade and be fully clickable end to end.
- **Payments:** **Test mode only.** No real money moves.
- **Budget:** Free or low-cost tiers for hosting and database.
- **Deadline:** Not specified (assumed flexible, delivered milestone by milestone).
- **Traffic:** Demo-level, but the architecture should be credible at scale.

## 5. Market, currencies and payments
- **Markets:** Africa (Ghana / West Africa first) **and** global.
- **Currencies:** GHS, NGN and USD at minimum, with multi-currency price display.
- **Payment providers (test mode):** **Paystack** (cards + mobile money) for African buyers, **Stripe** for global card payments.
- **Language:** English (i18n-ready structure, no translations in v1).

## 6. Must-haves (v1)
- **Customer storefront:** home, category browse, search with facets, product detail, cart, checkout, account, orders, wishlist.
- **Search, filters and reviews:** faceted search, ratings and reviews, recommendations.
- **Payments and checkout:** guest and account checkout, order tracking, test-mode Stripe and Paystack.
- **B2B tools:** tiered bulk pricing, MOQ, request-for-quote (RFQ), buyer ↔ seller messaging.
- **Seller centre:** product listings, inventory, orders, quotes.
- **Admin dashboard:** products, categories, orders, users, sellers (approval), reviews moderation, sales analytics.

## 7. Ownership and maintenance
- Maintained by **Ern** (technical; builds web apps for clients).
- Content (products, banners) is managed through the admin and seller dashboards, so no external CMS is needed.
- The code must be clean and documented, because it doubles as a portfolio piece that clients may inspect.

## 8. Assumptions (please confirm)
1. The working name "MarketHub" and a neutral brand are fine for now. No existing logo or domain.
2. Seeded demo data (≈10 sellers, ≈200 products, reviews, orders) is used so every page looks alive.
3. Demo logins will be provided for each role (shopper, business buyer, seller, admin).
4. Code lives in this session's workspace as a git repo. It can be pushed to your GitHub and/or copied to a folder on your computer.
