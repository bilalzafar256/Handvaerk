CREATE TABLE "time_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"job_id" uuid NOT NULL,
	"started_at" timestamp NOT NULL,
	"ended_at" timestamp,
	"duration_minutes" integer,
	"description" text,
	"is_billable" boolean DEFAULT true,
	"billed_to_quote_id" uuid,
	"billed_to_invoice_id" uuid,
	"created_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_billed_to_quote_id_quotes_id_fk" FOREIGN KEY ("billed_to_quote_id") REFERENCES "public"."quotes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_billed_to_invoice_id_invoices_id_fk" FOREIGN KEY ("billed_to_invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;