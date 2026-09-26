/**
 * MarketHub database schema (Drizzle ORM, PostgreSQL).
 *
 * Conventions
 * - Money is stored as integer minor units (e.g. pesewas, kobo, cents) plus a currency code.
 * - Auth tables (user, session, account, verification) follow Better Auth's expected shape;
 *   their ids are text. Domain tables use UUIDs.
 * - `createdAt`/`updatedAt` are timestamptz.
 */
import { relations, sql } from "drizzle-orm";
import {
  boolean,
  customType,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

const tsvector = customType<{ data: string }>({
  dataType() {
    return "tsvector";
  },
});

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------
export const currencyCode = pgEnum("currency_code", ["GHS", "NGN", "USD"]);
export const verificationStatus = pgEnum("verification_status", ["pending", "verified", "rejected"]);
export const sellerStatus = pgEnum("seller_status", ["pending", "approved", "rejected", "suspended"]);
export const productStatus = pgEnum("product_status", ["draft", "published", "unpublished", "flagged"]);
export const attributeType = pgEnum("attribute_type", ["enum", "number", "bool"]);
export const reviewStatus = pgEnum("review_status", ["visible", "hidden", "reported"]);
export const deliveryMethod = pgEnum("delivery_method", ["doorstep", "pickup"]);
export const paymentMethod = pgEnum("payment_method", ["stripe", "paystack_card", "paystack_momo", "pod"]);
export const paymentStatus = pgEnum("payment_status", [
  "pending",
  "awaiting_pod",
  "paid",
  "failed",
  "refunded",
  "partially_refunded",
]);
export const sellerOrderStatus = pgEnum("seller_order_status", [
  "pending",
  "paid",
  "processing",
  "shipped",
  "out_for_delivery",
  "at_pickup",
  "delivered",
  "cancelled",
  "refunded",
]);
export const couponType = pgEnum("coupon_type", ["percent", "fixed"]);
export const rfqStatus = pgEnum("rfq_status", ["open", "closed", "awarded", "expired"]);
export const quoteStatus = pgEnum("quote_status", ["submitted", "accepted", "declined", "expired"]);
export const returnStatus = pgEnum("return_status", ["requested", "approved", "rejected", "received", "refunded"]);
export const disputeStatus = pgEnum("dispute_status", ["open", "refunded_buyer", "released_seller", "closed"]);

// ---------------------------------------------------------------------------
// Auth (Better Auth)
// ---------------------------------------------------------------------------
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  // admin plugin
  role: text("role").default("customer"),
  banned: boolean("banned").default(false),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires", { withTimezone: true }),
  // MarketHub fields
  isBusiness: boolean("is_business").notNull().default(false),
  preferredCurrency: currencyCode("preferred_currency").notNull().default("GHS"),
  phone: varchar("phone", { length: 32 }),
  ...timestamps,
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    impersonatedBy: text("impersonated_by"),
    ...timestamps,
  },
  (t) => [index("session_user_idx").on(t.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    ...timestamps,
  },
  (t) => [index("account_user_idx").on(t.userId)],
);

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  ...timestamps,
});

// ---------------------------------------------------------------------------
// People & businesses
// ---------------------------------------------------------------------------
export const address = pgTable(
  "address",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    fullName: text("full_name").notNull(),
    phone: varchar("phone", { length: 32 }).notNull(),
    country: varchar("country", { length: 2 }).notNull(),
    region: text("region").notNull(),
    city: text("city").notNull(),
    line1: text("line1").notNull(),
    line2: text("line2"),
    isDefault: boolean("is_default").notNull().default(false),
    ...timestamps,
  },
  (t) => [index("address_user_idx").on(t.userId)],
);

export const businessProfile = pgTable("business_profile", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  companyName: text("company_name").notNull(),
  regNumber: text("reg_number").notNull(),
  country: varchar("country", { length: 2 }).notNull(),
  industry: text("industry").notNull(),
  status: verificationStatus("status").notNull().default("pending"),
  reviewedBy: text("reviewed_by").references(() => user.id),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  ...timestamps,
});

