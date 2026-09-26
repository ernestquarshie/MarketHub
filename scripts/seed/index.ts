/**
 * Resets the database and loads the MarketHub demo dataset.
 *   pnpm db:seed
 * Deterministic: the same data every run (seeded PRNG), with dates relative to "now".
 */
import "dotenv/config";
import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { db, schema as s } from "../../src/server/db";
import { convert, toMinor, type Currency } from "../../src/lib/money";
import { slugify } from "../../src/lib/utils";
import {
  CATEGORIES as BASE_CATEGORIES,
  DEMO_PASSWORD,
  DEMO_USERS,
  PRODUCTS as BASE_PRODUCTS,
  REVIEWER_NAMES,
  REVIEW_TEMPLATES,
  SELLERS as BASE_SELLERS,
} from "./data";
import { MORE_CATEGORIES, MORE_PRODUCTS, MORE_SELLERS } from "./data-more";

const SELLERS = [...BASE_SELLERS, ...MORE_SELLERS];
const PRODUCTS = [...BASE_PRODUCTS, ...MORE_PRODUCTS];
const CATEGORIES = BASE_CATEGORIES.map((c) => ({
  ...c,
  children: [...c.children, ...(MORE_CATEGORIES[c.slug] ?? []).map((x) => ({ ...x, attributes: undefined }))],
}));

// ---------------------------------------------------------------------------
// Deterministic helpers
// ---------------------------------------------------------------------------
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260926);
const int = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;
const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)]!;
const daysAgo = (d: number, h = 0) => new Date(Date.now() - d * 86_400_000 - h * 3_600_000);
const hoursFromNow = (h: number) => new Date(Date.now() + h * 3_600_000);
const img = (key: string) => `/images/products/${key}.jpg`;
const RATES = { USD: 1, GHS: 15.2, NGN: 1580 } as const;

async function reset() {
  const tables = await db.execute<{ tablename: string }>(
    sql`select tablename from pg_tables where schemaname = 'public' and tablename not like '__drizzle%'`,
  );
  const names = tables.map((t) => `"${t.tablename}"`).join(", ");
  if (names) await db.execute(sql.raw(`TRUNCATE ${names} RESTART IDENTITY CASCADE`));
}

