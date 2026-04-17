-- Phase 6: add per-line-item discount columns to quote_items and invoice_items
ALTER TABLE "quote_items" ADD COLUMN "discount_type" text;
ALTER TABLE "quote_items" ADD COLUMN "discount_value" numeric(10,2);

ALTER TABLE "invoice_items" ADD COLUMN "discount_type" text;
ALTER TABLE "invoice_items" ADD COLUMN "discount_value" numeric(10,2);
