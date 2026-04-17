-- Phase 7: bank_accounts table + MobilePay on users
CREATE TABLE "bank_accounts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id"),
  "bank_name" text,
  "reg_number" text NOT NULL,
  "account_number" text NOT NULL,
  "is_default" boolean DEFAULT false,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

ALTER TABLE "users" ADD COLUMN "mobilepay_number" text;
