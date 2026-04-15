import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import * as schema from "./schema"

// Lazy singleton — avoids build-time crash when DATABASE_URL is not set.
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null

export function getDb() {
  if (_db) return _db
  const url = process.env.DATABASE_URL
  if (!url) throw new Error("DATABASE_URL is not set")
  const sql = neon(url)
  _db = drizzle(sql, { schema })
  return _db
}

// Re-export as `db` for convenience — only instantiates on first use.
export const db = new Proxy(
  {} as ReturnType<typeof drizzle<typeof schema>>,
  {
    get(_, prop) {
      return Reflect.get(getDb(), prop)
    },
  }
)
