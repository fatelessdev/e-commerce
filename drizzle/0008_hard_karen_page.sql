DROP INDEX "coupon_code_idx";--> statement-breakpoint
ALTER TABLE "coupons" ALTER COLUMN "discount_type" SET DEFAULT 'fixed';--> statement-breakpoint
ALTER TABLE "coupons" ALTER COLUMN "valid_from" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "discount" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "shipping" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "max_bargain_discount" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "total_spent" SET DEFAULT '0';--> statement-breakpoint
CREATE INDEX "bargain_sessions_coupon_code_idx" ON "bargain_sessions" USING btree ("coupon_code");--> statement-breakpoint
CREATE INDEX "bargain_sessions_user_id_idx" ON "bargain_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "coupons_user_id_idx" ON "coupons" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "coupons_active_validity_idx" ON "coupons" USING btree ("is_active","valid_until");--> statement-breakpoint
CREATE INDEX "order_items_order_id_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_items_product_id_idx" ON "order_items" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_razorpay_order_id_unique" ON "orders" USING btree ("razorpay_order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_razorpay_payment_id_unique" ON "orders" USING btree ("razorpay_payment_id");--> statement-breakpoint
CREATE INDEX "orders_user_id_idx" ON "orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "orders_created_at_idx" ON "orders" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "wishlist_user_product_unique" ON "wishlist" USING btree ("user_id","product_id");--> statement-breakpoint
CREATE INDEX "wishlist_user_id_idx" ON "wishlist" USING btree ("user_id");