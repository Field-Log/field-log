TRUNCATE TABLE "tmp_product_product_types", "tmp_autmog_pen_materials", "tmp_autmog_pen_versions", "tmp_autmog_pens", "tmp_products" RESTART IDENTITY CASCADE;--> statement-breakpoint
CREATE TABLE "tmp_grimsmo_knife_variation_versions" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "tmp_grimsmo_knife_variation_versions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1000 CACHE 1),
	"variation_id" bigint NOT NULL,
	"source_handle" text NOT NULL,
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
CREATE TABLE "tmp_grimsmo_knife_variations" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "tmp_grimsmo_knife_variations_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1000 CACHE 1),
	"product_variation_id" bigint NOT NULL,
	"knife_id" bigint NOT NULL,
	"knife_type" text NOT NULL,
	"source_product_id" text NOT NULL,
	"source_handle" text NOT NULL,
	"source_collection" text NOT NULL,
	"title" text NOT NULL,
	"title_full" text NOT NULL,
	"product_url" text NOT NULL,
	"description" text,
	"body_text" text,
	"knife_number" text,
	"bullets" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"bullets_by_category" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"handle_finishes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"handle_colors" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"handle_materials" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"hardware_colors" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"patterns" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"blade_steels" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"blade_finishes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"mechanisms" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"case" text,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"variants" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"normalized_data" jsonb NOT NULL,
	"details_hash" text NOT NULL,
	"image_set_hash" text NOT NULL,
	"price_min_cents" integer,
	"price_max_cents" integer,
	"currency_code" text DEFAULT 'USD' NOT NULL,
	"available_for_sale" boolean DEFAULT false NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tmp_grimsmo_knife_versions" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "tmp_grimsmo_knife_versions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1000 CACHE 1),
	"knife_id" bigint NOT NULL,
	"knife_type" text NOT NULL,
	"previous_details_hash" text,
	"next_details_hash" text NOT NULL,
	"snapshot" jsonb NOT NULL,
	"change_reason" text NOT NULL,
	"captured_at" timestamp with time zone DEFAULT now() NOT NULL,
	"replaced_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "tmp_grimsmo_knives" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "tmp_grimsmo_knives_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1000 CACHE 1),
	"product_id" bigint NOT NULL,
	"maker_id" bigint NOT NULL,
	"knife_type" text NOT NULL,
	"product_handle" text NOT NULL,
	"title" text NOT NULL,
	"product_url" text NOT NULL,
	"normalized_data" jsonb NOT NULL,
	"details_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tmp_grimsmo_pen_variation_versions" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "tmp_grimsmo_pen_variation_versions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1000 CACHE 1),
	"variation_id" bigint NOT NULL,
	"source_handle" text NOT NULL,
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
CREATE TABLE "tmp_grimsmo_pen_variations" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "tmp_grimsmo_pen_variations_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1000 CACHE 1),
	"product_variation_id" bigint NOT NULL,
	"pen_id" bigint NOT NULL,
	"source_product_id" text NOT NULL,
	"source_handle" text NOT NULL,
	"source_collection" text NOT NULL,
	"title" text NOT NULL,
	"title_full" text NOT NULL,
	"product_url" text NOT NULL,
	"description" text,
	"body_text" text,
	"saga_number" text,
	"bullets" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"bullets_by_category" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"visible_bullets" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"body_finishes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"body_colors" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"body_materials" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"slider_style" text,
	"slider_materials" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"slider_colors" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"refill" text,
	"case" text,
	"engraving" text,
	"tip_logo" text,
	"book" text,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"variants" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"normalized_data" jsonb NOT NULL,
	"details_hash" text NOT NULL,
	"image_set_hash" text NOT NULL,
	"price_min_cents" integer,
	"price_max_cents" integer,
	"currency_code" text DEFAULT 'USD' NOT NULL,
	"available_for_sale" boolean DEFAULT false NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tmp_grimsmo_pen_versions" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "tmp_grimsmo_pen_versions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1000 CACHE 1),
	"pen_id" bigint NOT NULL,
	"product_handle" text NOT NULL,
	"previous_details_hash" text,
	"next_details_hash" text NOT NULL,
	"snapshot" jsonb NOT NULL,
	"change_reason" text NOT NULL,
	"captured_at" timestamp with time zone DEFAULT now() NOT NULL,
	"replaced_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "tmp_grimsmo_pens" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "tmp_grimsmo_pens_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1000 CACHE 1),
	"product_id" bigint NOT NULL,
	"maker_id" bigint NOT NULL,
	"product_handle" text NOT NULL,
	"title" text NOT NULL,
	"product_url" text NOT NULL,
	"normalized_data" jsonb NOT NULL,
	"details_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tmp_images" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "tmp_images_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1000 CACHE 1),
	"product_id" bigint NOT NULL,
	"product_variation_id" bigint,
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
	"image_kit_thumbnail_url" text,
	"status" text DEFAULT 'pending_upload' NOT NULL,
	"uploaded_at" timestamp with time zone,
	"pending_delete_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tmp_product_variations" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "tmp_product_variations_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1000 CACHE 1),
	"product_id" bigint NOT NULL,
	"source_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tmp_autmog_pen_images" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "tmp_autmog_pen_images" CASCADE;--> statement-breakpoint
