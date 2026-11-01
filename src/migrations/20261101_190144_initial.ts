import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."_locales" AS ENUM('de', 'en');
  CREATE TYPE "public"."enum_restaurants_cuisine" AS ENUM('american', 'asian', 'desserts', 'greek', 'hawaiian', 'indian', 'italian', 'japanese');
  CREATE TYPE "public"."enum_restaurants_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__restaurants_v_version_cuisine" AS ENUM('american', 'asian', 'desserts', 'greek', 'hawaiian', 'indian', 'italian', 'japanese');
  CREATE TYPE "public"."enum__restaurants_v_published_locale" AS ENUM('de', 'en');
  CREATE TYPE "public"."enum__restaurants_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_dishes_dietary" AS ENUM('vegan', 'vegetarian', 'gluten_free', 'lactose_free', 'halal');
  CREATE TYPE "public"."enum_dishes_allergens" AS ENUM('gluten', 'crustaceans', 'eggs', 'fish', 'peanuts', 'soybeans', 'milk', 'nuts', 'celery', 'mustard', 'sesame', 'sulphites', 'lupin', 'molluscs');
  CREATE TYPE "public"."enum_dishes_moods" AS ENUM('cheesy', 'classic', 'comfort', 'creamy', 'crispy', 'fresh', 'hearty', 'light', 'salty', 'sharable', 'spicy', 'sweet', 'umami');
  CREATE TYPE "public"."enum_dishes_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__dishes_v_version_dietary" AS ENUM('vegan', 'vegetarian', 'gluten_free', 'lactose_free', 'halal');
  CREATE TYPE "public"."enum__dishes_v_version_allergens" AS ENUM('gluten', 'crustaceans', 'eggs', 'fish', 'peanuts', 'soybeans', 'milk', 'nuts', 'celery', 'mustard', 'sesame', 'sulphites', 'lupin', 'molluscs');
  CREATE TYPE "public"."enum__dishes_v_version_moods" AS ENUM('cheesy', 'classic', 'comfort', 'creamy', 'crispy', 'fresh', 'hearty', 'light', 'salty', 'sharable', 'spicy', 'sweet', 'umami');
  CREATE TYPE "public"."enum__dishes_v_published_locale" AS ENUM('de', 'en');
  CREATE TYPE "public"."enum__dishes_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_badges_tier" AS ENUM('BRONZE', 'SILVER', 'GOLD');
  CREATE TYPE "public"."enum_badges_rule_type" AS ENUM('orders', 'restaurants', 'streak', 'level', 'orderItems', 'caloriesAvoided', 'stampCards', 'dealOrders', 'couponOrders', 'orderTotal', 'moneyNotSpent', 'placedBetween', 'wheelPrize');
  CREATE TYPE "public"."enum_badges_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__badges_v_version_tier" AS ENUM('BRONZE', 'SILVER', 'GOLD');
  CREATE TYPE "public"."enum__badges_v_version_rule_type" AS ENUM('orders', 'restaurants', 'streak', 'level', 'orderItems', 'caloriesAvoided', 'stampCards', 'dealOrders', 'couponOrders', 'orderTotal', 'moneyNotSpent', 'placedBetween', 'wheelPrize');
  CREATE TYPE "public"."enum__badges_v_published_locale" AS ENUM('de', 'en');
  CREATE TYPE "public"."enum__badges_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_payload_llm_instructions_entity_type" AS ENUM('collection', 'global');
  CREATE TYPE "public"."enum_wheel_prizes_kind" AS ENUM('PERCENT', 'AMOUNT', 'FREE_DELIVERY', 'FREE_DISH', 'BONUS_XP', 'BADGE');
  CREATE TYPE "public"."enum_wheel_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__wheel_v_version_prizes_kind" AS ENUM('PERCENT', 'AMOUNT', 'FREE_DELIVERY', 'FREE_DISH', 'BONUS_XP', 'BADGE');
  CREATE TYPE "public"."enum__wheel_v_published_locale" AS ENUM('de', 'en');
  CREATE TYPE "public"."enum__wheel_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "outbox_events" (
  	"id" uuid PRIMARY KEY NOT NULL,
  	"position" bigserial NOT NULL,
  	"topic" text NOT NULL,
  	"partition_key" text NOT NULL,
  	"type" text NOT NULL,
  	"payload" text NOT NULL,
  	"created_at" timestamp with time zone NOT NULL,
  	"published_at" timestamp with time zone
  );
  
  CREATE TABLE "restaurants" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"name" varchar,
  	"slug" varchar,
  	"cuisine" "enum_restaurants_cuisine",
  	"image_id" uuid,
  	"rating" numeric,
  	"delivery_minutes" numeric,
  	"delivery_fee" numeric,
  	"minimum_order" numeric,
  	"opens_at" varchar,
  	"closes_at" varchar,
  	"location_latitude" numeric,
  	"location_longitude" numeric,
  	"archived" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "restaurants_locales" (
  	"description" varchar,
  	"_status" "enum_restaurants_status" DEFAULT 'draft',
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE "restaurants_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"admins_id" uuid
  );
  
  CREATE TABLE "_restaurants_v" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"parent_id" uuid,
  	"version_name" varchar,
  	"version_slug" varchar,
  	"version_cuisine" "enum__restaurants_v_version_cuisine",
  	"version_image_id" uuid,
  	"version_rating" numeric,
  	"version_delivery_minutes" numeric,
  	"version_delivery_fee" numeric,
  	"version_minimum_order" numeric,
  	"version_opens_at" varchar,
  	"version_closes_at" varchar,
  	"version_location_latitude" numeric,
  	"version_location_longitude" numeric,
  	"version_archived" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"published_locale" "enum__restaurants_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_restaurants_v_locales" (
  	"version_description" varchar,
  	"version__status" "enum__restaurants_v_version_status" DEFAULT 'draft',
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE "_restaurants_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"admins_id" uuid
  );
  
  CREATE TABLE "dishes_dietary" (
  	"order" integer NOT NULL,
  	"parent_id" uuid NOT NULL,
  	"value" "enum_dishes_dietary",
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL
  );
  
  CREATE TABLE "dishes_allergens" (
  	"order" integer NOT NULL,
  	"parent_id" uuid NOT NULL,
  	"value" "enum_dishes_allergens",
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL
  );
  
  CREATE TABLE "dishes_moods" (
  	"order" integer NOT NULL,
  	"parent_id" uuid NOT NULL,
  	"value" "enum_dishes_moods",
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL
  );
  
  CREATE TABLE "dishes" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"restaurant_id" uuid,
  	"slug" varchar,
  	"position" numeric DEFAULT 0,
  	"image_id" uuid,
  	"price" numeric,
  	"calories" numeric,
  	"spice_level" numeric DEFAULT 0,
  	"available" boolean DEFAULT true,
  	"archived" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "dishes_locales" (
  	"name" varchar,
  	"section" varchar,
  	"description" varchar,
  	"_status" "enum_dishes_status" DEFAULT 'draft',
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE "dishes_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"admins_id" uuid
  );
  
  CREATE TABLE "_dishes_v_version_dietary" (
  	"order" integer NOT NULL,
  	"parent_id" uuid NOT NULL,
  	"value" "enum__dishes_v_version_dietary",
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL
  );
  
  CREATE TABLE "_dishes_v_version_allergens" (
  	"order" integer NOT NULL,
  	"parent_id" uuid NOT NULL,
  	"value" "enum__dishes_v_version_allergens",
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL
  );
  
  CREATE TABLE "_dishes_v_version_moods" (
  	"order" integer NOT NULL,
  	"parent_id" uuid NOT NULL,
  	"value" "enum__dishes_v_version_moods",
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL
  );
  
  CREATE TABLE "_dishes_v" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"parent_id" uuid,
  	"version_restaurant_id" uuid,
  	"version_slug" varchar,
  	"version_position" numeric DEFAULT 0,
  	"version_image_id" uuid,
  	"version_price" numeric,
  	"version_calories" numeric,
  	"version_spice_level" numeric DEFAULT 0,
  	"version_available" boolean DEFAULT true,
  	"version_archived" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"published_locale" "enum__dishes_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_dishes_v_locales" (
  	"version_name" varchar,
  	"version_section" varchar,
  	"version_description" varchar,
  	"version__status" "enum__dishes_v_version_status" DEFAULT 'draft',
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE "_dishes_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"admins_id" uuid
  );
  
  CREATE TABLE "deals" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"title" varchar,
  	"dish_id" uuid NOT NULL,
  	"percent_off" numeric NOT NULL,
  	"starts_at" timestamp(3) with time zone NOT NULL,
  	"ends_at" timestamp(3) with time zone NOT NULL,
  	"cancelled" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "deals_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"admins_id" uuid
  );
  
  CREATE TABLE "_deals_v" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"parent_id" uuid,
  	"version_title" varchar,
  	"version_dish_id" uuid NOT NULL,
  	"version_percent_off" numeric NOT NULL,
  	"version_starts_at" timestamp(3) with time zone NOT NULL,
  	"version_ends_at" timestamp(3) with time zone NOT NULL,
  	"version_cancelled" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_deals_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"admins_id" uuid
  );
  
  CREATE TABLE "badges" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"key" varchar,
  	"tier" "enum_badges_tier",
  	"rule_type" "enum_badges_rule_type",
  	"rule_min" numeric,
  	"rule_minimum" numeric,
  	"rule_from_hour" numeric,
  	"rule_to_hour" numeric,
  	"position" numeric DEFAULT 0,
  	"active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "badges_locales" (
  	"name" varchar,
  	"description" varchar,
  	"_status" "enum_badges_status" DEFAULT 'draft',
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE "badges_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"admins_id" uuid
  );
  
  CREATE TABLE "_badges_v" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"parent_id" uuid,
  	"version_key" varchar,
  	"version_tier" "enum__badges_v_version_tier",
  	"version_rule_type" "enum__badges_v_version_rule_type",
  	"version_rule_min" numeric,
  	"version_rule_minimum" numeric,
  	"version_rule_from_hour" numeric,
  	"version_rule_to_hour" numeric,
  	"version_position" numeric DEFAULT 0,
  	"version_active" boolean DEFAULT true,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"published_locale" "enum__badges_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_badges_v_locales" (
  	"version_name" varchar,
  	"version_description" varchar,
  	"version__status" "enum__badges_v_version_status" DEFAULT 'draft',
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE "_badges_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"admins_id" uuid
  );
  
  CREATE TABLE "media" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"prefix" varchar DEFAULT '',
  	"_objectkey" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"original_filename" varchar,
  	"original_url" varchar,
  	"original_mime_type" varchar,
  	"original_filesize" numeric,
  	"original_width" numeric,
  	"original_height" numeric,
  	"original_prefix" varchar,
  	"original__objectkey" varchar,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"variants_card_url" varchar,
  	"variants_card_width" numeric,
  	"variants_card_height" numeric,
  	"variants_card_mime_type" varchar,
  	"variants_card_filesize" numeric,
  	"variants_card_filename" varchar,
  	"variants_card_prefix" varchar,
  	"variants_card__objectkey" varchar,
  	"variants_wide_url" varchar,
  	"variants_wide_width" numeric,
  	"variants_wide_height" numeric,
  	"variants_wide_mime_type" varchar,
  	"variants_wide_filesize" numeric,
  	"variants_wide_filename" varchar,
  	"variants_wide_prefix" varchar,
  	"variants_wide__objectkey" varchar
  );
  
  CREATE TABLE "media_locales" (
  	"alt" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE "media_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"admins_id" uuid
  );
  
  CREATE TABLE "_media_v" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"parent_id" uuid,
  	"version_prefix" varchar DEFAULT '',
  	"version__objectkey" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version_url" varchar,
  	"version_thumbnail_u_r_l" varchar,
  	"version_filename" varchar,
  	"version_mime_type" varchar,
  	"version_filesize" numeric,
  	"version_width" numeric,
  	"version_height" numeric,
  	"version_original_filename" varchar,
  	"version_original_url" varchar,
  	"version_original_mime_type" varchar,
  	"version_original_filesize" numeric,
  	"version_original_width" numeric,
  	"version_original_height" numeric,
  	"version_original_prefix" varchar,
  	"version_original__objectkey" varchar,
  	"version_focal_x" numeric,
  	"version_focal_y" numeric,
  	"version_variants_card_url" varchar,
  	"version_variants_card_width" numeric,
  	"version_variants_card_height" numeric,
  	"version_variants_card_mime_type" varchar,
  	"version_variants_card_filesize" numeric,
  	"version_variants_card_filename" varchar,
  	"version_variants_card_prefix" varchar,
  	"version_variants_card__objectkey" varchar,
  	"version_variants_wide_url" varchar,
  	"version_variants_wide_width" numeric,
  	"version_variants_wide_height" numeric,
  	"version_variants_wide_mime_type" varchar,
  	"version_variants_wide_filesize" numeric,
  	"version_variants_wide_filename" varchar,
  	"version_variants_wide_prefix" varchar,
  	"version_variants_wide__objectkey" varchar,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_media_v_locales" (
  	"version_alt" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE "_media_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"admins_id" uuid
  );
  
  CREATE TABLE "admins" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"identity_id" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"last_login_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "admins_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"admins_id" uuid
  );
  
  CREATE TABLE "_admins_v" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"parent_id" uuid,
  	"version_identity_id" varchar NOT NULL,
  	"version_email" varchar NOT NULL,
  	"version_last_login_at" timestamp(3) with time zone,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_admins_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"admins_id" uuid
  );
  
  CREATE TABLE "payload_kv" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"restaurants_id" uuid,
  	"dishes_id" uuid,
  	"deals_id" uuid,
  	"badges_id" uuid,
  	"media_id" uuid,
  	"admins_id" uuid
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"admins_id" uuid
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_llm_instructions" (
  	"id" varchar PRIMARY KEY NOT NULL,
  	"entity_slug" varchar NOT NULL,
  	"entity_type" "enum_payload_llm_instructions_entity_type" NOT NULL,
  	"additional_instructions" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_llm_instructions_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" varchar NOT NULL,
  	"path" varchar NOT NULL,
  	"admins_id" uuid
  );
  
  CREATE TABLE "deal_planner" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"enabled" boolean DEFAULT true,
  	"concurrent" numeric DEFAULT 3 NOT NULL,
  	"minimum_price" numeric DEFAULT 5 NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "deal_planner_numbers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"number" numeric,
  	"order" integer NOT NULL,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL
  );
  
  CREATE TABLE "deal_planner_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"admins_id" uuid
  );
  
  CREATE TABLE "_deal_planner_v" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"version_enabled" boolean DEFAULT true,
  	"version_concurrent" numeric DEFAULT 3 NOT NULL,
  	"version_minimum_price" numeric DEFAULT 5 NOT NULL,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_deal_planner_v_numbers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"number" numeric,
  	"order" integer NOT NULL,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL
  );
  
  CREATE TABLE "_deal_planner_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"admins_id" uuid
  );
  
  CREATE TABLE "wheel_prizes" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"kind" "enum_wheel_prizes_kind",
  	"percent" numeric,
  	"amount" numeric,
  	"max_discount" numeric,
  	"minimum_order" numeric DEFAULT 0,
  	"xp" numeric,
  	"badge_key" varchar
  );
  
  CREATE TABLE "wheel_prizes_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "wheel_profiles_weights" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"prize" varchar,
  	"weight" numeric
  );
  
  CREATE TABLE "wheel_profiles" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar
  );
  
  CREATE TABLE "wheel" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "wheel_locales" (
  	"_status" "enum_wheel_status" DEFAULT 'draft',
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE "wheel_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"admins_id" uuid
  );
  
  CREATE TABLE "_wheel_v_version_prizes" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"key" varchar,
  	"kind" "enum__wheel_v_version_prizes_kind",
  	"percent" numeric,
  	"amount" numeric,
  	"max_discount" numeric,
  	"minimum_order" numeric DEFAULT 0,
  	"xp" numeric,
  	"badge_key" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_wheel_v_version_prizes_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE "_wheel_v_version_profiles_weights" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"prize" varchar,
  	"weight" numeric,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_wheel_v_version_profiles" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"name" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_wheel_v" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"published_locale" "enum__wheel_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_wheel_v_locales" (
  	"version__status" "enum__wheel_v_version_status" DEFAULT 'draft',
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE "_wheel_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"admins_id" uuid
  );
  
  ALTER TABLE "restaurants" ADD CONSTRAINT "restaurants_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "restaurants_locales" ADD CONSTRAINT "restaurants_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "restaurants_rels" ADD CONSTRAINT "restaurants_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "restaurants_rels" ADD CONSTRAINT "restaurants_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_restaurants_v" ADD CONSTRAINT "_restaurants_v_parent_id_restaurants_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."restaurants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_restaurants_v" ADD CONSTRAINT "_restaurants_v_version_image_id_media_id_fk" FOREIGN KEY ("version_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_restaurants_v_locales" ADD CONSTRAINT "_restaurants_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_restaurants_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_restaurants_v_rels" ADD CONSTRAINT "_restaurants_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_restaurants_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_restaurants_v_rels" ADD CONSTRAINT "_restaurants_v_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "dishes_dietary" ADD CONSTRAINT "dishes_dietary_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."dishes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "dishes_allergens" ADD CONSTRAINT "dishes_allergens_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."dishes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "dishes_moods" ADD CONSTRAINT "dishes_moods_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."dishes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "dishes" ADD CONSTRAINT "dishes_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "dishes" ADD CONSTRAINT "dishes_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "dishes_locales" ADD CONSTRAINT "dishes_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."dishes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "dishes_rels" ADD CONSTRAINT "dishes_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."dishes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "dishes_rels" ADD CONSTRAINT "dishes_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_dishes_v_version_dietary" ADD CONSTRAINT "_dishes_v_version_dietary_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_dishes_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_dishes_v_version_allergens" ADD CONSTRAINT "_dishes_v_version_allergens_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_dishes_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_dishes_v_version_moods" ADD CONSTRAINT "_dishes_v_version_moods_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_dishes_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_dishes_v" ADD CONSTRAINT "_dishes_v_parent_id_dishes_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."dishes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_dishes_v" ADD CONSTRAINT "_dishes_v_version_restaurant_id_restaurants_id_fk" FOREIGN KEY ("version_restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_dishes_v" ADD CONSTRAINT "_dishes_v_version_image_id_media_id_fk" FOREIGN KEY ("version_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_dishes_v_locales" ADD CONSTRAINT "_dishes_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_dishes_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_dishes_v_rels" ADD CONSTRAINT "_dishes_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_dishes_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_dishes_v_rels" ADD CONSTRAINT "_dishes_v_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "deals" ADD CONSTRAINT "deals_dish_id_dishes_id_fk" FOREIGN KEY ("dish_id") REFERENCES "public"."dishes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "deals_rels" ADD CONSTRAINT "deals_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."deals"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "deals_rels" ADD CONSTRAINT "deals_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_deals_v" ADD CONSTRAINT "_deals_v_parent_id_deals_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."deals"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_deals_v" ADD CONSTRAINT "_deals_v_version_dish_id_dishes_id_fk" FOREIGN KEY ("version_dish_id") REFERENCES "public"."dishes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_deals_v_rels" ADD CONSTRAINT "_deals_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_deals_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_deals_v_rels" ADD CONSTRAINT "_deals_v_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "badges_locales" ADD CONSTRAINT "badges_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."badges"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "badges_rels" ADD CONSTRAINT "badges_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."badges"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "badges_rels" ADD CONSTRAINT "badges_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_badges_v" ADD CONSTRAINT "_badges_v_parent_id_badges_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."badges"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_badges_v_locales" ADD CONSTRAINT "_badges_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_badges_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_badges_v_rels" ADD CONSTRAINT "_badges_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_badges_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_badges_v_rels" ADD CONSTRAINT "_badges_v_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "media_locales" ADD CONSTRAINT "media_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "media_rels" ADD CONSTRAINT "media_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "media_rels" ADD CONSTRAINT "media_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_media_v" ADD CONSTRAINT "_media_v_parent_id_media_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_media_v_locales" ADD CONSTRAINT "_media_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_media_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_media_v_rels" ADD CONSTRAINT "_media_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_media_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_media_v_rels" ADD CONSTRAINT "_media_v_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "admins_rels" ADD CONSTRAINT "admins_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "admins_rels" ADD CONSTRAINT "admins_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_admins_v" ADD CONSTRAINT "_admins_v_parent_id_admins_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_admins_v_rels" ADD CONSTRAINT "_admins_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_admins_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_admins_v_rels" ADD CONSTRAINT "_admins_v_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_restaurants_fk" FOREIGN KEY ("restaurants_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_dishes_fk" FOREIGN KEY ("dishes_id") REFERENCES "public"."dishes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_deals_fk" FOREIGN KEY ("deals_id") REFERENCES "public"."deals"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_badges_fk" FOREIGN KEY ("badges_id") REFERENCES "public"."badges"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_llm_instructions_rels" ADD CONSTRAINT "payload_llm_instructions_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_llm_instructions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_llm_instructions_rels" ADD CONSTRAINT "payload_llm_instructions_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "deal_planner_numbers" ADD CONSTRAINT "deal_planner_numbers_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."deal_planner"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "deal_planner_rels" ADD CONSTRAINT "deal_planner_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."deal_planner"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "deal_planner_rels" ADD CONSTRAINT "deal_planner_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_deal_planner_v_numbers" ADD CONSTRAINT "_deal_planner_v_numbers_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_deal_planner_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_deal_planner_v_rels" ADD CONSTRAINT "_deal_planner_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_deal_planner_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_deal_planner_v_rels" ADD CONSTRAINT "_deal_planner_v_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "wheel_prizes" ADD CONSTRAINT "wheel_prizes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."wheel"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "wheel_prizes_locales" ADD CONSTRAINT "wheel_prizes_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."wheel_prizes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "wheel_profiles_weights" ADD CONSTRAINT "wheel_profiles_weights_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."wheel_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "wheel_profiles" ADD CONSTRAINT "wheel_profiles_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."wheel"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "wheel_locales" ADD CONSTRAINT "wheel_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."wheel"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "wheel_rels" ADD CONSTRAINT "wheel_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."wheel"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "wheel_rels" ADD CONSTRAINT "wheel_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_wheel_v_version_prizes" ADD CONSTRAINT "_wheel_v_version_prizes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_wheel_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_wheel_v_version_prizes_locales" ADD CONSTRAINT "_wheel_v_version_prizes_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_wheel_v_version_prizes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_wheel_v_version_profiles_weights" ADD CONSTRAINT "_wheel_v_version_profiles_weights_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_wheel_v_version_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_wheel_v_version_profiles" ADD CONSTRAINT "_wheel_v_version_profiles_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_wheel_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_wheel_v_locales" ADD CONSTRAINT "_wheel_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_wheel_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_wheel_v_rels" ADD CONSTRAINT "_wheel_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_wheel_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_wheel_v_rels" ADD CONSTRAINT "_wheel_v_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "outbox_events_unpublished_idx" ON "outbox_events" USING btree ("position") WHERE "outbox_events"."published_at" is null;
  CREATE UNIQUE INDEX "restaurants_slug_idx" ON "restaurants" USING btree ("slug");
  CREATE INDEX "restaurants_image_idx" ON "restaurants" USING btree ("image_id");
  CREATE INDEX "restaurants_updated_at_idx" ON "restaurants" USING btree ("updated_at");
  CREATE INDEX "restaurants_created_at_idx" ON "restaurants" USING btree ("created_at");
  CREATE INDEX "restaurants__status_idx" ON "restaurants_locales" USING btree ("_status","_locale");
  CREATE UNIQUE INDEX "restaurants_locales_parent_id_locale_unique" ON "restaurants_locales" USING btree ("_parent_id","_locale");
  CREATE INDEX "restaurants_rels_order_idx" ON "restaurants_rels" USING btree ("order");
  CREATE INDEX "restaurants_rels_parent_idx" ON "restaurants_rels" USING btree ("parent_id");
  CREATE INDEX "restaurants_rels_path_idx" ON "restaurants_rels" USING btree ("path");
  CREATE INDEX "restaurants_rels_admins_id_idx" ON "restaurants_rels" USING btree ("admins_id");
  CREATE INDEX "_restaurants_v_parent_idx" ON "_restaurants_v" USING btree ("parent_id");
  CREATE INDEX "_restaurants_v_version_version_slug_idx" ON "_restaurants_v" USING btree ("version_slug");
  CREATE INDEX "_restaurants_v_version_version_image_idx" ON "_restaurants_v" USING btree ("version_image_id");
  CREATE INDEX "_restaurants_v_version_version_updated_at_idx" ON "_restaurants_v" USING btree ("version_updated_at");
  CREATE INDEX "_restaurants_v_version_version_created_at_idx" ON "_restaurants_v" USING btree ("version_created_at");
  CREATE INDEX "_restaurants_v_created_at_idx" ON "_restaurants_v" USING btree ("created_at");
  CREATE INDEX "_restaurants_v_updated_at_idx" ON "_restaurants_v" USING btree ("updated_at");
  CREATE INDEX "_restaurants_v_published_locale_idx" ON "_restaurants_v" USING btree ("published_locale");
  CREATE INDEX "_restaurants_v_latest_idx" ON "_restaurants_v" USING btree ("latest");
  CREATE INDEX "_restaurants_v_version_version__status_idx" ON "_restaurants_v_locales" USING btree ("version__status","_locale");
  CREATE UNIQUE INDEX "_restaurants_v_locales_parent_id_locale_unique" ON "_restaurants_v_locales" USING btree ("_parent_id","_locale");
  CREATE INDEX "_restaurants_v_rels_order_idx" ON "_restaurants_v_rels" USING btree ("order");
  CREATE INDEX "_restaurants_v_rels_parent_idx" ON "_restaurants_v_rels" USING btree ("parent_id");
  CREATE INDEX "_restaurants_v_rels_path_idx" ON "_restaurants_v_rels" USING btree ("path");
  CREATE INDEX "_restaurants_v_rels_admins_id_idx" ON "_restaurants_v_rels" USING btree ("admins_id");
  CREATE INDEX "dishes_dietary_order_idx" ON "dishes_dietary" USING btree ("order");
  CREATE INDEX "dishes_dietary_parent_idx" ON "dishes_dietary" USING btree ("parent_id");
  CREATE INDEX "dishes_allergens_order_idx" ON "dishes_allergens" USING btree ("order");
  CREATE INDEX "dishes_allergens_parent_idx" ON "dishes_allergens" USING btree ("parent_id");
  CREATE INDEX "dishes_moods_order_idx" ON "dishes_moods" USING btree ("order");
  CREATE INDEX "dishes_moods_parent_idx" ON "dishes_moods" USING btree ("parent_id");
  CREATE INDEX "dishes_restaurant_idx" ON "dishes" USING btree ("restaurant_id");
  CREATE INDEX "dishes_slug_idx" ON "dishes" USING btree ("slug");
  CREATE INDEX "dishes_image_idx" ON "dishes" USING btree ("image_id");
  CREATE INDEX "dishes_updated_at_idx" ON "dishes" USING btree ("updated_at");
  CREATE INDEX "dishes_created_at_idx" ON "dishes" USING btree ("created_at");
  CREATE INDEX "dishes__status_idx" ON "dishes_locales" USING btree ("_status","_locale");
  CREATE UNIQUE INDEX "dishes_locales_parent_id_locale_unique" ON "dishes_locales" USING btree ("_parent_id","_locale");
  CREATE INDEX "dishes_rels_order_idx" ON "dishes_rels" USING btree ("order");
  CREATE INDEX "dishes_rels_parent_idx" ON "dishes_rels" USING btree ("parent_id");
  CREATE INDEX "dishes_rels_path_idx" ON "dishes_rels" USING btree ("path");
  CREATE INDEX "dishes_rels_admins_id_idx" ON "dishes_rels" USING btree ("admins_id");
  CREATE INDEX "_dishes_v_version_dietary_order_idx" ON "_dishes_v_version_dietary" USING btree ("order");
  CREATE INDEX "_dishes_v_version_dietary_parent_idx" ON "_dishes_v_version_dietary" USING btree ("parent_id");
  CREATE INDEX "_dishes_v_version_allergens_order_idx" ON "_dishes_v_version_allergens" USING btree ("order");
  CREATE INDEX "_dishes_v_version_allergens_parent_idx" ON "_dishes_v_version_allergens" USING btree ("parent_id");
  CREATE INDEX "_dishes_v_version_moods_order_idx" ON "_dishes_v_version_moods" USING btree ("order");
  CREATE INDEX "_dishes_v_version_moods_parent_idx" ON "_dishes_v_version_moods" USING btree ("parent_id");
  CREATE INDEX "_dishes_v_parent_idx" ON "_dishes_v" USING btree ("parent_id");
  CREATE INDEX "_dishes_v_version_version_restaurant_idx" ON "_dishes_v" USING btree ("version_restaurant_id");
  CREATE INDEX "_dishes_v_version_version_slug_idx" ON "_dishes_v" USING btree ("version_slug");
  CREATE INDEX "_dishes_v_version_version_image_idx" ON "_dishes_v" USING btree ("version_image_id");
  CREATE INDEX "_dishes_v_version_version_updated_at_idx" ON "_dishes_v" USING btree ("version_updated_at");
  CREATE INDEX "_dishes_v_version_version_created_at_idx" ON "_dishes_v" USING btree ("version_created_at");
  CREATE INDEX "_dishes_v_created_at_idx" ON "_dishes_v" USING btree ("created_at");
  CREATE INDEX "_dishes_v_updated_at_idx" ON "_dishes_v" USING btree ("updated_at");
  CREATE INDEX "_dishes_v_published_locale_idx" ON "_dishes_v" USING btree ("published_locale");
  CREATE INDEX "_dishes_v_latest_idx" ON "_dishes_v" USING btree ("latest");
  CREATE INDEX "_dishes_v_version_version__status_idx" ON "_dishes_v_locales" USING btree ("version__status","_locale");
  CREATE UNIQUE INDEX "_dishes_v_locales_parent_id_locale_unique" ON "_dishes_v_locales" USING btree ("_parent_id","_locale");
  CREATE INDEX "_dishes_v_rels_order_idx" ON "_dishes_v_rels" USING btree ("order");
  CREATE INDEX "_dishes_v_rels_parent_idx" ON "_dishes_v_rels" USING btree ("parent_id");
  CREATE INDEX "_dishes_v_rels_path_idx" ON "_dishes_v_rels" USING btree ("path");
  CREATE INDEX "_dishes_v_rels_admins_id_idx" ON "_dishes_v_rels" USING btree ("admins_id");
  CREATE INDEX "deals_dish_idx" ON "deals" USING btree ("dish_id");
  CREATE INDEX "deals_updated_at_idx" ON "deals" USING btree ("updated_at");
  CREATE INDEX "deals_created_at_idx" ON "deals" USING btree ("created_at");
  CREATE INDEX "deals_rels_order_idx" ON "deals_rels" USING btree ("order");
  CREATE INDEX "deals_rels_parent_idx" ON "deals_rels" USING btree ("parent_id");
  CREATE INDEX "deals_rels_path_idx" ON "deals_rels" USING btree ("path");
  CREATE INDEX "deals_rels_admins_id_idx" ON "deals_rels" USING btree ("admins_id");
  CREATE INDEX "_deals_v_parent_idx" ON "_deals_v" USING btree ("parent_id");
  CREATE INDEX "_deals_v_version_version_dish_idx" ON "_deals_v" USING btree ("version_dish_id");
  CREATE INDEX "_deals_v_version_version_updated_at_idx" ON "_deals_v" USING btree ("version_updated_at");
  CREATE INDEX "_deals_v_version_version_created_at_idx" ON "_deals_v" USING btree ("version_created_at");
  CREATE INDEX "_deals_v_created_at_idx" ON "_deals_v" USING btree ("created_at");
  CREATE INDEX "_deals_v_updated_at_idx" ON "_deals_v" USING btree ("updated_at");
  CREATE INDEX "_deals_v_rels_order_idx" ON "_deals_v_rels" USING btree ("order");
  CREATE INDEX "_deals_v_rels_parent_idx" ON "_deals_v_rels" USING btree ("parent_id");
  CREATE INDEX "_deals_v_rels_path_idx" ON "_deals_v_rels" USING btree ("path");
  CREATE INDEX "_deals_v_rels_admins_id_idx" ON "_deals_v_rels" USING btree ("admins_id");
  CREATE UNIQUE INDEX "badges_key_idx" ON "badges" USING btree ("key");
  CREATE INDEX "badges_updated_at_idx" ON "badges" USING btree ("updated_at");
  CREATE INDEX "badges_created_at_idx" ON "badges" USING btree ("created_at");
  CREATE INDEX "badges__status_idx" ON "badges_locales" USING btree ("_status","_locale");
  CREATE UNIQUE INDEX "badges_locales_parent_id_locale_unique" ON "badges_locales" USING btree ("_parent_id","_locale");
  CREATE INDEX "badges_rels_order_idx" ON "badges_rels" USING btree ("order");
  CREATE INDEX "badges_rels_parent_idx" ON "badges_rels" USING btree ("parent_id");
  CREATE INDEX "badges_rels_path_idx" ON "badges_rels" USING btree ("path");
  CREATE INDEX "badges_rels_admins_id_idx" ON "badges_rels" USING btree ("admins_id");
  CREATE INDEX "_badges_v_parent_idx" ON "_badges_v" USING btree ("parent_id");
  CREATE INDEX "_badges_v_version_version_key_idx" ON "_badges_v" USING btree ("version_key");
  CREATE INDEX "_badges_v_version_version_updated_at_idx" ON "_badges_v" USING btree ("version_updated_at");
  CREATE INDEX "_badges_v_version_version_created_at_idx" ON "_badges_v" USING btree ("version_created_at");
  CREATE INDEX "_badges_v_created_at_idx" ON "_badges_v" USING btree ("created_at");
  CREATE INDEX "_badges_v_updated_at_idx" ON "_badges_v" USING btree ("updated_at");
  CREATE INDEX "_badges_v_published_locale_idx" ON "_badges_v" USING btree ("published_locale");
  CREATE INDEX "_badges_v_latest_idx" ON "_badges_v" USING btree ("latest");
  CREATE INDEX "_badges_v_version_version__status_idx" ON "_badges_v_locales" USING btree ("version__status","_locale");
  CREATE UNIQUE INDEX "_badges_v_locales_parent_id_locale_unique" ON "_badges_v_locales" USING btree ("_parent_id","_locale");
  CREATE INDEX "_badges_v_rels_order_idx" ON "_badges_v_rels" USING btree ("order");
  CREATE INDEX "_badges_v_rels_parent_idx" ON "_badges_v_rels" USING btree ("parent_id");
  CREATE INDEX "_badges_v_rels_path_idx" ON "_badges_v_rels" USING btree ("path");
  CREATE INDEX "_badges_v_rels_admins_id_idx" ON "_badges_v_rels" USING btree ("admins_id");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_original_original_filename_idx" ON "media" USING btree ("original_filename");
  CREATE INDEX "media_variants_card_variants_card_filename_idx" ON "media" USING btree ("variants_card_filename");
  CREATE INDEX "media_variants_wide_variants_wide_filename_idx" ON "media" USING btree ("variants_wide_filename");
  CREATE UNIQUE INDEX "media_locales_parent_id_locale_unique" ON "media_locales" USING btree ("_parent_id","_locale");
  CREATE INDEX "media_rels_order_idx" ON "media_rels" USING btree ("order");
  CREATE INDEX "media_rels_parent_idx" ON "media_rels" USING btree ("parent_id");
  CREATE INDEX "media_rels_path_idx" ON "media_rels" USING btree ("path");
  CREATE INDEX "media_rels_admins_id_idx" ON "media_rels" USING btree ("admins_id");
  CREATE INDEX "_media_v_parent_idx" ON "_media_v" USING btree ("parent_id");
  CREATE INDEX "_media_v_version_version_updated_at_idx" ON "_media_v" USING btree ("version_updated_at");
  CREATE INDEX "_media_v_version_version_created_at_idx" ON "_media_v" USING btree ("version_created_at");
  CREATE INDEX "_media_v_version_version_filename_idx" ON "_media_v" USING btree ("version_filename");
  CREATE INDEX "_media_v_version_original_version_original_filename_idx" ON "_media_v" USING btree ("version_original_filename");
  CREATE INDEX "_media_v_version_variants_card_version_variants_card_fil_idx" ON "_media_v" USING btree ("version_variants_card_filename");
  CREATE INDEX "_media_v_version_variants_wide_version_variants_wide_fil_idx" ON "_media_v" USING btree ("version_variants_wide_filename");
  CREATE INDEX "_media_v_created_at_idx" ON "_media_v" USING btree ("created_at");
  CREATE INDEX "_media_v_updated_at_idx" ON "_media_v" USING btree ("updated_at");
  CREATE UNIQUE INDEX "_media_v_locales_parent_id_locale_unique" ON "_media_v_locales" USING btree ("_parent_id","_locale");
  CREATE INDEX "_media_v_rels_order_idx" ON "_media_v_rels" USING btree ("order");
  CREATE INDEX "_media_v_rels_parent_idx" ON "_media_v_rels" USING btree ("parent_id");
  CREATE INDEX "_media_v_rels_path_idx" ON "_media_v_rels" USING btree ("path");
  CREATE INDEX "_media_v_rels_admins_id_idx" ON "_media_v_rels" USING btree ("admins_id");
  CREATE UNIQUE INDEX "admins_identity_id_idx" ON "admins" USING btree ("identity_id");
  CREATE INDEX "admins_updated_at_idx" ON "admins" USING btree ("updated_at");
  CREATE INDEX "admins_created_at_idx" ON "admins" USING btree ("created_at");
  CREATE INDEX "admins_rels_order_idx" ON "admins_rels" USING btree ("order");
  CREATE INDEX "admins_rels_parent_idx" ON "admins_rels" USING btree ("parent_id");
  CREATE INDEX "admins_rels_path_idx" ON "admins_rels" USING btree ("path");
  CREATE INDEX "admins_rels_admins_id_idx" ON "admins_rels" USING btree ("admins_id");
  CREATE INDEX "_admins_v_parent_idx" ON "_admins_v" USING btree ("parent_id");
  CREATE INDEX "_admins_v_version_version_identity_id_idx" ON "_admins_v" USING btree ("version_identity_id");
  CREATE INDEX "_admins_v_version_version_updated_at_idx" ON "_admins_v" USING btree ("version_updated_at");
  CREATE INDEX "_admins_v_version_version_created_at_idx" ON "_admins_v" USING btree ("version_created_at");
  CREATE INDEX "_admins_v_created_at_idx" ON "_admins_v" USING btree ("created_at");
  CREATE INDEX "_admins_v_updated_at_idx" ON "_admins_v" USING btree ("updated_at");
  CREATE INDEX "_admins_v_rels_order_idx" ON "_admins_v_rels" USING btree ("order");
  CREATE INDEX "_admins_v_rels_parent_idx" ON "_admins_v_rels" USING btree ("parent_id");
  CREATE INDEX "_admins_v_rels_path_idx" ON "_admins_v_rels" USING btree ("path");
  CREATE INDEX "_admins_v_rels_admins_id_idx" ON "_admins_v_rels" USING btree ("admins_id");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_restaurants_id_idx" ON "payload_locked_documents_rels" USING btree ("restaurants_id");
  CREATE INDEX "payload_locked_documents_rels_dishes_id_idx" ON "payload_locked_documents_rels" USING btree ("dishes_id");
  CREATE INDEX "payload_locked_documents_rels_deals_id_idx" ON "payload_locked_documents_rels" USING btree ("deals_id");
  CREATE INDEX "payload_locked_documents_rels_badges_id_idx" ON "payload_locked_documents_rels" USING btree ("badges_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_admins_id_idx" ON "payload_locked_documents_rels" USING btree ("admins_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_admins_id_idx" ON "payload_preferences_rels" USING btree ("admins_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX "payload_llm_instructions_entity_slug_idx" ON "payload_llm_instructions" USING btree ("entity_slug");
  CREATE INDEX "payload_llm_instructions_updated_at_idx" ON "payload_llm_instructions" USING btree ("updated_at");
  CREATE INDEX "payload_llm_instructions_created_at_idx" ON "payload_llm_instructions" USING btree ("created_at");
  CREATE INDEX "payload_llm_instructions_rels_order_idx" ON "payload_llm_instructions_rels" USING btree ("order");
  CREATE INDEX "payload_llm_instructions_rels_parent_idx" ON "payload_llm_instructions_rels" USING btree ("parent_id");
  CREATE INDEX "payload_llm_instructions_rels_path_idx" ON "payload_llm_instructions_rels" USING btree ("path");
  CREATE INDEX "payload_llm_instructions_rels_admins_id_idx" ON "payload_llm_instructions_rels" USING btree ("admins_id");
  CREATE INDEX "deal_planner_numbers_order_parent_idx" ON "deal_planner_numbers" USING btree ("order","parent_id");
  CREATE INDEX "deal_planner_rels_order_idx" ON "deal_planner_rels" USING btree ("order");
  CREATE INDEX "deal_planner_rels_parent_idx" ON "deal_planner_rels" USING btree ("parent_id");
  CREATE INDEX "deal_planner_rels_path_idx" ON "deal_planner_rels" USING btree ("path");
  CREATE INDEX "deal_planner_rels_admins_id_idx" ON "deal_planner_rels" USING btree ("admins_id");
  CREATE INDEX "_deal_planner_v_created_at_idx" ON "_deal_planner_v" USING btree ("created_at");
  CREATE INDEX "_deal_planner_v_updated_at_idx" ON "_deal_planner_v" USING btree ("updated_at");
  CREATE INDEX "_deal_planner_v_numbers_order_parent_idx" ON "_deal_planner_v_numbers" USING btree ("order","parent_id");
  CREATE INDEX "_deal_planner_v_rels_order_idx" ON "_deal_planner_v_rels" USING btree ("order");
  CREATE INDEX "_deal_planner_v_rels_parent_idx" ON "_deal_planner_v_rels" USING btree ("parent_id");
  CREATE INDEX "_deal_planner_v_rels_path_idx" ON "_deal_planner_v_rels" USING btree ("path");
  CREATE INDEX "_deal_planner_v_rels_admins_id_idx" ON "_deal_planner_v_rels" USING btree ("admins_id");
  CREATE INDEX "wheel_prizes_order_idx" ON "wheel_prizes" USING btree ("_order");
  CREATE INDEX "wheel_prizes_parent_id_idx" ON "wheel_prizes" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "wheel_prizes_locales_parent_id_locale_unique" ON "wheel_prizes_locales" USING btree ("_parent_id","_locale");
  CREATE INDEX "wheel_profiles_weights_order_idx" ON "wheel_profiles_weights" USING btree ("_order");
  CREATE INDEX "wheel_profiles_weights_parent_id_idx" ON "wheel_profiles_weights" USING btree ("_parent_id");
  CREATE INDEX "wheel_profiles_order_idx" ON "wheel_profiles" USING btree ("_order");
  CREATE INDEX "wheel_profiles_parent_id_idx" ON "wheel_profiles" USING btree ("_parent_id");
  CREATE INDEX "wheel__status_idx" ON "wheel_locales" USING btree ("_status","_locale");
  CREATE UNIQUE INDEX "wheel_locales_parent_id_locale_unique" ON "wheel_locales" USING btree ("_parent_id","_locale");
  CREATE INDEX "wheel_rels_order_idx" ON "wheel_rels" USING btree ("order");
  CREATE INDEX "wheel_rels_parent_idx" ON "wheel_rels" USING btree ("parent_id");
  CREATE INDEX "wheel_rels_path_idx" ON "wheel_rels" USING btree ("path");
  CREATE INDEX "wheel_rels_admins_id_idx" ON "wheel_rels" USING btree ("admins_id");
  CREATE INDEX "_wheel_v_version_prizes_order_idx" ON "_wheel_v_version_prizes" USING btree ("_order");
  CREATE INDEX "_wheel_v_version_prizes_parent_id_idx" ON "_wheel_v_version_prizes" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_wheel_v_version_prizes_locales_parent_id_locale_unique" ON "_wheel_v_version_prizes_locales" USING btree ("_parent_id","_locale");
  CREATE INDEX "_wheel_v_version_profiles_weights_order_idx" ON "_wheel_v_version_profiles_weights" USING btree ("_order");
  CREATE INDEX "_wheel_v_version_profiles_weights_parent_id_idx" ON "_wheel_v_version_profiles_weights" USING btree ("_parent_id");
  CREATE INDEX "_wheel_v_version_profiles_order_idx" ON "_wheel_v_version_profiles" USING btree ("_order");
  CREATE INDEX "_wheel_v_version_profiles_parent_id_idx" ON "_wheel_v_version_profiles" USING btree ("_parent_id");
  CREATE INDEX "_wheel_v_created_at_idx" ON "_wheel_v" USING btree ("created_at");
  CREATE INDEX "_wheel_v_updated_at_idx" ON "_wheel_v" USING btree ("updated_at");
  CREATE INDEX "_wheel_v_published_locale_idx" ON "_wheel_v" USING btree ("published_locale");
  CREATE INDEX "_wheel_v_latest_idx" ON "_wheel_v" USING btree ("latest");
  CREATE INDEX "_wheel_v_version_version__status_idx" ON "_wheel_v_locales" USING btree ("version__status","_locale");
  CREATE UNIQUE INDEX "_wheel_v_locales_parent_id_locale_unique" ON "_wheel_v_locales" USING btree ("_parent_id","_locale");
  CREATE INDEX "_wheel_v_rels_order_idx" ON "_wheel_v_rels" USING btree ("order");
  CREATE INDEX "_wheel_v_rels_parent_idx" ON "_wheel_v_rels" USING btree ("parent_id");
  CREATE INDEX "_wheel_v_rels_path_idx" ON "_wheel_v_rels" USING btree ("path");
  CREATE INDEX "_wheel_v_rels_admins_id_idx" ON "_wheel_v_rels" USING btree ("admins_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "outbox_events" CASCADE;
  DROP TABLE "restaurants" CASCADE;
  DROP TABLE "restaurants_locales" CASCADE;
  DROP TABLE "restaurants_rels" CASCADE;
  DROP TABLE "_restaurants_v" CASCADE;
  DROP TABLE "_restaurants_v_locales" CASCADE;
  DROP TABLE "_restaurants_v_rels" CASCADE;
  DROP TABLE "dishes_dietary" CASCADE;
  DROP TABLE "dishes_allergens" CASCADE;
  DROP TABLE "dishes_moods" CASCADE;
  DROP TABLE "dishes" CASCADE;
  DROP TABLE "dishes_locales" CASCADE;
  DROP TABLE "dishes_rels" CASCADE;
  DROP TABLE "_dishes_v_version_dietary" CASCADE;
  DROP TABLE "_dishes_v_version_allergens" CASCADE;
  DROP TABLE "_dishes_v_version_moods" CASCADE;
  DROP TABLE "_dishes_v" CASCADE;
  DROP TABLE "_dishes_v_locales" CASCADE;
  DROP TABLE "_dishes_v_rels" CASCADE;
  DROP TABLE "deals" CASCADE;
  DROP TABLE "deals_rels" CASCADE;
  DROP TABLE "_deals_v" CASCADE;
  DROP TABLE "_deals_v_rels" CASCADE;
  DROP TABLE "badges" CASCADE;
  DROP TABLE "badges_locales" CASCADE;
  DROP TABLE "badges_rels" CASCADE;
  DROP TABLE "_badges_v" CASCADE;
  DROP TABLE "_badges_v_locales" CASCADE;
  DROP TABLE "_badges_v_rels" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "media_locales" CASCADE;
  DROP TABLE "media_rels" CASCADE;
  DROP TABLE "_media_v" CASCADE;
  DROP TABLE "_media_v_locales" CASCADE;
  DROP TABLE "_media_v_rels" CASCADE;
  DROP TABLE "admins" CASCADE;
  DROP TABLE "admins_rels" CASCADE;
  DROP TABLE "_admins_v" CASCADE;
  DROP TABLE "_admins_v_rels" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "payload_llm_instructions" CASCADE;
  DROP TABLE "payload_llm_instructions_rels" CASCADE;
  DROP TABLE "deal_planner" CASCADE;
  DROP TABLE "deal_planner_numbers" CASCADE;
  DROP TABLE "deal_planner_rels" CASCADE;
  DROP TABLE "_deal_planner_v" CASCADE;
  DROP TABLE "_deal_planner_v_numbers" CASCADE;
  DROP TABLE "_deal_planner_v_rels" CASCADE;
  DROP TABLE "wheel_prizes" CASCADE;
  DROP TABLE "wheel_prizes_locales" CASCADE;
  DROP TABLE "wheel_profiles_weights" CASCADE;
  DROP TABLE "wheel_profiles" CASCADE;
  DROP TABLE "wheel" CASCADE;
  DROP TABLE "wheel_locales" CASCADE;
  DROP TABLE "wheel_rels" CASCADE;
  DROP TABLE "_wheel_v_version_prizes" CASCADE;
  DROP TABLE "_wheel_v_version_prizes_locales" CASCADE;
  DROP TABLE "_wheel_v_version_profiles_weights" CASCADE;
  DROP TABLE "_wheel_v_version_profiles" CASCADE;
  DROP TABLE "_wheel_v" CASCADE;
  DROP TABLE "_wheel_v_locales" CASCADE;
  DROP TABLE "_wheel_v_rels" CASCADE;
  DROP TYPE "public"."_locales";
  DROP TYPE "public"."enum_restaurants_cuisine";
  DROP TYPE "public"."enum_restaurants_status";
  DROP TYPE "public"."enum__restaurants_v_version_cuisine";
  DROP TYPE "public"."enum__restaurants_v_published_locale";
  DROP TYPE "public"."enum__restaurants_v_version_status";
  DROP TYPE "public"."enum_dishes_dietary";
  DROP TYPE "public"."enum_dishes_allergens";
  DROP TYPE "public"."enum_dishes_moods";
  DROP TYPE "public"."enum_dishes_status";
  DROP TYPE "public"."enum__dishes_v_version_dietary";
  DROP TYPE "public"."enum__dishes_v_version_allergens";
  DROP TYPE "public"."enum__dishes_v_version_moods";
  DROP TYPE "public"."enum__dishes_v_published_locale";
  DROP TYPE "public"."enum__dishes_v_version_status";
  DROP TYPE "public"."enum_badges_tier";
  DROP TYPE "public"."enum_badges_rule_type";
  DROP TYPE "public"."enum_badges_status";
  DROP TYPE "public"."enum__badges_v_version_tier";
  DROP TYPE "public"."enum__badges_v_version_rule_type";
  DROP TYPE "public"."enum__badges_v_published_locale";
  DROP TYPE "public"."enum__badges_v_version_status";
  DROP TYPE "public"."enum_payload_llm_instructions_entity_type";
  DROP TYPE "public"."enum_wheel_prizes_kind";
  DROP TYPE "public"."enum_wheel_status";
  DROP TYPE "public"."enum__wheel_v_version_prizes_kind";
  DROP TYPE "public"."enum__wheel_v_published_locale";
  DROP TYPE "public"."enum__wheel_v_version_status";`)
}
