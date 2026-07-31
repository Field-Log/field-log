ALTER TYPE "public"."theme_mode" ADD VALUE 'system';--> statement-breakpoint
ALTER TABLE "user_settings" ALTER COLUMN "theme" SET DEFAULT 'system';