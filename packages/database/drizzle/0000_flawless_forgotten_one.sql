CREATE TYPE "public"."currency_code" AS ENUM('CAD', 'USD', 'EUR', 'GBP', 'AUD', 'JPY', 'CHF', 'NZD');--> statement-breakpoint
CREATE TYPE "public"."dimension_unit" AS ENUM('in', 'mm');--> statement-breakpoint
CREATE TYPE "public"."theme_mode" AS ENUM('dark', 'light');--> statement-breakpoint
CREATE TYPE "public"."weight_unit" AS ENUM('g', 'oz');--> statement-breakpoint
CREATE TABLE "user_settings" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"currency_code" "currency_code" DEFAULT 'USD' NOT NULL,
	"dimension_unit" "dimension_unit" DEFAULT 'in' NOT NULL,
	"theme" "theme_mode" DEFAULT 'dark' NOT NULL,
	"weight_unit" "weight_unit" DEFAULT 'g' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_id" text NOT NULL,
	CONSTRAINT "users_clerk_id_unique" UNIQUE("clerk_id")
);
--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;