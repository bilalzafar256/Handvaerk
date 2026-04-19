"use server"

import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const profileSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  cvrNumber: z.string().optional(),
  addressLine1: z.string().optional(),
  addressCity: z.string().optional(),
  addressZip: z.string().optional(),
  hourlyRate: z.string().optional(),
})

export type ProfileFormData = z.infer<typeof profileSchema>

export async function updateProfile(data: ProfileFormData) {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("Unauthorized")

  // Rate limit only when Upstash is configured
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const { rateLimiter } = await import("@/lib/upstash")
    const { success } = await rateLimiter.limit(clerkId)
    if (!success) throw new Error("Rate limit exceeded. Try again in a moment.")
  }

  const validated = profileSchema.parse(data)

  // Upsert: creates the row if the webhook hasn't synced the user yet
  await db
    .insert(users)
    .values({
      clerkId,
      companyName: validated.companyName,
      cvrNumber: validated.cvrNumber || null,
      addressLine1: validated.addressLine1 || null,
      addressCity: validated.addressCity || null,
      addressZip: validated.addressZip || null,
      hourlyRate: validated.hourlyRate && validated.hourlyRate.length > 0
        ? validated.hourlyRate
        : null,
      tier: "free",
    })
    .onConflictDoUpdate({
      target: users.clerkId,
      set: {
        companyName: validated.companyName,
        cvrNumber: validated.cvrNumber || null,
        addressLine1: validated.addressLine1 || null,
        addressCity: validated.addressCity || null,
        addressZip: validated.addressZip || null,
        hourlyRate: validated.hourlyRate && validated.hourlyRate.length > 0
          ? validated.hourlyRate
          : null,
        updatedAt: new Date(),
      },
    })

  revalidatePath("/profile")
  revalidatePath("/overview")
}

export async function saveLogoUrl(logoUrl: string) {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("Unauthorized")

  await db
    .update(users)
    .set({ logoUrl, updatedAt: new Date() })
    .where(eq(users.clerkId, clerkId))

  revalidatePath("/profile")
}

export async function updateGoogleReviewUrlAction(googleReviewUrl: string) {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("Unauthorized")

  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const { rateLimiter } = await import("@/lib/upstash")
    const { success } = await rateLimiter.limit(clerkId)
    if (!success) throw new Error("Rate limit exceeded. Try again in a moment.")
  }

  await db
    .update(users)
    .set({ googleReviewUrl: googleReviewUrl || null, updatedAt: new Date() })
    .where(eq(users.clerkId, clerkId))

  revalidatePath("/profile")
}

export async function updateMobilepayAction(mobilepayNumber: string) {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("Unauthorized")

  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const { rateLimiter } = await import("@/lib/upstash")
    const { success } = await rateLimiter.limit(clerkId)
    if (!success) throw new Error("Rate limit exceeded. Try again in a moment.")
  }

  await db
    .update(users)
    .set({ mobilepayNumber: mobilepayNumber || null, updatedAt: new Date() })
    .where(eq(users.clerkId, clerkId))

  revalidatePath("/profile")
}
