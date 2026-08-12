DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tmp_images'
      AND column_name = 'image_kit_file_id'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tmp_images'
      AND column_name = 'image_file_id'
  ) THEN
    ALTER TABLE "tmp_images" RENAME COLUMN "image_kit_file_id" TO "image_file_id";
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tmp_images'
      AND column_name = 'image_kit_path'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tmp_images'
      AND column_name = 'image_path'
  ) THEN
    ALTER TABLE "tmp_images" RENAME COLUMN "image_kit_path" TO "image_path";
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tmp_images'
      AND column_name = 'image_kit_url'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tmp_images'
      AND column_name = 'image_url'
  ) THEN
    ALTER TABLE "tmp_images" RENAME COLUMN "image_kit_url" TO "image_url";
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tmp_images'
      AND column_name = 'image_provider'
  ) THEN
    ALTER TABLE "tmp_images" ADD COLUMN "image_provider" text;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tmp_images'
      AND column_name = 'image_thumbnail_url'
  ) THEN
    ALTER TABLE "tmp_images" DROP COLUMN "image_thumbnail_url";
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tmp_images'
      AND column_name = 'image_kit_thumbnail_url'
  ) THEN
    ALTER TABLE "tmp_images" DROP COLUMN "image_kit_thumbnail_url";
  END IF;
END $$;--> statement-breakpoint
UPDATE "tmp_images"
SET
  "status" = 'pending_upload',
  "image_file_id" = NULL,
  "image_path" = NULL,
  "image_url" = NULL,
  "uploaded_at" = NULL
WHERE "status" = 'uploaded' AND "image_provider" IS NULL;
