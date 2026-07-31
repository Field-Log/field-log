ALTER TYPE "public"."theme_mode" RENAME TO "theme_mode_old";--> statement-breakpoint
CREATE TYPE "public"."theme_mode" AS ENUM('dark', 'light', 'system');--> statement-breakpoint
ALTER TABLE "user_settings" ALTER COLUMN "theme" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "user_settings" ALTER COLUMN "theme" TYPE "public"."theme_mode" USING "theme"::text::"public"."theme_mode";--> statement-breakpoint
ALTER TABLE "user_settings" ALTER COLUMN "theme" SET DEFAULT 'system';--> statement-breakpoint
DROP TYPE "public"."theme_mode_old";