ALTER TABLE "tmp_products" DROP CONSTRAINT "tmp_products_autmog_pen_id_tmp_autmog_pens_id_fk";
--> statement-breakpoint
DROP INDEX "tmp_products_autmog_pen_id_unique";--> statement-breakpoint
ALTER TABLE "tmp_autmog_pens" ADD COLUMN "product_id" bigint NOT NULL;--> statement-breakpoint
ALTER TABLE "tmp_products" ADD COLUMN "source" text NOT NULL;--> statement-breakpoint
ALTER TABLE "tmp_products" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "tmp_products" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "tmp_grimsmo_knife_variation_versions" ADD CONSTRAINT "tmp_grimsmo_knife_variation_versions_variation_id_tmp_grimsmo_knife_variations_id_fk" FOREIGN KEY ("variation_id") REFERENCES "public"."tmp_grimsmo_knife_variations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tmp_grimsmo_knife_variations" ADD CONSTRAINT "tmp_grimsmo_knife_variations_product_variation_id_tmp_product_variations_id_fk" FOREIGN KEY ("product_variation_id") REFERENCES "public"."tmp_product_variations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tmp_grimsmo_knife_variations" ADD CONSTRAINT "tmp_grimsmo_knife_variations_knife_id_tmp_grimsmo_knives_id_fk" FOREIGN KEY ("knife_id") REFERENCES "public"."tmp_grimsmo_knives"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tmp_grimsmo_knife_versions" ADD CONSTRAINT "tmp_grimsmo_knife_versions_knife_id_tmp_grimsmo_knives_id_fk" FOREIGN KEY ("knife_id") REFERENCES "public"."tmp_grimsmo_knives"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tmp_grimsmo_knives" ADD CONSTRAINT "tmp_grimsmo_knives_product_id_tmp_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."tmp_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tmp_grimsmo_knives" ADD CONSTRAINT "tmp_grimsmo_knives_maker_id_makers_id_fk" FOREIGN KEY ("maker_id") REFERENCES "public"."makers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tmp_grimsmo_pen_variation_versions" ADD CONSTRAINT "tmp_grimsmo_pen_variation_versions_variation_id_tmp_grimsmo_pen_variations_id_fk" FOREIGN KEY ("variation_id") REFERENCES "public"."tmp_grimsmo_pen_variations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tmp_grimsmo_pen_variations" ADD CONSTRAINT "tmp_grimsmo_pen_variations_product_variation_id_tmp_product_variations_id_fk" FOREIGN KEY ("product_variation_id") REFERENCES "public"."tmp_product_variations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tmp_grimsmo_pen_variations" ADD CONSTRAINT "tmp_grimsmo_pen_variations_pen_id_tmp_grimsmo_pens_id_fk" FOREIGN KEY ("pen_id") REFERENCES "public"."tmp_grimsmo_pens"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tmp_grimsmo_pen_versions" ADD CONSTRAINT "tmp_grimsmo_pen_versions_pen_id_tmp_grimsmo_pens_id_fk" FOREIGN KEY ("pen_id") REFERENCES "public"."tmp_grimsmo_pens"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tmp_grimsmo_pens" ADD CONSTRAINT "tmp_grimsmo_pens_product_id_tmp_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."tmp_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tmp_grimsmo_pens" ADD CONSTRAINT "tmp_grimsmo_pens_maker_id_makers_id_fk" FOREIGN KEY ("maker_id") REFERENCES "public"."makers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tmp_images" ADD CONSTRAINT "tmp_images_product_id_tmp_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."tmp_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tmp_images" ADD CONSTRAINT "tmp_images_product_variation_id_tmp_product_variations_id_fk" FOREIGN KEY ("product_variation_id") REFERENCES "public"."tmp_product_variations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "tmp_product_variations_id_product_id_unique" ON "tmp_product_variations" USING btree ("id","product_id");--> statement-breakpoint
ALTER TABLE "tmp_images" ADD CONSTRAINT "tmp_images_product_variation_product_fk" FOREIGN KEY ("product_variation_id","product_id") REFERENCES "public"."tmp_product_variations"("id","product_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tmp_product_variations" ADD CONSTRAINT "tmp_product_variations_product_id_tmp_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."tmp_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tmp_grimsmo_knife_variation_versions_source_handle_idx" ON "tmp_grimsmo_knife_variation_versions" USING btree ("source_handle");--> statement-breakpoint
CREATE INDEX "tmp_grimsmo_knife_variation_versions_variation_id_idx" ON "tmp_grimsmo_knife_variation_versions" USING btree ("variation_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tmp_grimsmo_knife_variations_knife_handle_unique" ON "tmp_grimsmo_knife_variations" USING btree ("knife_id","source_handle");--> statement-breakpoint
CREATE INDEX "tmp_grimsmo_knife_variations_knife_id_idx" ON "tmp_grimsmo_knife_variations" USING btree ("knife_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tmp_grimsmo_knife_variations_product_variation_id_unique" ON "tmp_grimsmo_knife_variations" USING btree ("product_variation_id");--> statement-breakpoint
CREATE INDEX "tmp_grimsmo_knife_variations_source_product_id_idx" ON "tmp_grimsmo_knife_variations" USING btree ("source_product_id");--> statement-breakpoint
CREATE INDEX "tmp_grimsmo_knife_versions_knife_id_idx" ON "tmp_grimsmo_knife_versions" USING btree ("knife_id");--> statement-breakpoint
CREATE INDEX "tmp_grimsmo_knife_versions_knife_type_idx" ON "tmp_grimsmo_knife_versions" USING btree ("knife_type");--> statement-breakpoint
CREATE UNIQUE INDEX "tmp_grimsmo_knives_knife_type_unique" ON "tmp_grimsmo_knives" USING btree ("knife_type");--> statement-breakpoint
CREATE INDEX "tmp_grimsmo_knives_maker_id_idx" ON "tmp_grimsmo_knives" USING btree ("maker_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tmp_grimsmo_knives_product_id_unique" ON "tmp_grimsmo_knives" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tmp_grimsmo_knives_product_handle_unique" ON "tmp_grimsmo_knives" USING btree ("product_handle");--> statement-breakpoint
CREATE INDEX "tmp_grimsmo_pen_variation_versions_source_handle_idx" ON "tmp_grimsmo_pen_variation_versions" USING btree ("source_handle");--> statement-breakpoint
CREATE INDEX "tmp_grimsmo_pen_variation_versions_variation_id_idx" ON "tmp_grimsmo_pen_variation_versions" USING btree ("variation_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tmp_grimsmo_pen_variations_pen_handle_unique" ON "tmp_grimsmo_pen_variations" USING btree ("pen_id","source_handle");--> statement-breakpoint
CREATE INDEX "tmp_grimsmo_pen_variations_pen_id_idx" ON "tmp_grimsmo_pen_variations" USING btree ("pen_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tmp_grimsmo_pen_variations_product_variation_id_unique" ON "tmp_grimsmo_pen_variations" USING btree ("product_variation_id");--> statement-breakpoint
CREATE INDEX "tmp_grimsmo_pen_variations_source_product_id_idx" ON "tmp_grimsmo_pen_variations" USING btree ("source_product_id");--> statement-breakpoint
CREATE INDEX "tmp_grimsmo_pen_versions_pen_id_idx" ON "tmp_grimsmo_pen_versions" USING btree ("pen_id");--> statement-breakpoint
CREATE INDEX "tmp_grimsmo_pen_versions_product_handle_idx" ON "tmp_grimsmo_pen_versions" USING btree ("product_handle");--> statement-breakpoint
CREATE INDEX "tmp_grimsmo_pens_maker_id_idx" ON "tmp_grimsmo_pens" USING btree ("maker_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tmp_grimsmo_pens_product_id_unique" ON "tmp_grimsmo_pens" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tmp_grimsmo_pens_product_handle_unique" ON "tmp_grimsmo_pens" USING btree ("product_handle");--> statement-breakpoint
CREATE INDEX "tmp_images_product_id_idx" ON "tmp_images" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tmp_images_product_source_hash_unique" ON "tmp_images" USING btree ("product_id","source_hash") WHERE "tmp_images"."product_variation_id" is null;--> statement-breakpoint
CREATE INDEX "tmp_images_product_variation_id_idx" ON "tmp_images" USING btree ("product_variation_id");--> statement-breakpoint
CREATE INDEX "tmp_images_status_idx" ON "tmp_images" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "tmp_images_variation_source_hash_unique" ON "tmp_images" USING btree ("product_variation_id","source_hash") WHERE "tmp_images"."product_variation_id" is not null;--> statement-breakpoint
CREATE INDEX "tmp_product_variations_product_id_idx" ON "tmp_product_variations" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tmp_product_variations_product_source_key_unique" ON "tmp_product_variations" USING btree ("product_id","source_key");--> statement-breakpoint
ALTER TABLE "tmp_autmog_pens" ADD CONSTRAINT "tmp_autmog_pens_product_id_tmp_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."tmp_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "tmp_autmog_pens_product_id_unique" ON "tmp_autmog_pens" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "tmp_products_source_idx" ON "tmp_products" USING btree ("source");--> statement-breakpoint
ALTER TABLE "tmp_products" DROP COLUMN "autmog_pen_id";
