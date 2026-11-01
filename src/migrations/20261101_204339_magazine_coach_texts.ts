import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_articles_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__articles_v_published_locale" AS ENUM('de', 'en');
  CREATE TYPE "public"."enum__articles_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_texts_namespace" AS ENUM('web', 'ui');
  CREATE TABLE "articles" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"slug" varchar,
  	"cover_id" uuid,
  	"category_id" uuid,
  	"published_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "articles_locales" (
  	"title" varchar,
  	"excerpt" varchar,
  	"body" jsonb,
  	"_status" "enum_articles_status" DEFAULT 'draft',
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE "articles_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"tags_id" uuid,
  	"admins_id" uuid
  );
  
  CREATE TABLE "_articles_v" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"parent_id" uuid,
  	"version_slug" varchar,
  	"version_cover_id" uuid,
  	"version_category_id" uuid,
  	"version_published_at" timestamp(3) with time zone,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"published_locale" "enum__articles_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_articles_v_locales" (
  	"version_title" varchar,
  	"version_excerpt" varchar,
  	"version_body" jsonb,
  	"version__status" "enum__articles_v_version_status" DEFAULT 'draft',
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE "_articles_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"tags_id" uuid,
  	"admins_id" uuid
  );
  
  CREATE TABLE "article_categories" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"slug" varchar NOT NULL,
  	"position" numeric DEFAULT 0 NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "article_categories_locales" (
  	"name" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE "article_categories_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"admins_id" uuid
  );
  
  CREATE TABLE "tags" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"slug" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "tags_locales" (
  	"name" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE "tags_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"admins_id" uuid
  );
  
  CREATE TABLE "texts" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"key" varchar NOT NULL,
  	"namespace" "enum_texts_namespace" NOT NULL,
  	"default_de" varchar,
  	"default_en" varchar,
  	"orphaned" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "texts_locales" (
  	"value" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE "texts_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"admins_id" uuid
  );
  
  CREATE TABLE "coach_suggestions_suggestions" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "coach_suggestions_suggestions_locales" (
  	"text" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "coach_suggestions" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "coach_suggestions_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"admins_id" uuid
  );
  
  CREATE TABLE "_coach_suggestions_v_version_suggestions" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_coach_suggestions_v_version_suggestions_locales" (
  	"text" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE "_coach_suggestions_v" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_coach_suggestions_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"admins_id" uuid
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "articles_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "article_categories_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "tags_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "texts_id" uuid;
  ALTER TABLE "articles" ADD CONSTRAINT "articles_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "articles" ADD CONSTRAINT "articles_category_id_article_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."article_categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "articles_locales" ADD CONSTRAINT "articles_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_rels" ADD CONSTRAINT "articles_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_rels" ADD CONSTRAINT "articles_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_rels" ADD CONSTRAINT "articles_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v" ADD CONSTRAINT "_articles_v_parent_id_articles_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."articles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_articles_v" ADD CONSTRAINT "_articles_v_version_cover_id_media_id_fk" FOREIGN KEY ("version_cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_articles_v" ADD CONSTRAINT "_articles_v_version_category_id_article_categories_id_fk" FOREIGN KEY ("version_category_id") REFERENCES "public"."article_categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_articles_v_locales" ADD CONSTRAINT "_articles_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_articles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v_rels" ADD CONSTRAINT "_articles_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_articles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v_rels" ADD CONSTRAINT "_articles_v_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v_rels" ADD CONSTRAINT "_articles_v_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "article_categories_locales" ADD CONSTRAINT "article_categories_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."article_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "article_categories_rels" ADD CONSTRAINT "article_categories_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."article_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "article_categories_rels" ADD CONSTRAINT "article_categories_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tags_locales" ADD CONSTRAINT "tags_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tags_rels" ADD CONSTRAINT "tags_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tags_rels" ADD CONSTRAINT "tags_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "texts_locales" ADD CONSTRAINT "texts_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."texts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "texts_rels" ADD CONSTRAINT "texts_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."texts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "texts_rels" ADD CONSTRAINT "texts_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "coach_suggestions_suggestions" ADD CONSTRAINT "coach_suggestions_suggestions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."coach_suggestions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "coach_suggestions_suggestions_locales" ADD CONSTRAINT "coach_suggestions_suggestions_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."coach_suggestions_suggestions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "coach_suggestions_rels" ADD CONSTRAINT "coach_suggestions_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."coach_suggestions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "coach_suggestions_rels" ADD CONSTRAINT "coach_suggestions_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_coach_suggestions_v_version_suggestions" ADD CONSTRAINT "_coach_suggestions_v_version_suggestions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_coach_suggestions_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_coach_suggestions_v_version_suggestions_locales" ADD CONSTRAINT "_coach_suggestions_v_version_suggestions_locales_parent_i_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_coach_suggestions_v_version_suggestions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_coach_suggestions_v_rels" ADD CONSTRAINT "_coach_suggestions_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_coach_suggestions_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_coach_suggestions_v_rels" ADD CONSTRAINT "_coach_suggestions_v_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "articles_slug_idx" ON "articles" USING btree ("slug");
  CREATE INDEX "articles_cover_idx" ON "articles" USING btree ("cover_id");
  CREATE INDEX "articles_category_idx" ON "articles" USING btree ("category_id");
  CREATE INDEX "articles_updated_at_idx" ON "articles" USING btree ("updated_at");
  CREATE INDEX "articles_created_at_idx" ON "articles" USING btree ("created_at");
  CREATE INDEX "articles__status_idx" ON "articles_locales" USING btree ("_status","_locale");
  CREATE UNIQUE INDEX "articles_locales_parent_id_locale_unique" ON "articles_locales" USING btree ("_parent_id","_locale");
  CREATE INDEX "articles_rels_order_idx" ON "articles_rels" USING btree ("order");
  CREATE INDEX "articles_rels_parent_idx" ON "articles_rels" USING btree ("parent_id");
  CREATE INDEX "articles_rels_path_idx" ON "articles_rels" USING btree ("path");
  CREATE INDEX "articles_rels_tags_id_idx" ON "articles_rels" USING btree ("tags_id");
  CREATE INDEX "articles_rels_admins_id_idx" ON "articles_rels" USING btree ("admins_id");
  CREATE INDEX "_articles_v_parent_idx" ON "_articles_v" USING btree ("parent_id");
  CREATE INDEX "_articles_v_version_version_slug_idx" ON "_articles_v" USING btree ("version_slug");
  CREATE INDEX "_articles_v_version_version_cover_idx" ON "_articles_v" USING btree ("version_cover_id");
  CREATE INDEX "_articles_v_version_version_category_idx" ON "_articles_v" USING btree ("version_category_id");
  CREATE INDEX "_articles_v_version_version_updated_at_idx" ON "_articles_v" USING btree ("version_updated_at");
  CREATE INDEX "_articles_v_version_version_created_at_idx" ON "_articles_v" USING btree ("version_created_at");
  CREATE INDEX "_articles_v_created_at_idx" ON "_articles_v" USING btree ("created_at");
  CREATE INDEX "_articles_v_updated_at_idx" ON "_articles_v" USING btree ("updated_at");
  CREATE INDEX "_articles_v_published_locale_idx" ON "_articles_v" USING btree ("published_locale");
  CREATE INDEX "_articles_v_latest_idx" ON "_articles_v" USING btree ("latest");
  CREATE INDEX "_articles_v_version_version__status_idx" ON "_articles_v_locales" USING btree ("version__status","_locale");
  CREATE UNIQUE INDEX "_articles_v_locales_parent_id_locale_unique" ON "_articles_v_locales" USING btree ("_parent_id","_locale");
  CREATE INDEX "_articles_v_rels_order_idx" ON "_articles_v_rels" USING btree ("order");
  CREATE INDEX "_articles_v_rels_parent_idx" ON "_articles_v_rels" USING btree ("parent_id");
  CREATE INDEX "_articles_v_rels_path_idx" ON "_articles_v_rels" USING btree ("path");
  CREATE INDEX "_articles_v_rels_tags_id_idx" ON "_articles_v_rels" USING btree ("tags_id");
  CREATE INDEX "_articles_v_rels_admins_id_idx" ON "_articles_v_rels" USING btree ("admins_id");
  CREATE UNIQUE INDEX "article_categories_slug_idx" ON "article_categories" USING btree ("slug");
  CREATE INDEX "article_categories_updated_at_idx" ON "article_categories" USING btree ("updated_at");
  CREATE INDEX "article_categories_created_at_idx" ON "article_categories" USING btree ("created_at");
  CREATE UNIQUE INDEX "article_categories_locales_parent_id_locale_unique" ON "article_categories_locales" USING btree ("_parent_id","_locale");
  CREATE INDEX "article_categories_rels_order_idx" ON "article_categories_rels" USING btree ("order");
  CREATE INDEX "article_categories_rels_parent_idx" ON "article_categories_rels" USING btree ("parent_id");
  CREATE INDEX "article_categories_rels_path_idx" ON "article_categories_rels" USING btree ("path");
  CREATE INDEX "article_categories_rels_admins_id_idx" ON "article_categories_rels" USING btree ("admins_id");
  CREATE UNIQUE INDEX "tags_slug_idx" ON "tags" USING btree ("slug");
  CREATE INDEX "tags_updated_at_idx" ON "tags" USING btree ("updated_at");
  CREATE INDEX "tags_created_at_idx" ON "tags" USING btree ("created_at");
  CREATE UNIQUE INDEX "tags_locales_parent_id_locale_unique" ON "tags_locales" USING btree ("_parent_id","_locale");
  CREATE INDEX "tags_rels_order_idx" ON "tags_rels" USING btree ("order");
  CREATE INDEX "tags_rels_parent_idx" ON "tags_rels" USING btree ("parent_id");
  CREATE INDEX "tags_rels_path_idx" ON "tags_rels" USING btree ("path");
  CREATE INDEX "tags_rels_admins_id_idx" ON "tags_rels" USING btree ("admins_id");
  CREATE UNIQUE INDEX "texts_key_idx" ON "texts" USING btree ("key");
  CREATE INDEX "texts_updated_at_idx" ON "texts" USING btree ("updated_at");
  CREATE INDEX "texts_created_at_idx" ON "texts" USING btree ("created_at");
  CREATE UNIQUE INDEX "texts_locales_parent_id_locale_unique" ON "texts_locales" USING btree ("_parent_id","_locale");
  CREATE INDEX "texts_rels_order_idx" ON "texts_rels" USING btree ("order");
  CREATE INDEX "texts_rels_parent_idx" ON "texts_rels" USING btree ("parent_id");
  CREATE INDEX "texts_rels_path_idx" ON "texts_rels" USING btree ("path");
  CREATE INDEX "texts_rels_admins_id_idx" ON "texts_rels" USING btree ("admins_id");
  CREATE INDEX "coach_suggestions_suggestions_order_idx" ON "coach_suggestions_suggestions" USING btree ("_order");
  CREATE INDEX "coach_suggestions_suggestions_parent_id_idx" ON "coach_suggestions_suggestions" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "coach_suggestions_suggestions_locales_parent_id_locale_uniqu" ON "coach_suggestions_suggestions_locales" USING btree ("_parent_id","_locale");
  CREATE INDEX "coach_suggestions_rels_order_idx" ON "coach_suggestions_rels" USING btree ("order");
  CREATE INDEX "coach_suggestions_rels_parent_idx" ON "coach_suggestions_rels" USING btree ("parent_id");
  CREATE INDEX "coach_suggestions_rels_path_idx" ON "coach_suggestions_rels" USING btree ("path");
  CREATE INDEX "coach_suggestions_rels_admins_id_idx" ON "coach_suggestions_rels" USING btree ("admins_id");
  CREATE INDEX "_coach_suggestions_v_version_suggestions_order_idx" ON "_coach_suggestions_v_version_suggestions" USING btree ("_order");
  CREATE INDEX "_coach_suggestions_v_version_suggestions_parent_id_idx" ON "_coach_suggestions_v_version_suggestions" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_coach_suggestions_v_version_suggestions_locales_parent_id_l" ON "_coach_suggestions_v_version_suggestions_locales" USING btree ("_parent_id","_locale");
  CREATE INDEX "_coach_suggestions_v_created_at_idx" ON "_coach_suggestions_v" USING btree ("created_at");
  CREATE INDEX "_coach_suggestions_v_updated_at_idx" ON "_coach_suggestions_v" USING btree ("updated_at");
  CREATE INDEX "_coach_suggestions_v_rels_order_idx" ON "_coach_suggestions_v_rels" USING btree ("order");
  CREATE INDEX "_coach_suggestions_v_rels_parent_idx" ON "_coach_suggestions_v_rels" USING btree ("parent_id");
  CREATE INDEX "_coach_suggestions_v_rels_path_idx" ON "_coach_suggestions_v_rels" USING btree ("path");
  CREATE INDEX "_coach_suggestions_v_rels_admins_id_idx" ON "_coach_suggestions_v_rels" USING btree ("admins_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_articles_fk" FOREIGN KEY ("articles_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_article_categories_fk" FOREIGN KEY ("article_categories_id") REFERENCES "public"."article_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_texts_fk" FOREIGN KEY ("texts_id") REFERENCES "public"."texts"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_articles_id_idx" ON "payload_locked_documents_rels" USING btree ("articles_id");
  CREATE INDEX "payload_locked_documents_rels_article_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("article_categories_id");
  CREATE INDEX "payload_locked_documents_rels_tags_id_idx" ON "payload_locked_documents_rels" USING btree ("tags_id");
  CREATE INDEX "payload_locked_documents_rels_texts_id_idx" ON "payload_locked_documents_rels" USING btree ("texts_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "articles" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "articles_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "articles_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_articles_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_articles_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_articles_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "article_categories" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "article_categories_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "article_categories_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "tags" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "tags_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "tags_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "texts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "texts_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "texts_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "coach_suggestions_suggestions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "coach_suggestions_suggestions_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "coach_suggestions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "coach_suggestions_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_coach_suggestions_v_version_suggestions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_coach_suggestions_v_version_suggestions_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_coach_suggestions_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_coach_suggestions_v_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "articles" CASCADE;
  DROP TABLE "articles_locales" CASCADE;
  DROP TABLE "articles_rels" CASCADE;
  DROP TABLE "_articles_v" CASCADE;
  DROP TABLE "_articles_v_locales" CASCADE;
  DROP TABLE "_articles_v_rels" CASCADE;
  DROP TABLE "article_categories" CASCADE;
  DROP TABLE "article_categories_locales" CASCADE;
  DROP TABLE "article_categories_rels" CASCADE;
  DROP TABLE "tags" CASCADE;
  DROP TABLE "tags_locales" CASCADE;
  DROP TABLE "tags_rels" CASCADE;
  DROP TABLE "texts" CASCADE;
  DROP TABLE "texts_locales" CASCADE;
  DROP TABLE "texts_rels" CASCADE;
  DROP TABLE "coach_suggestions_suggestions" CASCADE;
  DROP TABLE "coach_suggestions_suggestions_locales" CASCADE;
  DROP TABLE "coach_suggestions" CASCADE;
  DROP TABLE "coach_suggestions_rels" CASCADE;
  DROP TABLE "_coach_suggestions_v_version_suggestions" CASCADE;
  DROP TABLE "_coach_suggestions_v_version_suggestions_locales" CASCADE;
  DROP TABLE "_coach_suggestions_v" CASCADE;
  DROP TABLE "_coach_suggestions_v_rels" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_articles_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_article_categories_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_tags_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_texts_fk";
  
  DROP INDEX "payload_locked_documents_rels_articles_id_idx";
  DROP INDEX "payload_locked_documents_rels_article_categories_id_idx";
  DROP INDEX "payload_locked_documents_rels_tags_id_idx";
  DROP INDEX "payload_locked_documents_rels_texts_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "articles_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "article_categories_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "tags_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "texts_id";
  DROP TYPE "public"."enum_articles_status";
  DROP TYPE "public"."enum__articles_v_published_locale";
  DROP TYPE "public"."enum__articles_v_version_status";
  DROP TYPE "public"."enum_texts_namespace";`)
}