export const seller = pgTable(
  "seller",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),
    slug: varchar("slug", { length: 80 }).notNull().unique(),
    name: text("name").notNull(),
    logoUrl: text("logo_url"),
    bannerUrl: text("banner_url"),
    story: text("story"),
    country: varchar("country", { length: 2 }).notNull(),
    city: text("city").notNull(),
    status: sellerStatus("status").notNull().default("pending"),
    isVerified: boolean("is_verified").notNull().default(false),
    isStarSeller: boolean("is_star_seller").notNull().default(false),
    baseCurrency: currencyCode("base_currency").notNull().default("GHS"),
    returnWindowDays: integer("return_window_days").notNull().default(7),
    policies: jsonb("policies").$type<{ shipping?: string; returns?: string }>().notNull().default({}),
    ratingAvg: doublePrecision("rating_avg").notNull().default(0),
    ratingCount: integer("rating_count").notNull().default(0),
    responseRate: integer("response_rate").notNull().default(100),
    onTimeRate: integer("on_time_rate").notNull().default(100),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
    ...timestamps,
  },
  (t) => [index("seller_status_idx").on(t.status)],
);

// ---------------------------------------------------------------------------
// Catalogue
// ---------------------------------------------------------------------------
export const category = pgTable(
  "category",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    parentId: uuid("parent_id"),
    slug: varchar("slug", { length: 80 }).notNull().unique(),
    name: text("name").notNull(),
    icon: text("icon"),
    imageUrl: text("image_url"),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [index("category_parent_idx").on(t.parentId)],
);

export const categoryAttribute = pgTable(
  "category_attribute",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => category.id, { onDelete: "cascade" }),
    key: varchar("key", { length: 60 }).notNull(),
    label: text("label").notNull(),
    type: attributeType("type").notNull().default("enum"),
    options: jsonb("options").$type<string[]>().notNull().default([]),
    filterable: boolean("filterable").notNull().default(true),
  },
  (t) => [uniqueIndex("category_attribute_key_uq").on(t.categoryId, t.key)],
);

export const product = pgTable(
  "product",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sellerId: uuid("seller_id")
      .notNull()
      .references(() => seller.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => category.id),
    slug: varchar("slug", { length: 160 }).notNull().unique(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    bullets: jsonb("bullets").$type<string[]>().notNull().default([]),
    specs: jsonb("specs").$type<Record<string, string>>().notNull().default({}),
    brand: text("brand"),
    status: productStatus("status").notNull().default("draft"),
    currency: currencyCode("currency").notNull().default("GHS"),
    retailPrice: integer("retail_price").notNull(),
    compareAtPrice: integer("compare_at_price"),
    moq: integer("moq").notNull().default(1),
    leadTimeDays: integer("lead_time_days").notNull().default(3),
    readyToShip: boolean("ready_to_ship").notNull().default(true),
    sampleEnabled: boolean("sample_enabled").notNull().default(false),
    samplePrice: integer("sample_price"),
    sampleMaxQty: integer("sample_max_qty").notNull().default(2),
    weightGrams: integer("weight_grams").notNull().default(500),
    soldCount: integer("sold_count").notNull().default(0),
    ratingAvg: doublePrecision("rating_avg").notNull().default(0),
    ratingCount: integer("rating_count").notNull().default(0),
    isFeatured: boolean("is_featured").notNull().default(false),
    searchVector: tsvector("search_vector").generatedAlwaysAs(
      sql`setweight(to_tsvector('english', coalesce(title, '')), 'A') || setweight(to_tsvector('english', coalesce(brand, '')), 'B') || setweight(to_tsvector('english', coalesce(description, '')), 'C')`,
    ),
    ...timestamps,
  },
  (t) => [
    index("product_seller_idx").on(t.sellerId),
    index("product_category_idx").on(t.categoryId),
    index("product_status_idx").on(t.status),
    index("product_search_idx").using("gin", t.searchVector),
    index("product_title_trgm_idx").using("gin", sql`${t.title} gin_trgm_ops`),
  ],
);

export const productImage = pgTable(
  "product_image",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    alt: text("alt").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    variantOption: text("variant_option"),
  },
  (t) => [index("product_image_product_idx").on(t.productId)],
);

