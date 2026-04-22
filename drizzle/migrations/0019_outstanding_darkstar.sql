CREATE TABLE "job_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"text" text NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "job_photos" ADD COLUMN "tag" text;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "priority" text DEFAULT 'normal';--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "estimated_hours" numeric(6, 2);--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "location_address" text;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "location_zip" text;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "location_city" text;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "tags" text;--> statement-breakpoint
ALTER TABLE "job_tasks" ADD CONSTRAINT "job_tasks_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_tasks" ADD CONSTRAINT "job_tasks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;