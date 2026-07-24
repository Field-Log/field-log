DROP TABLE IF EXISTS "tmp_autmog_pen_images" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "tmp_autmog_pen_versions" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "tmp_autmog_pens" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "scraper_runs" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "makers" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "user_settings" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "users" CASCADE;
--> statement-breakpoint
CREATE TABLE "users" (
	"id" bigint GENERATED ALWAYS AS IDENTITY (START WITH 1000) PRIMARY KEY NOT NULL,
	"clerk_id" text NOT NULL,
	CONSTRAINT "users_clerk_id_unique" UNIQUE("clerk_id")
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"user_id" bigint PRIMARY KEY NOT NULL,
	"currency_code" "currency_code" DEFAULT 'USD' NOT NULL,
	"dimension_unit" "dimension_unit" DEFAULT 'in' NOT NULL,
	"theme" "theme_mode" DEFAULT 'dark' NOT NULL,
	"weight_unit" "weight_unit" DEFAULT 'g' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "makers" (
	"id" bigint GENERATED ALWAYS AS IDENTITY (START WITH 1000) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"root_url" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scraper_runs" (
	"id" bigint GENERATED ALWAYS AS IDENTITY (START WITH 1000) PRIMARY KEY NOT NULL,
	"source" text NOT NULL,
	"job_type" text NOT NULL,
	"status" text NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"heartbeat_at" timestamp with time zone,
	"error_message" text,
	"stats" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tmp_autmog_pens" (
	"id" bigint GENERATED ALWAYS AS IDENTITY (START WITH 1000) PRIMARY KEY NOT NULL,
	"maker_id" bigint NOT NULL,
	"source_product_id" text NOT NULL,
	"source_handle" text NOT NULL,
	"title" text NOT NULL,
	"product_url" text NOT NULL,
	"vendor" text,
	"product_type" text,
	"body_html" text,
	"body_text" text,
	"category" text,
	"size" text,
	"mechanism" text,
	"refill" text,
	"nose" text,
	"clip" text,
	"grip" text,
	"finish" text,
	"body_shape" text,
	"materials" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"body_details" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"variants" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"normalized_data" jsonb NOT NULL,
	"raw_shopify_data" jsonb NOT NULL,
	"raw_payload_hash" text NOT NULL,
	"details_hash" text NOT NULL,
	"image_set_hash" text NOT NULL,
	"price_min_cents" integer,
	"price_max_cents" integer,
	"currency_code" text DEFAULT 'USD' NOT NULL,
	"available_for_sale" boolean DEFAULT false NOT NULL,
	"source_created_at" timestamp with time zone,
	"source_updated_at" timestamp with time zone,
	"source_published_at" timestamp with time zone,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tmp_autmog_pen_images" (
	"id" bigint GENERATED ALWAYS AS IDENTITY (START WITH 1000) PRIMARY KEY NOT NULL,
	"pen_id" bigint NOT NULL,
	"source_image_id" text,
	"source_url" text NOT NULL,
	"position" integer NOT NULL,
	"alt_text" text,
	"width" integer,
	"height" integer,
	"source_hash" text NOT NULL,
	"image_kit_file_id" text,
	"image_kit_path" text,
	"image_kit_url" text,
	"status" text DEFAULT 'pending_upload' NOT NULL,
	"uploaded_at" timestamp with time zone,
	"pending_delete_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tmp_autmog_pen_versions" (
	"id" bigint GENERATED ALWAYS AS IDENTITY (START WITH 1000) PRIMARY KEY NOT NULL,
	"pen_id" bigint NOT NULL,
	"source_product_id" text NOT NULL,
	"previous_details_hash" text,
	"next_details_hash" text NOT NULL,
	"previous_image_set_hash" text,
	"next_image_set_hash" text NOT NULL,
	"snapshot" jsonb NOT NULL,
	"change_reason" text NOT NULL,
	"captured_at" timestamp with time zone DEFAULT now() NOT NULL,
	"replaced_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "tmp_autmog_pens" ADD CONSTRAINT "tmp_autmog_pens_maker_id_makers_id_fk" FOREIGN KEY ("maker_id") REFERENCES "public"."makers"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "tmp_autmog_pen_images" ADD CONSTRAINT "tmp_autmog_pen_images_pen_id_tmp_autmog_pens_id_fk" FOREIGN KEY ("pen_id") REFERENCES "public"."tmp_autmog_pens"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "tmp_autmog_pen_versions" ADD CONSTRAINT "tmp_autmog_pen_versions_pen_id_tmp_autmog_pens_id_fk" FOREIGN KEY ("pen_id") REFERENCES "public"."tmp_autmog_pens"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "makers_root_url_unique" ON "makers" USING btree ("root_url");
--> statement-breakpoint
CREATE INDEX "scraper_runs_source_job_status_idx" ON "scraper_runs" USING btree ("source","job_type","status");
--> statement-breakpoint
CREATE INDEX "scraper_runs_started_at_idx" ON "scraper_runs" USING btree ("started_at");
--> statement-breakpoint
CREATE INDEX "tmp_autmog_pens_maker_id_idx" ON "tmp_autmog_pens" USING btree ("maker_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "tmp_autmog_pens_source_product_id_unique" ON "tmp_autmog_pens" USING btree ("source_product_id");
--> statement-breakpoint
CREATE INDEX "tmp_autmog_pen_images_pen_id_idx" ON "tmp_autmog_pen_images" USING btree ("pen_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "tmp_autmog_pen_images_pen_source_url_unique" ON "tmp_autmog_pen_images" USING btree ("pen_id","source_url");
--> statement-breakpoint
CREATE INDEX "tmp_autmog_pen_images_status_idx" ON "tmp_autmog_pen_images" USING btree ("status");
--> statement-breakpoint
CREATE INDEX "tmp_autmog_pen_versions_pen_id_idx" ON "tmp_autmog_pen_versions" USING btree ("pen_id");
--> statement-breakpoint
CREATE INDEX "tmp_autmog_pen_versions_source_product_id_idx" ON "tmp_autmog_pen_versions" USING btree ("source_product_id");
