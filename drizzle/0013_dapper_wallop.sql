CREATE TABLE "product_try_on_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"body_image_url" text NOT NULL,
	"body_image_public_id" text NOT NULL,
	"output_image_url" text NOT NULL,
	"output_image_public_id" text NOT NULL,
	"product_image_url" text NOT NULL,
	"product_image_index" integer NOT NULL,
	"try_on_mode" text NOT NULL,
	"model_id" text NOT NULL,
	"prompt_version" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "product_try_on_runs" ADD CONSTRAINT "product_try_on_runs_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_try_on_runs" ADD CONSTRAINT "product_try_on_runs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "product_try_on_runs_product_user_created_idx" ON "product_try_on_runs" USING btree ("product_id","user_id","created_at");--> statement-breakpoint
CREATE INDEX "product_try_on_runs_user_created_idx" ON "product_try_on_runs" USING btree ("user_id","created_at");