CREATE TABLE "tmp_products" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "tmp_products_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1000 CACHE 1),
	"autmog_pen_id" bigint
);
--> statement-breakpoint
ALTER TABLE "tmp_products" ADD CONSTRAINT "tmp_products_autmog_pen_id_tmp_autmog_pens_id_fk" FOREIGN KEY ("autmog_pen_id") REFERENCES "public"."tmp_autmog_pens"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "tmp_products_autmog_pen_id_unique" ON "tmp_products" USING btree ("autmog_pen_id");