export const productVariant = pgTable(
  "product_variant",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    sku: varchar("sku", { length: 64 }).notNull().unique(),
    options: jsonb("options").$type<Record<string, string>>().notNull().default({}),
    priceOverride: integer("price_override"),
    stock: integer("stock").notNull().default(0),
    reserved: integer("reserved").notNull().default(0),
    lowStockThreshold: integer("low_stock_threshold").notNull().default(5),
  },
  (t) => [index("product_variant_product_idx").on(t.productId)],
);

export const priceTier = pgTable(
  "price_tier",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    minQty: integer("min_qty").notNull(),
    maxQty: integer("max_qty"),
    unitPrice: integer("unit_price").notNull(),
  },
  (t) => [index("price_tier_product_idx").on(t.productId)],
);

export const productAttributeValue = pgTable(
  "product_attribute_value",
  {
    productId: uuid("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    attributeId: uuid("attribute_id")
      .notNull()
      .references(() => categoryAttribute.id, { onDelete: "cascade" }),
    value: text("value").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.productId, t.attributeId] }),
    index("pav_attr_value_idx").on(t.attributeId, t.value),
  ],
);

export const priceHistory = pgTable(
  "price_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    price: integer("price").notNull(),
    currency: currencyCode("currency").notNull(),
    recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("price_history_product_time_idx").on(t.productId, t.recordedAt)],
);

export const priceAlert = pgTable(
  "price_alert",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    targetPrice: integer("target_price"),
    currency: currencyCode("currency").notNull(),
    active: boolean("active").notNull().default(true),
    lastNotifiedAt: timestamp("last_notified_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [uniqueIndex("price_alert_user_product_uq").on(t.userId, t.productId)],
);

export const wishlistItem = pgTable(
  "wishlist_item",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.productId] })],
);

export const recentlyViewed = pgTable(
  "recently_viewed",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    guestToken: text("guest_token"),
    productId: uuid("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    viewedAt: timestamp("viewed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("recently_viewed_user_idx").on(t.userId, t.viewedAt)],
);

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------
export const review = pgTable(
  "review",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    orderItemId: uuid("order_item_id"),
    rating: integer("rating").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    images: jsonb("images").$type<string[]>().notNull().default([]),
    variantLabel: text("variant_label"),
    helpfulCount: integer("helpful_count").notNull().default(0),
    status: reviewStatus("status").notNull().default("visible"),
    sellerReply: text("seller_reply"),
    ...timestamps,
  },
  (t) => [index("review_product_idx").on(t.productId, t.status), uniqueIndex("review_order_item_uq").on(t.orderItemId)],
);

export const reviewVote = pgTable(
  "review_vote",
  {
    reviewId: uuid("review_id")
      .notNull()
      .references(() => review.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.reviewId, t.userId] })],
);

// ---------------------------------------------------------------------------
// Shipping & promotions
// ---------------------------------------------------------------------------
export const shippingZone = pgTable("shipping_zone", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  country: varchar("country", { length: 2 }).notNull(),
  region: text("region"),
  currency: currencyCode("currency").notNull(),
  doorstepFee: integer("doorstep_fee").notNull(),
  pickupFee: integer("pickup_fee").notNull(),
  etaDaysMin: integer("eta_days_min").notNull(),
  etaDaysMax: integer("eta_days_max").notNull(),
  podEnabled: boolean("pod_enabled").notNull().default(false),
});

export const pickupStation = pgTable("pickup_station", {
  id: uuid("id").primaryKey().defaultRandom(),
  zoneId: uuid("zone_id")
    .notNull()
    .references(() => shippingZone.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  address: text("address").notNull(),
  hours: text("hours").notNull(),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
});

export const coupon = pgTable("coupon", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  sellerId: uuid("seller_id").references(() => seller.id, { onDelete: "cascade" }),
  type: couponType("type").notNull(),
  value: integer("value").notNull(),
  minSpend: integer("min_spend").notNull().default(0),
  currency: currencyCode("currency").notNull().default("GHS"),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull().defaultNow(),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  usageLimit: integer("usage_limit"),
  usedCount: integer("used_count").notNull().default(0),
  ...timestamps,
});

