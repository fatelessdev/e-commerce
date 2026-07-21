CREATE TYPE "public"."wallet_entry_type" AS ENUM('top_up', 'order_payment', 'generation', 'refund', 'reversal');--> statement-breakpoint
CREATE TYPE "public"."wallet_reservation_status" AS ENUM('held', 'consumed', 'released', 'expired');--> statement-breakpoint
CREATE TYPE "public"."wallet_top_up_status" AS ENUM('created', 'paid', 'failed');--> statement-breakpoint
CREATE TABLE "wallet_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"available_paise" integer DEFAULT 0 NOT NULL,
	"held_paise" integer DEFAULT 0 NOT NULL,
	"is_frozen" boolean DEFAULT false NOT NULL,
	"freeze_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "wallet_accounts_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "wallet_checkout_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"quote" json NOT NULL,
	"shipping_address" json NOT NULL,
	"payment_method" text NOT NULL,
	"wallet_paid_paise" integer DEFAULT 0 NOT NULL,
	"external_paid_paise" integer DEFAULT 0 NOT NULL,
	"razorpay_order_id" text,
	"razorpay_payment_id" text,
	"status" text DEFAULT 'created' NOT NULL,
	"order_id" uuid,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "wallet_checkout_payments_razorpay_order_id_unique" UNIQUE("razorpay_order_id"),
	CONSTRAINT "wallet_checkout_payments_razorpay_payment_id_unique" UNIQUE("razorpay_payment_id")
);
--> statement-breakpoint
CREATE TABLE "wallet_ledger_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wallet_account_id" uuid NOT NULL,
	"type" "wallet_entry_type" NOT NULL,
	"amount_paise" integer NOT NULL,
	"balance_after_paise" integer NOT NULL,
	"reference_type" text NOT NULL,
	"reference_id" text NOT NULL,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallet_refunds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"admin_user_id" text NOT NULL,
	"amount_paise" integer NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallet_reservations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wallet_account_id" uuid NOT NULL,
	"amount_paise" integer NOT NULL,
	"reference_type" text NOT NULL,
	"reference_id" text NOT NULL,
	"status" "wallet_reservation_status" DEFAULT 'held' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallet_top_ups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"amount_paise" integer NOT NULL,
	"idempotency_key" text NOT NULL,
	"razorpay_order_id" text NOT NULL,
	"razorpay_payment_id" text,
	"status" "wallet_top_up_status" DEFAULT 'created' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"settled_at" timestamp,
	CONSTRAINT "wallet_top_ups_razorpay_order_id_unique" UNIQUE("razorpay_order_id"),
	CONSTRAINT "wallet_top_ups_razorpay_payment_id_unique" UNIQUE("razorpay_payment_id")
);
--> statement-breakpoint
CREATE TABLE "wallet_webhook_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_event_id" text NOT NULL,
	"payload_hash" text NOT NULL,
	"event_type" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "wallet_webhook_events_provider_event_id_unique" UNIQUE("provider_event_id")
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "wallet_paid_paise" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "external_paid_paise" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "wallet_accounts" ADD CONSTRAINT "wallet_accounts_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_checkout_payments" ADD CONSTRAINT "wallet_checkout_payments_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_checkout_payments" ADD CONSTRAINT "wallet_checkout_payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_ledger_entries" ADD CONSTRAINT "wallet_ledger_entries_wallet_account_id_wallet_accounts_id_fk" FOREIGN KEY ("wallet_account_id") REFERENCES "public"."wallet_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_refunds" ADD CONSTRAINT "wallet_refunds_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_refunds" ADD CONSTRAINT "wallet_refunds_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_refunds" ADD CONSTRAINT "wallet_refunds_admin_user_id_user_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_reservations" ADD CONSTRAINT "wallet_reservations_wallet_account_id_wallet_accounts_id_fk" FOREIGN KEY ("wallet_account_id") REFERENCES "public"."wallet_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_top_ups" ADD CONSTRAINT "wallet_top_ups_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "wallet_checkout_payment_user_idx" ON "wallet_checkout_payments" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "wallet_ledger_reference_unique" ON "wallet_ledger_entries" USING btree ("reference_type","reference_id");--> statement-breakpoint
CREATE INDEX "wallet_ledger_account_created_idx" ON "wallet_ledger_entries" USING btree ("wallet_account_id","created_at");--> statement-breakpoint
CREATE INDEX "wallet_refund_order_idx" ON "wallet_refunds" USING btree ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "wallet_reservation_reference_unique" ON "wallet_reservations" USING btree ("reference_type","reference_id");--> statement-breakpoint
CREATE INDEX "wallet_reservation_expiry_idx" ON "wallet_reservations" USING btree ("status","expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "wallet_top_up_user_idempotency_unique" ON "wallet_top_ups" USING btree ("user_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "wallet_top_up_user_created_idx" ON "wallet_top_ups" USING btree ("user_id","created_at");
--> statement-breakpoint
ALTER TABLE "wallet_accounts" ADD CONSTRAINT "wallet_accounts_nonnegative_balance" CHECK ("available_paise" >= 0 AND "held_paise" >= 0);
--> statement-breakpoint
ALTER TABLE "wallet_ledger_entries" ADD CONSTRAINT "wallet_ledger_nonzero_amount" CHECK ("amount_paise" <> 0);
--> statement-breakpoint
ALTER TABLE "wallet_refunds" ADD CONSTRAINT "wallet_refunds_positive_amount" CHECK ("amount_paise" > 0);
--> statement-breakpoint
ALTER TABLE "wallet_reservations" ADD CONSTRAINT "wallet_reservations_positive_amount" CHECK ("amount_paise" > 0);
--> statement-breakpoint
WITH legacy AS (
  SELECT id, user_id, ROUND(discount_value * 100)::integer AS amount_paise, created_at
  FROM coupons
  WHERE code LIKE 'CREDIT-%' AND user_id IS NOT NULL AND is_active = true AND used_count = 0
    AND (valid_until IS NULL OR valid_until > now())
), totals AS (
  SELECT user_id, SUM(amount_paise)::integer AS amount_paise FROM legacy GROUP BY user_id
)
INSERT INTO wallet_accounts (user_id, available_paise, held_paise, created_at, updated_at)
SELECT user_id, amount_paise, 0, now(), now() FROM totals
ON CONFLICT (user_id) DO UPDATE SET available_paise = wallet_accounts.available_paise + EXCLUDED.available_paise, updated_at = now();
--> statement-breakpoint
WITH legacy AS (
  SELECT c.id, c.user_id, ROUND(c.discount_value * 100)::integer AS amount_paise, c.created_at,
    SUM(ROUND(c.discount_value * 100)::integer) OVER (PARTITION BY c.user_id ORDER BY c.created_at, c.id) AS running_paise
  FROM coupons c
  WHERE c.code LIKE 'CREDIT-%' AND c.user_id IS NOT NULL AND c.is_active = true AND c.used_count = 0
    AND (c.valid_until IS NULL OR c.valid_until > now())
)
INSERT INTO wallet_ledger_entries (wallet_account_id, type, amount_paise, balance_after_paise, reference_type, reference_id, note, created_at)
SELECT wa.id, 'refund', legacy.amount_paise, legacy.running_paise::integer, 'legacy_store_credit', legacy.id::text, 'Migrated store credit', legacy.created_at
FROM legacy JOIN wallet_accounts wa ON wa.user_id = legacy.user_id
ON CONFLICT (reference_type, reference_id) DO NOTHING;
--> statement-breakpoint
UPDATE coupons SET is_active = false
WHERE code LIKE 'CREDIT-%' AND user_id IS NOT NULL AND is_active = true AND used_count = 0
  AND (valid_until IS NULL OR valid_until > now());
