CREATE TYPE "public"."feature_flag_audience" AS ENUM('global', 'admin', 'user');--> statement-breakpoint
CREATE TYPE "public"."feature_flag_override_source" AS ENUM('admin', 'user');--> statement-breakpoint
CREATE TABLE "feature_flag_user_overrides" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"flag_id" uuid NOT NULL,
	"user_id" bigint NOT NULL,
	"source" "feature_flag_override_source" NOT NULL,
	"enabled" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_clerk_id" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by_clerk_id" text NOT NULL,
	CONSTRAINT "feature_flag_user_overrides_flag_user_source_unique" UNIQUE("flag_id","user_id","source")
);
--> statement-breakpoint
CREATE TABLE "feature_flags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"audience" "feature_flag_audience" NOT NULL,
	"default_enabled" boolean DEFAULT false NOT NULL,
	"archived_at" timestamp with time zone,
	"archived_by_clerk_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_clerk_id" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by_clerk_id" text NOT NULL,
	CONSTRAINT "feature_flags_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "feature_flag_user_overrides" ADD CONSTRAINT "feature_flag_user_overrides_flag_id_feature_flags_id_fk" FOREIGN KEY ("flag_id") REFERENCES "public"."feature_flags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_flag_user_overrides" ADD CONSTRAINT "feature_flag_user_overrides_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;