export const flashDeal = pgTable(
  "flash_deal",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    dealPrice: integer("deal_price").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    stockCap: integer("stock_cap").notNull(),
    claimed: integer("claimed").notNull().default(0),
  },
  (t) => [index("flash_deal_window_idx").on(t.startsAt, t.endsAt)],
);

export const banner = pgTable("banner", {
  id: uuid("id").primaryKey().defaultRandom(),
  eyebrow: text("eyebrow"),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  ctaLabel: text("cta_label").notNull(),
  href: text("href").notNull(),
  imageUrl: text("image_url"),
  theme: varchar("theme", { length: 20 }).notNull().default("teal"),
  placement: varchar("placement", { length: 40 }).notNull().default("home_hero"),
  sortOrder: integer("sort_order").notNull().default(0),
  activeFrom: timestamp("active_from", { withTimezone: true }),
  activeTo: timestamp("active_to", { withTimezone: true }),
});

// ---------------------------------------------------------------------------
// Cart & orders
// ---------------------------------------------------------------------------
export const cart = pgTable("cart", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  guestToken: text("guest_token").unique(),
  currency: currencyCode("currency").notNull().default("GHS"),
  couponId: uuid("coupon_id").references(() => coupon.id, { onDelete: "set null" }),
  ...timestamps,
});

export const cartItem = pgTable(
  "cart_item",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cartId: uuid("cart_id")
      .notNull()
      .references(() => cart.id, { onDelete: "cascade" }),
    variantId: uuid("variant_id")
      .notNull()
      .references(() => productVariant.id, { onDelete: "cascade" }),
    qty: integer("qty").notNull(),
    isSample: boolean("is_sample").notNull().default(false),
    quoteId: uuid("quote_id"),
  },
  (t) => [uniqueIndex("cart_item_uq").on(t.cartId, t.variantId, t.isSample)],
);

export const order = pgTable(
  "order",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    number: varchar("number", { length: 32 }).notNull().unique(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    guestEmail: text("guest_email"),
    currency: currencyCode("currency").notNull(),
    fxRateToUsd: doublePrecision("fx_rate_to_usd").notNull(),
    subtotal: integer("subtotal").notNull(),
    shippingTotal: integer("shipping_total").notNull(),
    discountTotal: integer("discount_total").notNull().default(0),
    taxTotal: integer("tax_total").notNull().default(0),
    grandTotal: integer("grand_total").notNull(),
    deliveryMethod: deliveryMethod("delivery_method").notNull(),
    shippingAddress: jsonb("shipping_address").$type<Record<string, string>>(),
    pickupStationId: uuid("pickup_station_id").references(() => pickupStation.id),
    paymentMethod: paymentMethod("payment_method").notNull(),
    paymentStatus: paymentStatus("payment_status").notNull().default("pending"),
    isProtected: boolean("is_protected").notNull().default(true),
    couponId: uuid("coupon_id").references(() => coupon.id),
    quoteId: uuid("quote_id"),
    idempotencyKey: varchar("idempotency_key", { length: 64 }).notNull().unique(),
    ...timestamps,
  },
  (t) => [index("order_user_idx").on(t.userId, t.createdAt)],
);

export const sellerOrder = pgTable(
  "seller_order",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => order.id, { onDelete: "cascade" }),
    sellerId: uuid("seller_id")
      .notNull()
      .references(() => seller.id),
    status: sellerOrderStatus("status").notNull().default("pending"),
    trackingNumber: text("tracking_number"),
    subtotal: integer("subtotal").notNull(),
    shippingFee: integer("shipping_fee").notNull(),
    buyerConfirmedAt: timestamp("buyer_confirmed_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [index("seller_order_seller_idx").on(t.sellerId, t.status), index("seller_order_order_idx").on(t.orderId)],
);

export const orderItem = pgTable(
  "order_item",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sellerOrderId: uuid("seller_order_id")
      .notNull()
      .references(() => sellerOrder.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => product.id),
    variantId: uuid("variant_id").references(() => productVariant.id, { onDelete: "set null" }),
    titleSnapshot: text("title_snapshot").notNull(),
    variantLabel: text("variant_label"),
    imageSnapshot: text("image_snapshot"),
    unitPrice: integer("unit_price").notNull(),
    qty: integer("qty").notNull(),
    isSample: boolean("is_sample").notNull().default(false),
    tierApplied: text("tier_applied"),
  },
  (t) => [index("order_item_seller_order_idx").on(t.sellerOrderId)],
);

