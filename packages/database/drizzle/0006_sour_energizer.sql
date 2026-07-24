DROP INDEX "tmp_autmog_pen_images_pen_source_url_unique";--> statement-breakpoint
TRUNCATE TABLE "tmp_autmog_pen_images";--> statement-breakpoint
ALTER TABLE "tmp_autmog_pen_images" ADD COLUMN "image_kit_thumbnail_url" text;--> statement-breakpoint
CREATE UNIQUE INDEX "tmp_autmog_pen_images_pen_source_hash_unique" ON "tmp_autmog_pen_images" USING btree ("pen_id","source_hash");--> statement-breakpoint
ALTER TABLE "tmp_autmog_pen_images" DROP COLUMN "source_image_id";--> statement-breakpoint
ALTER TABLE "tmp_autmog_pen_images" DROP COLUMN "source_url";--> statement-breakpoint
ALTER TABLE "tmp_autmog_pen_images" DROP COLUMN "position";
