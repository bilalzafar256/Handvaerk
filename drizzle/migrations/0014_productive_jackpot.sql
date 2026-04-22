ALTER TABLE "customers" ADD COLUMN "contact_person" text;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "second_phone" text;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "country" text DEFAULT 'DK';--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "payment_terms_days" integer DEFAULT 14;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "preferred_language" text DEFAULT 'da';--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "vat_exempt" boolean DEFAULT false;