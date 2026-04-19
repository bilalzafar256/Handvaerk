/**
 * Clears all seeded data for the first user, then exits.
 * Run: npx tsx --env-file=.env.local scripts/clear-seed.ts
 */

import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import * as schema from "../lib/db/schema"
import { eq } from "drizzle-orm"

const { users, customers, jobs, jobPhotos, quotes, invoices, bankAccounts, quoteTemplates, materialsCatalog } = schema

async function clear() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error("DATABASE_URL is not set")

  const sql = neon(url)
  const db = drizzle(sql, { schema })

  const [user] = await db.select().from(users).limit(1)
  if (!user) { console.error("No user found."); process.exit(1) }
  const uid = user.id
  console.log(`Clearing seed data for: ${user.email ?? user.clerkId}`)

  // Delete in dependency order
  await db.delete(invoices).where(eq(invoices.userId, uid))
  await db.delete(quotes).where(eq(quotes.userId, uid))
  // job_photos has no userId — delete via jobs join
  const userJobs = await db.select({ id: jobs.id }).from(jobs).where(eq(jobs.userId, uid))
  for (const j of userJobs) {
    await db.delete(jobPhotos).where(eq(jobPhotos.jobId, j.id))
  }
  await db.delete(jobs).where(eq(jobs.userId, uid))
  await db.delete(customers).where(eq(customers.userId, uid))
  await db.delete(bankAccounts).where(eq(bankAccounts.userId, uid))
  await db.delete(quoteTemplates).where(eq(quoteTemplates.userId, uid))
  await db.delete(materialsCatalog).where(eq(materialsCatalog.userId, uid))

  console.log("✓ All seed data cleared")
}

clear().catch((err) => { console.error(err); process.exit(1) })
