ALTER TABLE "pricebook_items" ADD COLUMN "cost_price" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "pricebook_items" ADD COLUMN "unit" text;--> statement-breakpoint
ALTER TABLE "pricebook_items" ADD COLUMN "sku" text;