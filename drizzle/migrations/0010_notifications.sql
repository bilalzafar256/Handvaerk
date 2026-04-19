CREATE TABLE IF NOT EXISTS "notifications" (
  "id"         uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id"    uuid NOT NULL,
  "type"       text NOT NULL,
  "title"      text NOT NULL,
  "body"       text NOT NULL,
  "metadata"   jsonb,
  "read"       boolean NOT NULL DEFAULT false,
  "read_at"    timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "notifications_user_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade
);

CREATE INDEX IF NOT EXISTS "notifications_user_id_idx" ON "notifications" ("user_id");
CREATE INDEX IF NOT EXISTS "notifications_user_unread_idx" ON "notifications" ("user_id", "read") WHERE read = false;