async function main() {
  const started = Date.now();
  console.log("Resetting database…");
  await reset();

  // --- Platform settings ---------------------------------------------------
  await db.insert(s.currencyRate).values([
    { code: "USD", perUsd: RATES.USD },
    { code: "GHS", perUsd: RATES.GHS },
    { code: "NGN", perUsd: RATES.NGN },
  ]);
  await db.insert(s.setting).values([
    { key: "commission_percent", value: 8 },
    { key: "free_shipping_threshold", value: { amount: toMinor(250), currency: "GHS" } },
  ]);

  // --- Users ----------------------------------------------------------------
  console.log("Creating users…");
  const passwordHash = await hashPassword(DEMO_PASSWORD);
  const users: Record<string, string> = {};
  async function createUser(opts: {
    name: string;
    email: string;
    role: string;
    isBusiness?: boolean;
    currency?: Currency;
    createdAt?: Date;
  }) {
    const id = randomUUID();
    await db.insert(s.user).values({
      id,
      name: opts.name,
      email: opts.email,
      emailVerified: true,
      role: opts.role,
      isBusiness: opts.isBusiness ?? false,
      preferredCurrency: opts.currency ?? "GHS",
      createdAt: opts.createdAt ?? daysAgo(int(30, 700)),
    });
    await db
      .insert(s.account)
      .values({ id: randomUUID(), accountId: id, providerId: "credential", userId: id, password: passwordHash });
    return id;
  }
  for (const u of DEMO_USERS) {
    users[u.key] = await createUser({
      name: u.name,
      email: u.email,
      role: u.role,
      isBusiness: u.isBusiness,
      currency: u.currency,
    });
  }
  await db.insert(s.businessProfile).values({
    userId: users.business!,
    companyName: "Okafor Phone Accessories Ltd",
    regNumber: "RC-1849203",
    country: "NG",
    industry: "Retail — electronics",
    status: "verified",
    reviewedBy: users.admin,
    reviewedAt: daysAgo(40),
  });
  // A pending business verification for the admin queue
  const pendingBiz = await createUser({ name: "Selorm Agbeko", email: "selorm@demo.markethub.test", role: "customer" });
  await db.insert(s.businessProfile).values({
    userId: pendingBiz,
    companyName: "Agbeko Supplies",
    regNumber: "CS-220019",
    country: "GH",
    industry: "Hospitality",
    status: "pending",
  });

  const reviewerIds: string[] = [];
  for (const [i, name] of REVIEWER_NAMES.entries()) {
    reviewerIds.push(
      await createUser({
        name: name.replace(".", ""),
        email: `reviewer${i + 1}@demo.markethub.test`,
        role: "customer",
      }),
    );
  }

  await db.insert(s.address).values([
    {
      userId: users.shopper!,
      fullName: "Ama Mensah",
      phone: "+233 24 555 0142",
      country: "GH",
      region: "Greater Accra",
      city: "Accra",
      line1: "12 Oxford Street, Osu",
      isDefault: true,
    },
    {
      userId: users.business!,
      fullName: "Chidi Okafor",
      phone: "+234 803 555 0199",
      country: "NG",
      region: "Lagos",
      city: "Ikeja",
      line1: "8 Allen Avenue",
      isDefault: true,
    },
  ]);

  // --- Sellers -----------------------------------------------------------------
  console.log("Creating sellers…");
  const sellers: Record<string, { id: string; currency: Currency }> = {};
  for (const sd of SELLERS) {
    const ownerId =
      sd.key === "volthub"
        ? users.seller!
        : await createUser({
            name: sd.owner,
            email: `${sd.key}@demo.markethub.test`,
            role: sd.status === "approved" ? "seller" : "customer",
          });
    const [row] = await db
      .insert(s.seller)
      .values({
        userId: ownerId,
        slug: slugify(sd.name),
        name: sd.name,
        story: sd.story,
        country: sd.country,
        city: sd.city,
        status: sd.status,
        isVerified: sd.verified,
        isStarSeller: sd.star,
        baseCurrency: sd.currency,
        responseRate: sd.response,
        onTimeRate: sd.onTime,
        joinedAt: daysAgo(sd.years * 365 + int(10, 200)),
        policies: {
          shipping: "Orders ship within 1–2 business days. Bulk orders ship according to the stated lead time.",
          returns: "Unused items in original packaging can be returned within 7 days of delivery.",
        },
      })
      .returning({ id: s.seller.id });
    sellers[sd.key] = { id: row!.id, currency: sd.currency };
  }

  // --- Categories ----------------------------------------------------------------
  console.log("Creating categories…");
  const categoryIds: Record<string, string> = {};
  const attributeIds: Record<string, Record<string, string>> = {};
  for (const [i, c] of CATEGORIES.entries()) {
    const [top] = await db
      .insert(s.category)
      .values({ slug: c.slug, name: c.name, imageUrl: img(c.image), sortOrder: i })
      .returning({ id: s.category.id });
    categoryIds[c.slug] = top!.id;
    for (const [j, child] of c.children.entries()) {
      const [row] = await db
        .insert(s.category)
        .values({ slug: child.slug, name: child.name, parentId: top!.id, sortOrder: j })
        .returning({ id: s.category.id });
      categoryIds[child.slug] = row!.id;
      for (const a of child.attributes ?? []) {
        const [attr] = await db
          .insert(s.categoryAttribute)
          .values({ categoryId: row!.id, key: a.key, label: a.label, options: a.options })
          .returning({ id: s.categoryAttribute.id });
        (attributeIds[child.slug] ??= {})[a.key] = attr!.id;
      }
    }
  }

  // --- Products -------------------------------------------------------------------
  console.log("Creating products…");
  const products: {
    id: string;
    slug: string;
    price: number;
    currency: Currency;
    sellerId: string;
    title: string;
    image: string;
    topic: string;
    variantIds: string[];
  }[] = [];
  for (const p of PRODUCTS) {
    const sellerRef = sellers[p.seller]!;
    const currency = sellerRef.currency;
    const retail = toMinor(p.price);
    const [row] = await db
      .insert(s.product)
      .values({
        sellerId: sellerRef.id,
        categoryId: categoryIds[p.category]!,
        slug: p.slug,
        title: p.title,
        brand: p.brand,
        description: p.description,
        bullets: p.bullets,
        specs: p.specs,
        status: "published",
        currency,
        retailPrice: retail,
        compareAtPrice: p.compareAt ? toMinor(p.compareAt) : null,
        moq: p.moq ?? 1,
        leadTimeDays: p.leadDays ?? 3,
        readyToShip: p.readyToShip ?? true,
        sampleEnabled: p.sample !== undefined,
        samplePrice: p.sample !== undefined ? toMinor(p.sample) : null,
        weightGrams: p.weight,
        soldCount: p.sold,
        isFeatured: p.featured ?? false,
        createdAt: daysAgo(int(20, 400)),
      })
      .returning({ id: s.product.id });
    const productId = row!.id;

    await db.insert(s.productImage).values(
      p.images.map((key, i) => ({
        productId,
        url: img(key),
        alt: `${p.title}${i === 0 ? "" : ` — view ${i + 1}`}`,
        sortOrder: i,
        variantOption: p.variants.find((v) => v.image === key)?.options.Colour ?? null,
      })),
    );

    const variantRows = await db
      .insert(s.productVariant)
      .values(
        p.variants.map((v, i) => ({
          productId,
          sku: `${p.slug.slice(0, 24).toUpperCase()}-${i + 1}`.replace(/[^A-Z0-9-]/g, ""),
          options: v.options,
          priceOverride: v.priceDelta ? retail + toMinor(v.priceDelta) : null,
          stock: v.stock,
        })),
      )
      .returning({ id: s.productVariant.id });

    if (p.tiers?.length) {
      const tiers = p.tiers.map(([minQty, factor], i) => ({
        productId,
        minQty,
        maxQty: p.tiers![i + 1] ? p.tiers![i + 1]![0] - 1 : null,
        unitPrice: Math.round(retail * factor),
      }));
      await db.insert(s.priceTier).values(tiers);
    }

    for (const [key, value] of Object.entries(p.attrs ?? {})) {
      const attributeId = attributeIds[p.category]?.[key];
      if (attributeId) await db.insert(s.productAttributeValue).values({ productId, attributeId, value });
    }

    // 12 months of price history: a gentle random walk ending at today's price.
    const history = [];
    let price = p.compareAt ? toMinor(p.compareAt) : Math.round(retail * 1.1);
    for (let m = 12; m >= 1; m--) {
      history.push({ productId, price, currency, recordedAt: daysAgo(m * 30) });
      const drift = 1 + (rand() - 0.55) * 0.08;
      price = Math.max(Math.round(retail * 0.85), Math.round(price * drift));
    }
    history.push({ productId, price: retail, currency, recordedAt: daysAgo(0, 1) });
    await db.insert(s.priceHistory).values(history);

    products.push({
      id: productId,
      slug: p.slug,
      price: retail,
      currency,
      sellerId: sellerRef.id,
      title: p.title,
      image: img(p.images[0]!),
      topic: p.reviewTopic,
      variantIds: variantRows.map((v) => v.id),
    });
  }

  // --- Reviews ------------------------------------------------------------------------
  console.log("Creating reviews…");
  for (const p of products) {
    const count = p.slug.includes("lagos") ? 0 : int(4, 12);
    const rows = [];
    const used = new Set<string>();
    for (let i = 0; i < count; i++) {
      // Skew toward positive reviews like real marketplaces.
      const t = rand() < 0.7 ? pick(REVIEW_TEMPLATES.filter((r) => r.rating >= 4)) : pick(REVIEW_TEMPLATES);
      let reviewer = pick(reviewerIds);
      while (used.has(reviewer) && used.size < reviewerIds.length) reviewer = pick(reviewerIds);
      used.add(reviewer);
      rows.push({
        productId: p.id,
        userId: reviewer,
        rating: t.rating,
        title: t.title,
        body: t.body.replaceAll("{t}", p.topic),
        helpfulCount: int(0, 40),
        createdAt: daysAgo(int(2, 300)),
      });
    }
    if (rows.length) await db.insert(s.review).values(rows);
  }
  // A reported review for the admin moderation queue
  await db
    .update(s.review)
    .set({ status: "reported" })
    .where(sql`id = (select id from review where rating <= 2 order by created_at limit 1)`);

  await db.execute(sql`
    update product p set
      rating_avg = coalesce(r.avg, 0), rating_count = coalesce(r.cnt, 0)
    from (select product_id, avg(rating)::float as avg, count(*)::int as cnt
          from review where status = 'visible' group by product_id) r
    where r.product_id = p.id`);
  await db.execute(sql`
    update seller sl set rating_avg = coalesce(x.avg, 0), rating_count = coalesce(x.cnt, 0)
    from (select pr.seller_id, avg(rv.rating)::float as avg, count(*)::int as cnt
          from review rv join product pr on pr.id = rv.product_id where rv.status = 'visible' group by pr.seller_id) x
    where x.seller_id = sl.id`);

  // --- Shipping zones & pickup stations ---------------------------------------------
  console.log("Creating shipping zones…");
  const zones = await db
    .insert(s.shippingZone)
    .values([
      {
        name: "Greater Accra",
        country: "GH",
        region: "Greater Accra",
        currency: "GHS",
        doorstepFee: toMinor(25),
        pickupFee: toMinor(10),
        etaDaysMin: 1,
        etaDaysMax: 2,
        podEnabled: true,
      },
      {
        name: "Ashanti",
        country: "GH",
        region: "Ashanti",
        currency: "GHS",
        doorstepFee: toMinor(35),
        pickupFee: toMinor(15),
        etaDaysMin: 2,
        etaDaysMax: 3,
        podEnabled: true,
      },
      {
        name: "Rest of Ghana",
        country: "GH",
        region: null,
        currency: "GHS",
        doorstepFee: toMinor(60),
        pickupFee: toMinor(25),
        etaDaysMin: 3,
        etaDaysMax: 5,
        podEnabled: false,
      },
      {
        name: "Lagos",
        country: "NG",
        region: "Lagos",
        currency: "NGN",
        doorstepFee: toMinor(3500),
        pickupFee: toMinor(1500),
        etaDaysMin: 1,
        etaDaysMax: 3,
        podEnabled: true,
      },
      {
        name: "Abuja (FCT)",
        country: "NG",
        region: "FCT",
        currency: "NGN",
        doorstepFee: toMinor(4500),
        pickupFee: toMinor(2000),
        etaDaysMin: 2,
        etaDaysMax: 4,
        podEnabled: true,
      },
      {
        name: "Rest of Nigeria",
        country: "NG",
        region: null,
        currency: "NGN",
        doorstepFee: toMinor(6000),
        pickupFee: toMinor(3000),
        etaDaysMin: 3,
        etaDaysMax: 6,
        podEnabled: false,
      },
      {
        name: "International",
        country: "US",
        region: null,
        currency: "USD",
        doorstepFee: toMinor(18),
        pickupFee: toMinor(18),
        etaDaysMin: 7,
        etaDaysMax: 14,
        podEnabled: false,
      },
    ])
    .returning({ id: s.shippingZone.id, name: s.shippingZone.name });
  const zoneId = (name: string) => zones.find((z) => z.name === name)!.id;
  const stations = await db
    .insert(s.pickupStation)
    .values([
      {
        zoneId: zoneId("Greater Accra"),
        name: "Accra Mall",
        address: "Accra Mall, Spintex Road, Accra",
        hours: "Mon–Sat 9:00–20:00",
        lat: 5.6225,
        lng: -0.1733,
      },
      {
        zoneId: zoneId("Greater Accra"),
        name: "Osu Oxford Street",
        address: "Oxford Street, Osu, Accra",
        hours: "Mon–Sat 8:00–19:00",
        lat: 5.5571,
        lng: -0.1818,
      },
      {
        zoneId: zoneId("Greater Accra"),
        name: "Tema Community 1",
        address: "Community 1 Market, Tema",
        hours: "Mon–Sat 8:00–18:00",
        lat: 5.6698,
        lng: -0.0166,
      },
      {
        zoneId: zoneId("Greater Accra"),
        name: "Madina Zongo Junction",
        address: "Zongo Junction, Madina",
        hours: "Mon–Sat 8:00–18:00",
        lat: 5.6837,
        lng: -0.1653,
      },
      {
        zoneId: zoneId("Ashanti"),
        name: "Kumasi Adum",
        address: "Prempeh II Street, Adum, Kumasi",
        hours: "Mon–Sat 8:00–18:00",
        lat: 6.6885,
        lng: -1.6244,
      },
      {
        zoneId: zoneId("Ashanti"),
        name: "KNUST Junction",
        address: "KNUST Junction, Kumasi",
        hours: "Mon–Sat 9:00–19:00",
        lat: 6.6745,
        lng: -1.5716,
      },
      {
        zoneId: zoneId("Rest of Ghana"),
        name: "Takoradi Market Circle",
        address: "Market Circle, Takoradi",
        hours: "Mon–Sat 8:00–18:00",
        lat: 4.8986,
        lng: -1.7554,
      },
      {
        zoneId: zoneId("Lagos"),
        name: "Ikeja Computer Village",
        address: "Otigba Street, Ikeja, Lagos",
        hours: "Mon–Sat 9:00–18:00",
        lat: 6.5965,
        lng: 3.3421,
      },
      {
        zoneId: zoneId("Lagos"),
        name: "Lekki Phase 1",
        address: "Admiralty Way, Lekki, Lagos",
        hours: "Mon–Sat 9:00–19:00",
        lat: 6.4478,
        lng: 3.4723,
      },
      {
        zoneId: zoneId("Abuja (FCT)"),
        name: "Wuse 2",
        address: "Aminu Kano Crescent, Wuse 2, Abuja",
        hours: "Mon–Sat 9:00–18:00",
        lat: 9.0765,
        lng: 7.4801,
      },
    ])
    .returning({ id: s.pickupStation.id, name: s.pickupStation.name });

  // --- Promotions --------------------------------------------------------------------
  console.log("Creating promotions…");
  await db.insert(s.coupon).values([
    {
      code: "WELCOME10",
      type: "percent",
      value: 10,
      minSpend: toMinor(100),
      currency: "GHS",
      endsAt: hoursFromNow(24 * 60),
      usageLimit: 1000,
      usedCount: 214,
    },
    {
      code: "BULK5",
      type: "percent",
      value: 5,
      minSpend: toMinor(2000),
      currency: "GHS",
      endsAt: hoursFromNow(24 * 90),
    },
    {
      code: "SAVE20",
      type: "fixed",
      value: toMinor(20),
      minSpend: toMinor(200),
      currency: "GHS",
      endsAt: hoursFromNow(24 * 14),
      usageLimit: 500,
      usedCount: 87,
    },
    {
      code: "VOLT15",
      type: "percent",
      value: 15,
      minSpend: toMinor(150),
      currency: "GHS",
      sellerId: sellers.volthub!.id,
      endsAt: hoursFromNow(24 * 30),
    },
    {
      code: "EXPIRED5",
      type: "percent",
      value: 5,
      minSpend: 0,
      currency: "GHS",
      startsAt: daysAgo(60),
      endsAt: daysAgo(30),
    },
  ]);

  const dealSlugs: [string, number, number][] = [
    ["voltcell-20000mah-power-bank-22-5w", 249 / 299, 62],
    ["aurora-anc-wireless-over-ear-headphones", 0.75, 48],
    ["non-stick-frying-pan-set-3-piece", 0.8, 71],
    ["stride-run-breathable-running-shoes", 0.78, 35],
    ["stride-smart-watch-gps-heart-rate", 0.8, 54],
    ["led-desk-lamp-3-colour-modes", 0.85, 80],
  ];
  const dealEnds = hoursFromNow(12);
  await db.insert(s.flashDeal).values(
    dealSlugs.map(([slug, factor, claimedPct]) => {
      const p = products.find((x) => x.slug === slug)!;
      const cap = 200;
      return {
        productId: p.id,
        dealPrice: Math.round(p.price * factor),
        startsAt: daysAgo(0, 12),
        endsAt: dealEnds,
        stockCap: cap,
        claimed: Math.round((cap * claimedPct) / 100),
      };
    }),
  );

  await db.insert(s.banner).values([
    {
      eyebrow: "Back to school",
      title: "Tech deals for the new term",
      subtitle:
        "Power banks, headphones and smart watches from verified sellers, with pickup-station delivery across Ghana and Nigeria.",
      ctaLabel: "Shop tech deals",
      href: "/c/electronics",
      imageUrl: img("powerbank-hand"),
      theme: "teal",
      sortOrder: 0,
    },
    {
      eyebrow: "For business",
      title: "Source in bulk, pay less per unit",
      subtitle: "Tiered pricing, low MOQs and samples from suppliers who ship in days. Compare quotes side by side.",
      ctaLabel: "Explore bulk deals",
      href: "/search?readyToShip=1&view=business",
      imageUrl: img("tshirts"),
      theme: "indigo",
      sortOrder: 1,
    },
    {
      eyebrow: "Home refresh",
      title: "Kitchen, lighting and office",
      subtitle: "Cookware, lamps and ergonomic chairs with pickup-station delivery across Ghana and Nigeria.",
      ctaLabel: "Shop home",
      href: "/c/home-kitchen",
      imageUrl: img("pans"),
      theme: "amber",
      sortOrder: 2,
    },
  ]);

  // --- Orders (history for demo buyers) ------------------------------------------------
  console.log("Creating orders…");
  const statuses = [
    "delivered",
    "delivered",
    "delivered",
    "shipped",
    "processing",
    "paid",
    "at_pickup",
    "cancelled",
  ] as const;
  let orderSeq = 1;
  const accraMall = stations.find((st) => st.name === "Accra Mall")!.id;
  for (const buyerKey of ["shopper", "business"] as const) {
    const buyerId = users[buyerKey]!;
    const currency: Currency = buyerKey === "shopper" ? "GHS" : "NGN";
    for (let i = 0; i < 8; i++) {
      const p = pick(products.filter((x) => !x.slug.includes("armorgrip")));
      const qty = buyerKey === "business" ? pick([20, 50, 100]) : int(1, 2);
      const unit = convert(p.price, p.currency, currency, RATES);
      const shippingFee = currency === "GHS" ? toMinor(25) : toMinor(3500);
      const status = statuses[i % statuses.length]!;
      const created = daysAgo(int(3, 120));
      const [o] = await db
        .insert(s.order)
        .values({
          number: `MH-${created.toISOString().slice(2, 10).replaceAll("-", "")}-${String(orderSeq++).padStart(4, "0")}`,
          userId: buyerId,
          currency,
          fxRateToUsd: RATES[currency],
          subtotal: unit * qty,
          shippingTotal: shippingFee,
          grandTotal: unit * qty + shippingFee,
          deliveryMethod: i % 3 === 0 ? "pickup" : "doorstep",
          pickupStationId: i % 3 === 0 && currency === "GHS" ? accraMall : null,
          shippingAddress:
            buyerKey === "shopper"
              ? { fullName: "Ama Mensah", city: "Accra", country: "GH" }
              : { fullName: "Chidi Okafor", city: "Ikeja", country: "NG" },
          paymentMethod: currency === "GHS" ? "paystack_momo" : "paystack_card",
          paymentStatus: status === "cancelled" ? "refunded" : "paid",
          idempotencyKey: randomUUID(),
          createdAt: created,
        })
        .returning({ id: s.order.id });
      const [so] = await db
        .insert(s.sellerOrder)
        .values({
          orderId: o!.id,
          sellerId: p.sellerId,
          status,
          subtotal: unit * qty,
          shippingFee,
          trackingNumber: ["shipped", "delivered", "at_pickup"].includes(status)
            ? `GH${int(10000000, 99999999)}`
            : null,
          createdAt: created,
        })
        .returning({ id: s.sellerOrder.id });
      await db.insert(s.orderItem).values({
        sellerOrderId: so!.id,
        productId: p.id,
        variantId: p.variantIds[0],
        titleSnapshot: p.title,
        imageSnapshot: p.image,
        unitPrice: unit,
        qty,
      });
      const flow = ["pending", "paid", "processing", "shipped", "out_for_delivery", "delivered"] as const;
      const upTo =
        status === "cancelled" ? 1 : status === "at_pickup" ? 4 : flow.indexOf(status as (typeof flow)[number]);
      const events = flow.slice(0, Math.max(1, upTo + 1)).map((st, k) => ({
        sellerOrderId: so!.id,
        status: st,
        createdAt: new Date(created.getTime() + k * 20 * 3_600_000),
      }));
      if (status === "at_pickup")
        events.push({
          sellerOrderId: so!.id,
          status: "at_pickup",
          createdAt: new Date(created.getTime() + 5 * 20 * 3_600_000),
        } as never);
      if (status === "cancelled")
        events.push({
          sellerOrderId: so!.id,
          status: "cancelled",
          createdAt: new Date(created.getTime() + 6 * 3_600_000),
        } as never);
      await db.insert(s.orderEvent).values(events);
    }
  }

  // --- RFQs & quotes ---------------------------------------------------------------------
  console.log("Creating RFQs and quotes…");
  const rfqSeeds = [
    {
      title: "5,000 power banks with custom logo",
      cat: "power-banks",
      qty: 5000,
      target: 6.5,
      desc: "10,000–20,000mAh, USB-C PD, our logo printed on the case, retail box. Delivery to Lagos.",
      quotes: [
        ["brightline", 6.2, 1000, 15, 1200],
        ["volthub", 6.45, 500, 10, 900],
      ],
    },
    {
      title: "2,000 branded T-shirts for a school event",
      cat: "tops-tshirts",
      qty: 2000,
      target: 3.2,
      desc: "180gsm cotton, 2-colour front print, sizes S–XL, delivered to Kumasi.",
      quotes: [["kentethreads", 3.1, 200, 7, 150]],
    },
    {
      title: "10,000 kraft bags for a pharmacy chain",
      cat: "packaging",
      qty: 10000,
      target: 0.12,
      desc: "Medium size, 1-colour logo print, twisted handles.",
      quotes: [["packright", 0.11, 2000, 12, 300]],
    },
    {
      title: "300 ergonomic office chairs",
      cat: "office-furniture",
      qty: 300,
      target: 60,
      desc: "Mesh back, lumbar support, delivered and assembled in Accra.",
      quotes: [],
    },
  ] as const;
  let rfqSeq = 1041;
  for (const r of rfqSeeds) {
    const [row] = await db
      .insert(s.rfq)
      .values({
        number: `R-${rfqSeq++}`,
        buyerId: users.business!,
        title: r.title,
        categoryId: categoryIds[r.cat],
        description: r.desc,
        quantity: r.qty,
        targetPrice: toMinor(r.target),
        currency: "USD",
        deliveryCountry: "NG",
        deadline: hoursFromNow(24 * int(7, 21)),
        createdAt: daysAgo(int(1, 6)),
      })
      .returning({ id: s.rfq.id });
    for (const [sellerKey, unit, moq, lead, ship] of r.quotes) {
      await db.insert(s.quote).values({
        rfqId: row!.id,
        sellerId: sellers[sellerKey]!.id,
        unitPrice: toMinor(unit),
        currency: "USD",
        moq,
        leadTimeDays: lead,
        shippingCost: toMinor(ship),
        validUntil: hoursFromNow(24 * 14),
        note: "Price includes logo printing and retail packaging. Samples ship in 3 days.",
      });
    }
  }

  // --- Conversations ---------------------------------------------------------------------
  console.log("Creating conversations…");
  const volt = products.find((p) => p.slug.startsWith("voltcell-20000"))!;
  const [conv] = await db
    .insert(s.conversation)
    .values({ subject: volt.title, productId: volt.id, lastMessageAt: daysAgo(0, 3) })
    .returning({ id: s.conversation.id });
  await db.insert(s.conversationParticipant).values([
    { conversationId: conv!.id, userId: users.business!, lastReadAt: daysAgo(0, 3) },
    { conversationId: conv!.id, userId: users.seller!, lastReadAt: daysAgo(0, 5) },
  ]);
  await db.insert(s.message).values([
    {
      conversationId: conv!.id,
      senderId: users.business!,
      body: "Hi, can you print our logo on 500 units in the teal colour?",
      createdAt: daysAgo(0, 6),
    },
    {
      conversationId: conv!.id,
      senderId: users.seller!,
      body: "Yes — logo printing starts at 500 units. Lead time is 10 days. Send your artwork as a PDF or SVG.",
      createdAt: daysAgo(0, 5),
    },
    {
      conversationId: conv!.id,
      senderId: users.business!,
      body: "Great, I'll post an RFQ with the details.",
      createdAt: daysAgo(0, 3),
    },
  ]);

  await db.insert(s.notification).values([
    {
      userId: users.business!,
      type: "quote_received",
      title: "New quote on R-1041",
      body: "Shenzhen Brightline Electronics quoted $6.20/unit.",
      href: "/account/rfqs",
    },
    {
      userId: users.shopper!,
      type: "order_shipped",
      title: "Your order has shipped",
      body: "Track it from your orders page.",
      href: "/account/orders",
    },
    {
      userId: users.admin!,
      type: "seller_application",
      title: "New seller application",
      body: "Lagos Gadget Hub is waiting for review.",
      href: "/admin/sellers",
    },
  ]);

  const counts = await db.execute<{ t: string; n: number }>(sql`
    select 'users' t, count(*)::int n from "user" union all
    select 'sellers', count(*)::int from seller union all
    select 'categories', count(*)::int from category union all
    select 'products', count(*)::int from product union all
    select 'variants', count(*)::int from product_variant union all
    select 'reviews', count(*)::int from review union all
    select 'orders', count(*)::int from "order" union all
    select 'rfqs', count(*)::int from rfq union all
    select 'quotes', count(*)::int from quote`);
  console.table(counts.map((c) => ({ table: c.t, rows: c.n })));
  console.log(
    `Seed complete in ${((Date.now() - started) / 1000).toFixed(1)}s. Demo password for all accounts: ${DEMO_PASSWORD}`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
