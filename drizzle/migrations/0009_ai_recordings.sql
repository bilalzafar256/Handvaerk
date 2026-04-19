-- Phase 11 AI: ai_recordings table for background job recording processing
CREATE TABLE IF NOT EXISTS "ai_recordings" (
  "id"             uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id"        uuid NOT NULL,
  "status"         text DEFAULT 'pending' NOT NULL,
  "blob_url"       text NOT NULL,
  "mime_type"      text DEFAULT 'audio/webm' NOT NULL,
  "extracted_data" jsonb,
  "current_step"   text,
  "error_step"     text,
  "error_message"  text,
  "inngest_run_id" text,
  "created_at"     timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at"     timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "ai_recordings_user_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade
);
