CREATE TABLE "materials" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "materials_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1000 CACHE 1),
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tmp_autmog_pen_materials" (
	"pen_id" bigint NOT NULL,
	"material_id" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tmp_autmog_pen_materials_pk" PRIMARY KEY("pen_id","material_id")
);
--> statement-breakpoint
ALTER TABLE "tmp_autmog_pens" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "tmp_autmog_pen_materials" ADD CONSTRAINT "tmp_autmog_pen_materials_pen_id_tmp_autmog_pens_id_fk" FOREIGN KEY ("pen_id") REFERENCES "public"."tmp_autmog_pens"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tmp_autmog_pen_materials" ADD CONSTRAINT "tmp_autmog_pen_materials_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "materials_name_unique" ON "materials" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "materials_slug_unique" ON "materials" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "tmp_autmog_pen_materials_material_id_idx" ON "tmp_autmog_pen_materials" USING btree ("material_id");--> statement-breakpoint
UPDATE "tmp_autmog_pens"
SET "description" = "body_text"
WHERE "description" IS NULL AND "body_text" IS NOT NULL;--> statement-breakpoint
INSERT INTO "materials" ("name", "slug")
SELECT DISTINCT
	trim("source_material"."name") AS "name",
	trim(both '-' from regexp_replace(lower(trim("source_material"."name")), '[^a-z0-9]+', '-', 'g')) AS "slug"
FROM "tmp_autmog_pens",
jsonb_array_elements_text("tmp_autmog_pens"."materials") AS "source_material"("name")
WHERE trim("source_material"."name") <> ''
ON CONFLICT ("slug") DO UPDATE SET
	"name" = EXCLUDED."name",
	"updated_at" = now();--> statement-breakpoint
INSERT INTO "tmp_autmog_pen_materials" ("pen_id", "material_id")
SELECT DISTINCT
	"tmp_autmog_pens"."id" AS "pen_id",
	"materials"."id" AS "material_id"
FROM "tmp_autmog_pens",
jsonb_array_elements_text("tmp_autmog_pens"."materials") AS "source_material"("name")
INNER JOIN "materials"
	ON "materials"."slug" = trim(both '-' from regexp_replace(lower(trim("source_material"."name")), '[^a-z0-9]+', '-', 'g'))
WHERE trim("source_material"."name") <> ''
ON CONFLICT DO NOTHING;--> statement-breakpoint
ALTER TABLE "tmp_autmog_pens" DROP COLUMN "body_html";--> statement-breakpoint
ALTER TABLE "tmp_autmog_pens" DROP COLUMN "body_text";--> statement-breakpoint
ALTER TABLE "tmp_autmog_pens" DROP COLUMN "materials";--> statement-breakpoint
ALTER TABLE "tmp_autmog_pens" DROP COLUMN "raw_shopify_data";--> statement-breakpoint
ALTER TABLE "tmp_autmog_pens" DROP COLUMN "raw_payload_hash";--> statement-breakpoint
ALTER TABLE "tmp_autmog_pens" DROP COLUMN "source_created_at";--> statement-breakpoint
ALTER TABLE "tmp_autmog_pens" DROP COLUMN "source_updated_at";--> statement-breakpoint
ALTER TABLE "tmp_autmog_pens" DROP COLUMN "source_published_at";--> statement-breakpoint
ALTER TABLE "tmp_autmog_pens" DROP COLUMN "first_seen_at";--> statement-breakpoint
ALTER TABLE "tmp_autmog_pens" DROP COLUMN "last_seen_at";--> statement-breakpoint
ALTER TABLE "tmp_autmog_pens" DROP COLUMN "is_archived";
