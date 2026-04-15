CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_id" text NOT NULL,
	"email" text,
	"phone" text,
	"company_name" text,
	"cvr_number" text,
	"address_line1" text,
	"address_city" text,
	"address_zip" text,
	"hourly_rate" numeric(10, 2),
	"logo_url" text,
	"tier" text DEFAULT 'free',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_clerk_id_unique" UNIQUE("clerk_id")
);
