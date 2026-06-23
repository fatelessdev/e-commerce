CREATE EXTENSION IF NOT EXISTS "pg_trgm";--> statement-breakpoint
CREATE TABLE "product_search_index_state" (
	"product_id" uuid PRIMARY KEY NOT NULL,
	"search_text_hash" text,
	"image_hashes" json DEFAULT '{}'::json NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"last_error" text,
	"synced_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "search_text" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "search_tokens" "tsvector" GENERATED ALWAYS AS (to_tsvector('english', coalesce(search_text, ''))) STORED NOT NULL;--> statement-breakpoint
UPDATE "products"
SET "search_text" = concat_ws(
	E'\n',
	"name",
	"description",
	"category"::text,
	"gender"::text,
	"tags"::text,
	"fabric",
	"care_instructions"::text,
	"features"::text,
	"sizes"::text,
	"colors"::text
);--> statement-breakpoint
ALTER TABLE "product_search_index_state" ADD CONSTRAINT "product_search_index_state_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "product_search_index_state_status_idx" ON "product_search_index_state" USING btree ("status");
--> statement-breakpoint
CREATE INDEX "products_search_tokens_idx" ON "products" USING gin ("search_tokens");
--> statement-breakpoint
CREATE INDEX "products_search_text_trgm_idx" ON "products" USING gin ("search_text" gin_trgm_ops);
