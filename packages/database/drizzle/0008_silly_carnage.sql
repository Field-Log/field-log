CREATE TABLE "mechanisms" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "mechanisms_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1000 CACHE 1),
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_types" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "product_types_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1000 CACHE 1),
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tmp_product_product_types" (
	"product_id" bigint NOT NULL,
	"product_type_id" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tmp_product_product_types_pk" PRIMARY KEY("product_id","product_type_id")
);
--> statement-breakpoint
ALTER TABLE "tmp_autmog_pens" ADD COLUMN "mechanism_id" bigint;--> statement-breakpoint
ALTER TABLE "tmp_product_product_types" ADD CONSTRAINT "tmp_product_product_types_product_id_tmp_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."tmp_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tmp_product_product_types" ADD CONSTRAINT "tmp_product_product_types_product_type_id_product_types_id_fk" FOREIGN KEY ("product_type_id") REFERENCES "public"."product_types"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "mechanisms_name_unique" ON "mechanisms" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "mechanisms_slug_unique" ON "mechanisms" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "product_types_name_unique" ON "product_types" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "product_types_slug_unique" ON "product_types" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "tmp_product_product_types_product_type_id_idx" ON "tmp_product_product_types" USING btree ("product_type_id");--> statement-breakpoint
ALTER TABLE "tmp_autmog_pens" ADD CONSTRAINT "tmp_autmog_pens_mechanism_id_mechanisms_id_fk" FOREIGN KEY ("mechanism_id") REFERENCES "public"."mechanisms"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tmp_autmog_pens_mechanism_id_idx" ON "tmp_autmog_pens" USING btree ("mechanism_id");--> statement-breakpoint
INSERT INTO "mechanisms" ("name", "slug")
SELECT DISTINCT
	trim("mechanism") AS "name",
	lower(regexp_replace(regexp_replace(trim("mechanism"), '[^a-zA-Z0-9]+', '-', 'g'), '(^-+|-+$)', '', 'g')) AS "slug"
FROM "tmp_autmog_pens"
WHERE nullif(trim("mechanism"), '') IS NOT NULL
ON CONFLICT ("slug") DO UPDATE SET
	"name" = excluded."name",
	"updated_at" = now();--> statement-breakpoint
UPDATE "tmp_autmog_pens"
SET "mechanism_id" = "mechanisms"."id"
FROM "mechanisms"
WHERE lower(regexp_replace(regexp_replace(trim("tmp_autmog_pens"."mechanism"), '[^a-zA-Z0-9]+', '-', 'g'), '(^-+|-+$)', '', 'g')) = "mechanisms"."slug";--> statement-breakpoint
WITH product_type_values AS (
	SELECT DISTINCT
		trim(coalesce(nullif("tmp_autmog_pens"."category", ''), nullif("tmp_autmog_pens"."product_type", ''))) AS "name",
		lower(regexp_replace(regexp_replace(trim(coalesce(nullif("tmp_autmog_pens"."category", ''), nullif("tmp_autmog_pens"."product_type", ''))), '[^a-zA-Z0-9]+', '-', 'g'), '(^-+|-+$)', '', 'g')) AS "slug"
	FROM "tmp_products"
	INNER JOIN "tmp_autmog_pens" ON "tmp_products"."autmog_pen_id" = "tmp_autmog_pens"."id"
	WHERE nullif(trim(coalesce(nullif("tmp_autmog_pens"."category", ''), nullif("tmp_autmog_pens"."product_type", ''))), '') IS NOT NULL
)
INSERT INTO "product_types" ("name", "slug")
SELECT "name", "slug"
FROM product_type_values
ON CONFLICT ("slug") DO UPDATE SET
	"name" = excluded."name",
	"updated_at" = now();--> statement-breakpoint
INSERT INTO "tmp_product_product_types" ("product_id", "product_type_id")
SELECT DISTINCT
	"tmp_products"."id" AS "product_id",
	"product_types"."id" AS "product_type_id"
FROM "tmp_products"
INNER JOIN "tmp_autmog_pens" ON "tmp_products"."autmog_pen_id" = "tmp_autmog_pens"."id"
INNER JOIN "product_types" ON lower(regexp_replace(regexp_replace(trim(coalesce(nullif("tmp_autmog_pens"."category", ''), nullif("tmp_autmog_pens"."product_type", ''))), '[^a-zA-Z0-9]+', '-', 'g'), '(^-+|-+$)', '', 'g')) = "product_types"."slug"
ON CONFLICT ("product_id", "product_type_id") DO NOTHING;--> statement-breakpoint
ALTER TABLE "tmp_autmog_pens" DROP COLUMN "vendor";--> statement-breakpoint
ALTER TABLE "tmp_autmog_pens" DROP COLUMN "product_type";--> statement-breakpoint
ALTER TABLE "tmp_autmog_pens" DROP COLUMN "category";--> statement-breakpoint
ALTER TABLE "tmp_autmog_pens" DROP COLUMN "mechanism";--> statement-breakpoint
ALTER TABLE "tmp_autmog_pens" DROP COLUMN "body_shape";
