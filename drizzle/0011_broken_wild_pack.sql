CREATE TABLE "product_recommendations" (
	"source_product_id" uuid NOT NULL,
	"recommended_product_id" uuid NOT NULL,
	"rank" integer NOT NULL,
	"score" numeric(8, 6) NOT NULL,
	"model" text NOT NULL,
	"source_hash" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "product_recommendations" ADD CONSTRAINT "product_recommendations_source_product_id_products_id_fk" FOREIGN KEY ("source_product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_recommendations" ADD CONSTRAINT "product_recommendations_recommended_product_id_products_id_fk" FOREIGN KEY ("recommended_product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "product_recommendations_source_product_id_idx" ON "product_recommendations" USING btree ("source_product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_recommendations_source_recommended_unique" ON "product_recommendations" USING btree ("source_product_id","recommended_product_id");