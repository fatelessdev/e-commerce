CREATE TABLE "marketing_campaign_recipients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"user_id" text,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"resend_email_id" text,
	"error" text,
	"skipped_reason" text,
	"sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketing_campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"subject" text NOT NULL,
	"preview_text" text DEFAULT '' NOT NULL,
	"headline" text NOT NULL,
	"body" text NOT NULL,
	"cta_label" text NOT NULL,
	"cta_url" text NOT NULL,
	"product_ids" json DEFAULT '[]'::json NOT NULL,
	"audience" json NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"recipient_count" integer DEFAULT 0 NOT NULL,
	"sent_count" integer DEFAULT 0 NOT NULL,
	"failed_count" integer DEFAULT 0 NOT NULL,
	"skipped_count" integer DEFAULT 0 NOT NULL,
	"error" text,
	"created_by" text,
	"sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketing_email_suppressions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"user_id" text,
	"reason" text DEFAULT 'unsubscribe' NOT NULL,
	"source_campaign_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "marketing_campaign_recipients" ADD CONSTRAINT "marketing_campaign_recipients_campaign_id_marketing_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."marketing_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_campaign_recipients" ADD CONSTRAINT "marketing_campaign_recipients_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_campaigns" ADD CONSTRAINT "marketing_campaigns_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_email_suppressions" ADD CONSTRAINT "marketing_email_suppressions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_email_suppressions" ADD CONSTRAINT "marketing_email_suppressions_source_campaign_id_marketing_campaigns_id_fk" FOREIGN KEY ("source_campaign_id") REFERENCES "public"."marketing_campaigns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "marketing_campaign_recipients_campaign_email_unique" ON "marketing_campaign_recipients" USING btree ("campaign_id","email");--> statement-breakpoint
CREATE INDEX "marketing_campaign_recipients_campaign_id_idx" ON "marketing_campaign_recipients" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "marketing_campaign_recipients_email_idx" ON "marketing_campaign_recipients" USING btree ("email");--> statement-breakpoint
CREATE INDEX "marketing_campaign_recipients_status_idx" ON "marketing_campaign_recipients" USING btree ("status");--> statement-breakpoint
CREATE INDEX "marketing_campaigns_status_idx" ON "marketing_campaigns" USING btree ("status");--> statement-breakpoint
CREATE INDEX "marketing_campaigns_created_at_idx" ON "marketing_campaigns" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "marketing_email_suppressions_email_unique" ON "marketing_email_suppressions" USING btree ("email");--> statement-breakpoint
CREATE INDEX "marketing_email_suppressions_user_id_idx" ON "marketing_email_suppressions" USING btree ("user_id");