export const orderEvent = pgTable(
  "order_event",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sellerOrderId: uuid("seller_order_id")
      .notNull()
      .references(() => sellerOrder.id, { onDelete: "cascade" }),
    status: sellerOrderStatus("status").notNull(),
    note: text("note"),
    actorId: text("actor_id").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("order_event_seller_order_idx").on(t.sellerOrderId, t.createdAt)],
);

export const payment = pgTable(
  "payment",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => order.id, { onDelete: "cascade" }),
    provider: varchar("provider", { length: 20 }).notNull(),
    providerRef: text("provider_ref").notNull(),
    amount: integer("amount").notNull(),
    currency: currencyCode("currency").notNull(),
    status: paymentStatus("status").notNull().default("pending"),
    rawEvent: jsonb("raw_event"),
    ...timestamps,
  },
  (t) => [uniqueIndex("payment_provider_ref_uq").on(t.provider, t.providerRef)],
);

/** Processed webhook events, for idempotency. */
export const webhookEvent = pgTable("webhook_event", {
  id: text("id").primaryKey(),
  provider: varchar("provider", { length: 20 }).notNull(),
  receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
});

export const returnRequest = pgTable("return_request", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderItemId: uuid("order_item_id")
    .notNull()
    .references(() => orderItem.id, { onDelete: "cascade" }),
  reason: text("reason").notNull(),
  photos: jsonb("photos").$type<string[]>().notNull().default([]),
  status: returnStatus("status").notNull().default("requested"),
  resolution: text("resolution"),
  ...timestamps,
});

export const dispute = pgTable("dispute", {
  id: uuid("id").primaryKey().defaultRandom(),
  sellerOrderId: uuid("seller_order_id")
    .notNull()
    .references(() => sellerOrder.id, { onDelete: "cascade" }),
  openedBy: text("opened_by")
    .notNull()
    .references(() => user.id),
  reason: text("reason").notNull(),
  status: disputeStatus("status").notNull().default("open"),
  resolution: text("resolution"),
  resolvedBy: text("resolved_by").references(() => user.id),
  ...timestamps,
});

// ---------------------------------------------------------------------------
// B2B: RFQ & quotes
// ---------------------------------------------------------------------------
export const rfq = pgTable(
  "rfq",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    number: varchar("number", { length: 32 }).notNull().unique(),
    buyerId: text("buyer_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    categoryId: uuid("category_id").references(() => category.id),
    description: text("description").notNull(),
    quantity: integer("quantity").notNull(),
    unit: varchar("unit", { length: 20 }).notNull().default("pieces"),
    targetPrice: integer("target_price"),
    currency: currencyCode("currency").notNull(),
    deliveryCountry: varchar("delivery_country", { length: 2 }).notNull(),
    deadline: timestamp("deadline", { withTimezone: true }).notNull(),
    attachments: jsonb("attachments").$type<string[]>().notNull().default([]),
    status: rfqStatus("status").notNull().default("open"),
    ...timestamps,
  },
  (t) => [index("rfq_buyer_idx").on(t.buyerId), index("rfq_status_idx").on(t.status, t.categoryId)],
);

export const quote = pgTable(
  "quote",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    rfqId: uuid("rfq_id")
      .notNull()
      .references(() => rfq.id, { onDelete: "cascade" }),
    sellerId: uuid("seller_id")
      .notNull()
      .references(() => seller.id, { onDelete: "cascade" }),
    productId: uuid("product_id").references(() => product.id, { onDelete: "set null" }),
    unitPrice: integer("unit_price").notNull(),
    currency: currencyCode("currency").notNull(),
    moq: integer("moq").notNull(),
    leadTimeDays: integer("lead_time_days").notNull(),
    shippingCost: integer("shipping_cost").notNull(),
    validUntil: timestamp("valid_until", { withTimezone: true }).notNull(),
    note: text("note"),
    status: quoteStatus("status").notNull().default("submitted"),
    ...timestamps,
  },
  (t) => [uniqueIndex("quote_rfq_seller_uq").on(t.rfqId, t.sellerId)],
);

