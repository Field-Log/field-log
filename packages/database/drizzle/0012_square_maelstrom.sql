ALTER TABLE "tmp_images" RENAME COLUMN "image_kit_file_id" TO "image_file_id";--> statement-breakpoint
ALTER TABLE "tmp_images" RENAME COLUMN "image_kit_path" TO "image_path";--> statement-breakpoint
ALTER TABLE "tmp_images" RENAME COLUMN "image_kit_url" TO "image_url";--> statement-breakpoint
ALTER TABLE "tmp_images" RENAME COLUMN "image_kit_thumbnail_url" TO "image_thumbnail_url";--> statement-breakpoint
ALTER TABLE "tmp_images" ADD COLUMN "image_provider" text;