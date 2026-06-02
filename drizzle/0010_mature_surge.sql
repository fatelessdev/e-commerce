CREATE EXTENSION IF NOT EXISTS "pg_trgm";--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS "vector";--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "search_text" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "search_tokens" "tsvector" GENERATED ALWAYS AS (to_tsvector('english', coalesce("search_text", ''))) STORED;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "search_embedding" vector(1536);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "search_embedding_hash" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "search_embedding_model" text;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_search_tokens_idx" ON "products" USING gin ("search_tokens");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_search_text_trgm_idx" ON "products" USING gin ("search_text" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_search_embedding_idx" ON "products" USING hnsw ("search_embedding" vector_cosine_ops);
