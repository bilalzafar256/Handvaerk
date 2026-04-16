import { auth, currentUser } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function getDbUser() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return null

  const existing = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
  })
  if (existing) return existing

  // Row missing (webhook not configured or fired) — create it now
  const clerkUser = await currentUser()
  if (!clerkUser) return null

  const [created] = await db
    .insert(users)
    .values({
      clerkId,
      email: clerkUser.emailAddresses[0]?.emailAddress ?? null,
      phone: clerkUser.phoneNumbers[0]?.phoneNumber ?? null,
      tier: "free",
    })
    .onConflictDoNothing()
    .returning()

  return created ?? null
}
