-- Phase 8: merge_into columns for quotes and invoices
ALTER TABLE "quotes" ADD COLUMN "merged_into" uuid;
ALTER TABLE "invoices" ADD COLUMN "merged_into" uuid;