// ---------------------------------------------------------------------------
// Messaging & notifications
// ---------------------------------------------------------------------------
export const conversation = pgTable("conversation", {
  id: uuid("id").primaryKey().defaultRandom(),
  subject: text("subject"),
  productId: uuid("product_id").references(() => product.id, { onDelete: "set null" }),
  rfqId: uuid("rfq_id").references(() => rfq.id, { onDelete: "set null" }),
  quoteId: uuid("quote_id").references(() => quote.id, { onDelete: "set null" }),
  lastMessageAt: timestamp("last_message_at", { withTimezone: true }).notNull().defaultNow(),
  ...timestamps,
});

export const conversationParticipant = pgTable(
  "conversation_participant",
  {
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversation.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    lastReadAt: timestamp("last_read_at", { withTimezone: true }),
  },
  (t) => [primaryKey({ columns: [t.conversationId, t.userId] }), index("cp_user_idx").on(t.userId)],
);

export const message = pgTable(
  "message",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversation.id, { onDelete: "cascade" }),
    senderId: text("sender_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    attachments: jsonb("attachments").$type<string[]>().notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("message_conversation_idx").on(t.conversationId, t.createdAt)],
);

export const notification = pgTable(
  "notification",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 40 }).notNull(),
    title: text("title").notNull(),
    body: text("body"),
    href: text("href"),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("notification_user_idx").on(t.userId, t.createdAt)],
);

