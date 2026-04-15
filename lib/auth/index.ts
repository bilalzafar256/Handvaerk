import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function getDbUser() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return null

  return db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
  })
}
