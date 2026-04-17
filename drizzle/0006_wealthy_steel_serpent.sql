CREATE TABLE "combos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_a_id" uuid NOT NULL,
	"product_b_id" uuid NOT NULL,
	"discount_percentage" numeric(5, 2) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "combos" ADD CONSTRAINT "combos_product_a_id_products_id_fk" FOREIGN KEY ("product_a_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "combos" ADD CONSTRAINT "combos_product_b_id_products_id_fk" FOREIGN KEY ("product_b_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "combo_pair_unique" ON "combos" USING btree ("product_a_id","product_b_id");