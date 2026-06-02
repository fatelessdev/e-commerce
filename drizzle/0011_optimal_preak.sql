CREATE EXTENSION IF NOT EXISTS "vector";--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "product_search_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"image_url" text NOT NULL,
	"image_index" integer DEFAULT 0 NOT NULL,
	"image_embedding" vector(1536) NOT NULL,
	"image_embedding_hash" text NOT NULL,
	"image_embedding_model" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "product_search_images" ADD CONSTRAINT "product_search_images_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "product_search_images_product_url_unique" ON "product_search_images" USING btree ("product_id","image_url");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_search_images_product_id_idx" ON "product_search_images" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_search_images_embedding_idx" ON "product_search_images" USING hnsw ("image_embedding" vector_cosine_ops);
