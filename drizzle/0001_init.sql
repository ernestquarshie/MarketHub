CREATE TYPE "public"."attribute_type" AS ENUM('enum', 'number', 'bool');--> statement-breakpoint
CREATE TYPE "public"."coupon_type" AS ENUM('percent', 'fixed');--> statement-breakpoint
CREATE TYPE "public"."currency_code" AS ENUM('GHS', 'NGN', 'USD');--> statement-breakpoint
CREATE TYPE "public"."delivery_method" AS ENUM('doorstep', 'pickup');--> statement-breakpoint
CREATE TYPE "public"."dispute_status" AS ENUM('open', 'refunded_buyer', 'released_seller', 'closed');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('stripe', 'paystack_card', 'paystack_momo', 'pod');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'awaiting_pod', 'paid', 'failed', 'refunded', 'partially_refunded');--> statement-breakpoint
CREATE TYPE "public"."product_status" AS ENUM('draft', 'published', 'unpublished', 'flagged');--> statement-breakpoint
CREATE TYPE "public"."quote_status" AS ENUM('submitted', 'accepted', 'declined', 'expired');--> statement-breakpoint
CREATE TYPE "public"."return_status" AS ENUM('requested', 'approved', 'rejected', 'received', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."review_status" AS ENUM('visible', 'hidden', 'reported');--> statement-breakpoint
CREATE TYPE "public"."rfq_status" AS ENUM('open', 'closed', 'awarded', 'expired');--> statement-breakpoint
CREATE TYPE "public"."seller_order_status" AS ENUM('pending', 'paid', 'processing', 'shipped', 'out_for_delivery', 'at_pickup', 'delivered', 'cancelled', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."seller_status" AS ENUM('pending', 'approved', 'rejected', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('pending', 'verified', 'rejected');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "address" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"full_name" text NOT NULL,
	"phone" varchar(32) NOT NULL,
	"country" varchar(2) NOT NULL,
	"region" text NOT NULL,
	"city" text NOT NULL,
	"line1" text NOT NULL,
	"line2" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" text,
	"action" varchar(60) NOT NULL,
	"entity" varchar(40) NOT NULL,
	"entity_id" text,
	"diff" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "banner" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"eyebrow" text,
	"title" text NOT NULL,
	"subtitle" text,
	"cta_label" text NOT NULL,
	"href" text NOT NULL,
	"image_url" text,
	"theme" varchar(20) DEFAULT 'teal' NOT NULL,
	"placement" varchar(40) DEFAULT 'home_hero' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"active_from" timestamp with time zone,
	"active_to" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "business_profile" (
	"user_id" text PRIMARY KEY NOT NULL,
	"company_name" text NOT NULL,
	"reg_number" text NOT NULL,
	"country" varchar(2) NOT NULL,
	"industry" text NOT NULL,
	"status" "verification_status" DEFAULT 'pending' NOT NULL,
	"reviewed_by" text,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cart" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"guest_token" text,
	"currency" "currency_code" DEFAULT 'GHS' NOT NULL,
	"coupon_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cart_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "cart_guest_token_unique" UNIQUE("guest_token")
);
--> statement-breakpoint
CREATE TABLE "cart_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cart_id" uuid NOT NULL,
	"variant_id" uuid NOT NULL,
	"qty" integer NOT NULL,
	"is_sample" boolean DEFAULT false NOT NULL,
	"quote_id" uuid
);
--> statement-breakpoint
CREATE TABLE "category" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_id" uuid,
	"slug" varchar(80) NOT NULL,
	"name" text NOT NULL,
	"icon" text,
	"image_url" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "category_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "category_attribute" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"key" varchar(60) NOT NULL,
	"label" text NOT NULL,
	"type" "attribute_type" DEFAULT 'enum' NOT NULL,
	"options" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"filterable" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subject" text,
	"product_id" uuid,
	"rfq_id" uuid,
	"quote_id" uuid,
	"last_message_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversation_participant" (
	"conversation_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"last_read_at" timestamp with time zone,
	CONSTRAINT "conversation_participant_conversation_id_user_id_pk" PRIMARY KEY("conversation_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "coupon" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(32) NOT NULL,
	"seller_id" uuid,
	"type" "coupon_type" NOT NULL,
	"value" integer NOT NULL,
	"min_spend" integer DEFAULT 0 NOT NULL,
	"currency" "currency_code" DEFAULT 'GHS' NOT NULL,
	"starts_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ends_at" timestamp with time zone,
	"usage_limit" integer,
	"used_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "coupon_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "currency_rate" (
	"code" "currency_code" PRIMARY KEY NOT NULL,
	"per_usd" double precision NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dispute" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seller_order_id" uuid NOT NULL,
	"opened_by" text NOT NULL,
	"reason" text NOT NULL,
	"status" "dispute_status" DEFAULT 'open' NOT NULL,
	"resolution" text,
	"resolved_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "flash_deal" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"deal_price" integer NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"stock_cap" integer NOT NULL,
	"claimed" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"sender_id" text NOT NULL,
	"body" text NOT NULL,
	"attachments" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"type" varchar(40) NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"href" text,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"number" varchar(32) NOT NULL,
	"user_id" text,
	"guest_email" text,
	"currency" "currency_code" NOT NULL,
	"fx_rate_to_usd" double precision NOT NULL,
	"subtotal" integer NOT NULL,
	"shipping_total" integer NOT NULL,
	"discount_total" integer DEFAULT 0 NOT NULL,
	"tax_total" integer DEFAULT 0 NOT NULL,
	"grand_total" integer NOT NULL,
	"delivery_method" "delivery_method" NOT NULL,
	"shipping_address" jsonb,
	"pickup_station_id" uuid,
	"payment_method" "payment_method" NOT NULL,
	"payment_status" "payment_status" DEFAULT 'pending' NOT NULL,
	"is_protected" boolean DEFAULT true NOT NULL,
	"coupon_id" uuid,
	"quote_id" uuid,
	"idempotency_key" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "order_number_unique" UNIQUE("number"),
	CONSTRAINT "order_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "order_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seller_order_id" uuid NOT NULL,
	"status" "seller_order_status" NOT NULL,
	"note" text,
	"actor_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seller_order_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"variant_id" uuid,
	"title_snapshot" text NOT NULL,
	"variant_label" text,
	"image_snapshot" text,
	"unit_price" integer NOT NULL,
	"qty" integer NOT NULL,
	"is_sample" boolean DEFAULT false NOT NULL,
	"tier_applied" text
);
--> statement-breakpoint
CREATE TABLE "payment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"provider" varchar(20) NOT NULL,
	"provider_ref" text NOT NULL,
	"amount" integer NOT NULL,
	"currency" "currency_code" NOT NULL,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"raw_event" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pickup_station" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"zone_id" uuid NOT NULL,
	"name" text NOT NULL,
	"address" text NOT NULL,
	"hours" text NOT NULL,
	"lat" double precision,
	"lng" double precision
);
--> statement-breakpoint
CREATE TABLE "price_alert" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"product_id" uuid NOT NULL,
	"target_price" integer,
	"currency" "currency_code" NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"last_notified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "price_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"price" integer NOT NULL,
	"currency" "currency_code" NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "price_tier" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"min_qty" integer NOT NULL,
	"max_qty" integer,
	"unit_price" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seller_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"slug" varchar(160) NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"bullets" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"specs" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"brand" text,
	"status" "product_status" DEFAULT 'draft' NOT NULL,
	"currency" "currency_code" DEFAULT 'GHS' NOT NULL,
	"retail_price" integer NOT NULL,
	"compare_at_price" integer,
	"moq" integer DEFAULT 1 NOT NULL,
	"lead_time_days" integer DEFAULT 3 NOT NULL,
	"ready_to_ship" boolean DEFAULT true NOT NULL,
	"sample_enabled" boolean DEFAULT false NOT NULL,
	"sample_price" integer,
	"sample_max_qty" integer DEFAULT 2 NOT NULL,
	"weight_grams" integer DEFAULT 500 NOT NULL,
	"sold_count" integer DEFAULT 0 NOT NULL,
	"rating_avg" double precision DEFAULT 0 NOT NULL,
	"rating_count" integer DEFAULT 0 NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"search_vector" "tsvector" GENERATED ALWAYS AS (setweight(to_tsvector('english', coalesce(title, '')), 'A') || setweight(to_tsvector('english', coalesce(brand, '')), 'B') || setweight(to_tsvector('english', coalesce(description, '')), 'C')) STORED,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "product_attribute_value" (
	"product_id" uuid NOT NULL,
	"attribute_id" uuid NOT NULL,
	"value" text NOT NULL,
	CONSTRAINT "product_attribute_value_product_id_attribute_id_pk" PRIMARY KEY("product_id","attribute_id")
);
--> statement-breakpoint
CREATE TABLE "product_image" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"url" text NOT NULL,
	"alt" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"variant_option" text
);
--> statement-breakpoint
CREATE TABLE "product_variant" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"sku" varchar(64) NOT NULL,
	"options" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"price_override" integer,
	"stock" integer DEFAULT 0 NOT NULL,
	"reserved" integer DEFAULT 0 NOT NULL,
	"low_stock_threshold" integer DEFAULT 5 NOT NULL,
	CONSTRAINT "product_variant_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "quote" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rfq_id" uuid NOT NULL,
	"seller_id" uuid NOT NULL,
	"product_id" uuid,
	"unit_price" integer NOT NULL,
	"currency" "currency_code" NOT NULL,
	"moq" integer NOT NULL,
	"lead_time_days" integer NOT NULL,
	"shipping_cost" integer NOT NULL,
	"valid_until" timestamp with time zone NOT NULL,
	"note" text,
	"status" "quote_status" DEFAULT 'submitted' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recently_viewed" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"guest_token" text,
	"product_id" uuid NOT NULL,
	"viewed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "return_request" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_item_id" uuid NOT NULL,
	"reason" text NOT NULL,
	"photos" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" "return_status" DEFAULT 'requested' NOT NULL,
	"resolution" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"order_item_id" uuid,
	"rating" integer NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"images" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"variant_label" text,
	"helpful_count" integer DEFAULT 0 NOT NULL,
	"status" "review_status" DEFAULT 'visible' NOT NULL,
	"seller_reply" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_vote" (
	"review_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	CONSTRAINT "review_vote_review_id_user_id_pk" PRIMARY KEY("review_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "rfq" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"number" varchar(32) NOT NULL,
	"buyer_id" text NOT NULL,
	"title" text NOT NULL,
	"category_id" uuid,
	"description" text NOT NULL,
	"quantity" integer NOT NULL,
	"unit" varchar(20) DEFAULT 'pieces' NOT NULL,
	"target_price" integer,
	"currency" "currency_code" NOT NULL,
	"delivery_country" varchar(2) NOT NULL,
	"deadline" timestamp with time zone NOT NULL,
	"attachments" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" "rfq_status" DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rfq_number_unique" UNIQUE("number")
);
--> statement-breakpoint
CREATE TABLE "seller" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"slug" varchar(80) NOT NULL,
	"name" text NOT NULL,
	"logo_url" text,
	"banner_url" text,
	"story" text,
	"country" varchar(2) NOT NULL,
	"city" text NOT NULL,
	"status" "seller_status" DEFAULT 'pending' NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"is_star_seller" boolean DEFAULT false NOT NULL,
	"base_currency" "currency_code" DEFAULT 'GHS' NOT NULL,
	"return_window_days" integer DEFAULT 7 NOT NULL,
	"policies" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"rating_avg" double precision DEFAULT 0 NOT NULL,
	"rating_count" integer DEFAULT 0 NOT NULL,
	"response_rate" integer DEFAULT 100 NOT NULL,
	"on_time_rate" integer DEFAULT 100 NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "seller_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "seller_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "seller_order" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"seller_id" uuid NOT NULL,
	"status" "seller_order_status" DEFAULT 'pending' NOT NULL,
	"tracking_number" text,
	"subtotal" integer NOT NULL,
	"shipping_fee" integer NOT NULL,
	"buyer_confirmed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"impersonated_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "setting" (
	"key" varchar(60) PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shipping_zone" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"country" varchar(2) NOT NULL,
	"region" text,
	"currency" "currency_code" NOT NULL,
	"doorstep_fee" integer NOT NULL,
	"pickup_fee" integer NOT NULL,
	"eta_days_min" integer NOT NULL,
	"eta_days_max" integer NOT NULL,
	"pod_enabled" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" text DEFAULT 'customer',
	"banned" boolean DEFAULT false,
	"ban_reason" text,
	"ban_expires" timestamp with time zone,
	"is_business" boolean DEFAULT false NOT NULL,
	"preferred_currency" "currency_code" DEFAULT 'GHS' NOT NULL,
	"phone" varchar(32),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_event" (
	"id" text PRIMARY KEY NOT NULL,
	"provider" varchar(20) NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wishlist_item" (
	"user_id" text NOT NULL,
	"product_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wishlist_item_user_id_product_id_pk" PRIMARY KEY("user_id","product_id")
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "address" ADD CONSTRAINT "address_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_id_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_profile" ADD CONSTRAINT "business_profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_profile" ADD CONSTRAINT "business_profile_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart" ADD CONSTRAINT "cart_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart" ADD CONSTRAINT "cart_coupon_id_coupon_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupon"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_item" ADD CONSTRAINT "cart_item_cart_id_cart_id_fk" FOREIGN KEY ("cart_id") REFERENCES "public"."cart"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_item" ADD CONSTRAINT "cart_item_variant_id_product_variant_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_attribute" ADD CONSTRAINT "category_attribute_category_id_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."category"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_rfq_id_rfq_id_fk" FOREIGN KEY ("rfq_id") REFERENCES "public"."rfq"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_quote_id_quote_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quote"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_participant" ADD CONSTRAINT "conversation_participant_conversation_id_conversation_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_participant" ADD CONSTRAINT "conversation_participant_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon" ADD CONSTRAINT "coupon_seller_id_seller_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."seller"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispute" ADD CONSTRAINT "dispute_seller_order_id_seller_order_id_fk" FOREIGN KEY ("seller_order_id") REFERENCES "public"."seller_order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispute" ADD CONSTRAINT "dispute_opened_by_user_id_fk" FOREIGN KEY ("opened_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispute" ADD CONSTRAINT "dispute_resolved_by_user_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flash_deal" ADD CONSTRAINT "flash_deal_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_conversation_id_conversation_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_sender_id_user_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_pickup_station_id_pickup_station_id_fk" FOREIGN KEY ("pickup_station_id") REFERENCES "public"."pickup_station"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_coupon_id_coupon_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupon"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_event" ADD CONSTRAINT "order_event_seller_order_id_seller_order_id_fk" FOREIGN KEY ("seller_order_id") REFERENCES "public"."seller_order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_event" ADD CONSTRAINT "order_event_actor_id_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_seller_order_id_seller_order_id_fk" FOREIGN KEY ("seller_order_id") REFERENCES "public"."seller_order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_variant_id_product_variant_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variant"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_order_id_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pickup_station" ADD CONSTRAINT "pickup_station_zone_id_shipping_zone_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."shipping_zone"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_alert" ADD CONSTRAINT "price_alert_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_alert" ADD CONSTRAINT "price_alert_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_history" ADD CONSTRAINT "price_history_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_tier" ADD CONSTRAINT "price_tier_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "product_seller_id_seller_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."seller"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "product_category_id_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."category"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_attribute_value" ADD CONSTRAINT "product_attribute_value_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_attribute_value" ADD CONSTRAINT "product_attribute_value_attribute_id_category_attribute_id_fk" FOREIGN KEY ("attribute_id") REFERENCES "public"."category_attribute"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_image" ADD CONSTRAINT "product_image_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variant" ADD CONSTRAINT "product_variant_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote" ADD CONSTRAINT "quote_rfq_id_rfq_id_fk" FOREIGN KEY ("rfq_id") REFERENCES "public"."rfq"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote" ADD CONSTRAINT "quote_seller_id_seller_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."seller"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote" ADD CONSTRAINT "quote_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recently_viewed" ADD CONSTRAINT "recently_viewed_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recently_viewed" ADD CONSTRAINT "recently_viewed_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "return_request" ADD CONSTRAINT "return_request_order_item_id_order_item_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review" ADD CONSTRAINT "review_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review" ADD CONSTRAINT "review_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_vote" ADD CONSTRAINT "review_vote_review_id_review_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."review"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_vote" ADD CONSTRAINT "review_vote_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rfq" ADD CONSTRAINT "rfq_buyer_id_user_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rfq" ADD CONSTRAINT "rfq_category_id_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."category"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller" ADD CONSTRAINT "seller_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_order" ADD CONSTRAINT "seller_order_order_id_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_order" ADD CONSTRAINT "seller_order_seller_id_seller_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."seller"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlist_item" ADD CONSTRAINT "wishlist_item_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlist_item" ADD CONSTRAINT "wishlist_item_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "address_user_idx" ON "address" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_log_time_idx" ON "audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "cart_item_uq" ON "cart_item" USING btree ("cart_id","variant_id","is_sample");--> statement-breakpoint
CREATE INDEX "category_parent_idx" ON "category" USING btree ("parent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "category_attribute_key_uq" ON "category_attribute" USING btree ("category_id","key");--> statement-breakpoint
CREATE INDEX "cp_user_idx" ON "conversation_participant" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "flash_deal_window_idx" ON "flash_deal" USING btree ("starts_at","ends_at");--> statement-breakpoint
CREATE INDEX "message_conversation_idx" ON "message" USING btree ("conversation_id","created_at");--> statement-breakpoint
CREATE INDEX "notification_user_idx" ON "notification" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "order_user_idx" ON "order" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "order_event_seller_order_idx" ON "order_event" USING btree ("seller_order_id","created_at");--> statement-breakpoint
CREATE INDEX "order_item_seller_order_idx" ON "order_item" USING btree ("seller_order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_provider_ref_uq" ON "payment" USING btree ("provider","provider_ref");--> statement-breakpoint
CREATE UNIQUE INDEX "price_alert_user_product_uq" ON "price_alert" USING btree ("user_id","product_id");--> statement-breakpoint
CREATE INDEX "price_history_product_time_idx" ON "price_history" USING btree ("product_id","recorded_at");--> statement-breakpoint
CREATE INDEX "price_tier_product_idx" ON "price_tier" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "product_seller_idx" ON "product" USING btree ("seller_id");--> statement-breakpoint
CREATE INDEX "product_category_idx" ON "product" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "product_status_idx" ON "product" USING btree ("status");--> statement-breakpoint
CREATE INDEX "product_search_idx" ON "product" USING gin ("search_vector");--> statement-breakpoint
CREATE INDEX "product_title_trgm_idx" ON "product" USING gin ("title" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "pav_attr_value_idx" ON "product_attribute_value" USING btree ("attribute_id","value");--> statement-breakpoint
CREATE INDEX "product_image_product_idx" ON "product_image" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "product_variant_product_idx" ON "product_variant" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "quote_rfq_seller_uq" ON "quote" USING btree ("rfq_id","seller_id");--> statement-breakpoint
CREATE INDEX "recently_viewed_user_idx" ON "recently_viewed" USING btree ("user_id","viewed_at");--> statement-breakpoint
CREATE INDEX "review_product_idx" ON "review" USING btree ("product_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "review_order_item_uq" ON "review" USING btree ("order_item_id");--> statement-breakpoint
CREATE INDEX "rfq_buyer_idx" ON "rfq" USING btree ("buyer_id");--> statement-breakpoint
CREATE INDEX "rfq_status_idx" ON "rfq" USING btree ("status","category_id");--> statement-breakpoint
CREATE INDEX "seller_status_idx" ON "seller" USING btree ("status");--> statement-breakpoint
CREATE INDEX "seller_order_seller_idx" ON "seller_order" USING btree ("seller_id","status");--> statement-breakpoint
CREATE INDEX "seller_order_order_idx" ON "seller_order" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "session_user_idx" ON "session" USING btree ("user_id");