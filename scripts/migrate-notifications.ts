/**
 * Creates the notifications table directly.
 * Run: npx tsx --env-file=.env.local scripts/migrate-notifications.ts
 */

import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

async function run() {
  console.log("Creating notifications table...")

  await sql`
    CREATE TABLE IF NOT EXISTS notifications (
      id         uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type       text NOT NULL,
      title      text NOT NULL,
      body       text NOT NULL,
      metadata   jsonb,
      read       boolean NOT NULL DEFAULT false,
      read_at    timestamptz,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `

  await sql`
    CREATE INDEX IF NOT EXISTS notifications_user_id_idx
      ON notifications (user_id)
  `

  await sql`
    CREATE INDEX IF NOT EXISTS notifications_user_unread_idx
      ON notifications (user_id, read)
      WHERE read = false
  `

  console.log("Done.")
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
