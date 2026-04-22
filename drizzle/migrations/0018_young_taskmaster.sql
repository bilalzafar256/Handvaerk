ALTER TABLE "pricebook_items" ADD COLUMN "category" text;--> statement-breakpoint
ALTER TABLE "pricebook_items" ADD COLUMN "supplier_name" text;--> statement-breakpoint
ALTER TABLE "pricebook_items" ADD COLUMN "default_markup_percent" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "pricebook_items" ADD COLUMN "default_quantity" numeric(10, 3);--> statement-breakpoint
ALTER TABLE "pricebook_items" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "pricebook_items" ADD COLUMN "is_favourite" boolean DEFAULT false;