// ---------------------------------------------------------------------------
// Platform settings
// ---------------------------------------------------------------------------
export const currencyRate = pgTable("currency_rate", {
  code: currencyCode("code").primaryKey(),
  /** How many units of this currency equal 1 USD. */
  perUsd: doublePrecision("per_usd").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const setting = pgTable("setting", {
  key: varchar("key", { length: 60 }).primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorId: text("actor_id").references(() => user.id, { onDelete: "set null" }),
    action: varchar("action", { length: 60 }).notNull(),
    entity: varchar("entity", { length: 40 }).notNull(),
    entityId: text("entity_id"),
    diff: jsonb("diff"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("audit_log_time_idx").on(t.createdAt)],
);

// ---------------------------------------------------------------------------
// Relations (for the relational query API)
// ---------------------------------------------------------------------------
export const userRelations = relations(user, ({ one, many }) => ({
  seller: one(seller, { fields: [user.id], references: [seller.userId] }),
  businessProfile: one(businessProfile, { fields: [user.id], references: [businessProfile.userId] }),
  addresses: many(address),
  reviews: many(review),
  orders: many(order),
}));

export const sellerRelations = relations(seller, ({ one, many }) => ({
  user: one(user, { fields: [seller.userId], references: [user.id] }),
  products: many(product),
}));

export const categoryRelations = relations(category, ({ one, many }) => ({
  parent: one(category, { fields: [category.parentId], references: [category.id], relationName: "tree" }),
  children: many(category, { relationName: "tree" }),
  attributes: many(categoryAttribute),
  products: many(product),
}));

export const categoryAttributeRelations = relations(categoryAttribute, ({ one }) => ({
  category: one(category, { fields: [categoryAttribute.categoryId], references: [category.id] }),
}));

export const productRelations = relations(product, ({ one, many }) => ({
  seller: one(seller, { fields: [product.sellerId], references: [seller.id] }),
  category: one(category, { fields: [product.categoryId], references: [category.id] }),
  images: many(productImage),
  variants: many(productVariant),
  tiers: many(priceTier),
  reviews: many(review),
  flashDeals: many(flashDeal),
  attributes: many(productAttributeValue),
}));

export const productImageRelations = relations(productImage, ({ one }) => ({
  product: one(product, { fields: [productImage.productId], references: [product.id] }),
}));
export const productVariantRelations = relations(productVariant, ({ one }) => ({
  product: one(product, { fields: [productVariant.productId], references: [product.id] }),
}));
export const priceTierRelations = relations(priceTier, ({ one }) => ({
  product: one(product, { fields: [priceTier.productId], references: [product.id] }),
}));
export const productAttributeValueRelations = relations(productAttributeValue, ({ one }) => ({
  product: one(product, { fields: [productAttributeValue.productId], references: [product.id] }),
  attribute: one(categoryAttribute, {
    fields: [productAttributeValue.attributeId],
    references: [categoryAttribute.id],
  }),
}));
export const flashDealRelations = relations(flashDeal, ({ one }) => ({
  product: one(product, { fields: [flashDeal.productId], references: [product.id] }),
}));
export const reviewRelations = relations(review, ({ one }) => ({
  product: one(product, { fields: [review.productId], references: [product.id] }),
  user: one(user, { fields: [review.userId], references: [user.id] }),
}));

export const cartRelations = relations(cart, ({ many, one }) => ({
  items: many(cartItem),
  coupon: one(coupon, { fields: [cart.couponId], references: [coupon.id] }),
}));
export const cartItemRelations = relations(cartItem, ({ one }) => ({
  cart: one(cart, { fields: [cartItem.cartId], references: [cart.id] }),
  variant: one(productVariant, { fields: [cartItem.variantId], references: [productVariant.id] }),
}));

export const orderRelations = relations(order, ({ many, one }) => ({
  sellerOrders: many(sellerOrder),
  payments: many(payment),
  user: one(user, { fields: [order.userId], references: [user.id] }),
  pickupStation: one(pickupStation, { fields: [order.pickupStationId], references: [pickupStation.id] }),
}));
export const sellerOrderRelations = relations(sellerOrder, ({ one, many }) => ({
  order: one(order, { fields: [sellerOrder.orderId], references: [order.id] }),
  seller: one(seller, { fields: [sellerOrder.sellerId], references: [seller.id] }),
  items: many(orderItem),
  events: many(orderEvent),
}));
export const orderItemRelations = relations(orderItem, ({ one }) => ({
  sellerOrder: one(sellerOrder, { fields: [orderItem.sellerOrderId], references: [sellerOrder.id] }),
  product: one(product, { fields: [orderItem.productId], references: [product.id] }),
}));
export const orderEventRelations = relations(orderEvent, ({ one }) => ({
  sellerOrder: one(sellerOrder, { fields: [orderEvent.sellerOrderId], references: [sellerOrder.id] }),
}));
export const paymentRelations = relations(payment, ({ one }) => ({
  order: one(order, { fields: [payment.orderId], references: [order.id] }),
}));

export const shippingZoneRelations = relations(shippingZone, ({ many }) => ({
  pickupStations: many(pickupStation),
}));
export const pickupStationRelations = relations(pickupStation, ({ one }) => ({
  zone: one(shippingZone, { fields: [pickupStation.zoneId], references: [shippingZone.id] }),
}));

export const rfqRelations = relations(rfq, ({ one, many }) => ({
  buyer: one(user, { fields: [rfq.buyerId], references: [user.id] }),
  category: one(category, { fields: [rfq.categoryId], references: [category.id] }),
  quotes: many(quote),
}));
export const quoteRelations = relations(quote, ({ one }) => ({
  rfq: one(rfq, { fields: [quote.rfqId], references: [rfq.id] }),
  seller: one(seller, { fields: [quote.sellerId], references: [seller.id] }),
}));

export const conversationRelations = relations(conversation, ({ many }) => ({
  participants: many(conversationParticipant),
  messages: many(message),
}));
export const conversationParticipantRelations = relations(conversationParticipant, ({ one }) => ({
  conversation: one(conversation, {
    fields: [conversationParticipant.conversationId],
    references: [conversation.id],
  }),
  user: one(user, { fields: [conversationParticipant.userId], references: [user.id] }),
}));
export const messageRelations = relations(message, ({ one }) => ({
  conversation: one(conversation, { fields: [message.conversationId], references: [conversation.id] }),
  sender: one(user, { fields: [message.senderId], references: [user.id] }),
}));

export type Currency = (typeof currencyCode.enumValues)[number];
export const ROLES = ["customer", "seller", "admin"] as const;
export type Role = (typeof ROLES)[number];
