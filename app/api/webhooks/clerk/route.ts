import { Webhook } from "svix"
import { headers } from "next/headers"
import type { WebhookEvent } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function POST(req: Request) {
  const SIGNING_SECRET = process.env.CLERK_WEBHOOK_SECRET
  if (!SIGNING_SECRET) {
    return new Response("Missing CLERK_WEBHOOK_SECRET", { status: 500 })
  }

  const wh = new Webhook(SIGNING_SECRET)
  const headerPayload = await headers()

  const svix_id = headerPayload.get("svix-id")
  const svix_timestamp = headerPayload.get("svix-timestamp")
  const svix_signature = headerPayload.get("svix-signature")

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Missing svix headers", { status: 400 })
  }

  const payload = await req.json()
  const body = JSON.stringify(payload)

  let event: WebhookEvent
  try {
    event = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent
  } catch {
    return new Response("Webhook verification failed", { status: 400 })
  }

  if (event.type === "user.created") {
    const { id, email_addresses, phone_numbers } = event.data
    await db.insert(users).values({
      clerkId: id,
      email: email_addresses[0]?.email_address ?? null,
      phone: phone_numbers[0]?.phone_number ?? null,
      tier: "free",
    }).onConflictDoNothing()
  }

  if (event.type === "user.deleted" && event.data.id) {
    await db
      .update(users)
      .set({ updatedAt: new Date() })
      .where(eq(users.clerkId, event.data.id))
  }

  return new Response("OK", { status: 200 })
}
