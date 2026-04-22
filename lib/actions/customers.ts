"use server"

import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import {
  createCustomer,
  updateCustomer,
  softDeleteCustomer,
} from "@/lib/db/queries/customers"

const customerSchema = z.object({
  name:             z.string().min(1, "Name is required"),
  contactPerson:    z.string().optional(),
  phone:            z.string().optional(),
  secondPhone:      z.string().optional(),
  email:            z.string().email("Invalid email").optional().or(z.literal("")),
  addressLine1:     z.string().optional(),
  addressCity:      z.string().optional(),
  addressZip:       z.string().optional(),
  country:          z.string().optional(),
  cvrNumber:        z.string().optional(),
  eanNumber:        z.string().optional(),
  notes:            z.string().optional(),
  paymentTermsDays: z.number().int().min(1).optional(),
  preferredLanguage: z.enum(["da", "en"]).optional(),
  vatExempt:        z.boolean().optional(),
})

export type CustomerFormData = z.infer<typeof customerSchema>

async function getDbUserId(clerkId: string): Promise<string | null> {
  const user = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
  })
  return user?.id ?? null
}

async function applyRateLimit(clerkId: string) {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const { rateLimiter } = await import("@/lib/upstash")
    const { success } = await rateLimiter.limit(clerkId)
    if (!success) throw new Error("Rate limit exceeded. Try again in a moment.")
  }
}

async function applyStrictRateLimit(clerkId: string) {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const { strictRateLimiter } = await import("@/lib/upstash")
    const { success } = await strictRateLimiter.limit(clerkId)
    if (!success) throw new Error("Too many requests. Please wait before trying again.")
  }
}

export async function createCustomerAction(data: CustomerFormData) {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("Unauthorized")

  await applyRateLimit(clerkId)

  const validated = customerSchema.parse(data)
  const userId = await getDbUserId(clerkId)
  if (!userId) throw new Error("User not found")

  const customer = await createCustomer({
    userId,
    name:             validated.name,
    contactPerson:    validated.contactPerson || null,
    phone:            validated.phone || null,
    secondPhone:      validated.secondPhone || null,
    email:            validated.email || null,
    addressLine1:     validated.addressLine1 || null,
    addressCity:      validated.addressCity || null,
    addressZip:       validated.addressZip || null,
    country:          validated.country || "DK",
    cvrNumber:        validated.cvrNumber || null,
    eanNumber:        validated.eanNumber || null,
    notes:            validated.notes || null,
    paymentTermsDays: validated.paymentTermsDays ?? 14,
    preferredLanguage: validated.preferredLanguage ?? "da",
    vatExempt:        validated.vatExempt ?? false,
  })

  revalidatePath("/customers")
  return { id: customer.id }
}

export async function updateCustomerAction(id: string, data: CustomerFormData) {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("Unauthorized")

  await applyRateLimit(clerkId)

  const validated = customerSchema.parse(data)
  const userId = await getDbUserId(clerkId)
  if (!userId) throw new Error("User not found")

  await updateCustomer(id, userId, {
    name:             validated.name,
    contactPerson:    validated.contactPerson || null,
    phone:            validated.phone || null,
    secondPhone:      validated.secondPhone || null,
    email:            validated.email || null,
    addressLine1:     validated.addressLine1 || null,
    addressCity:      validated.addressCity || null,
    addressZip:       validated.addressZip || null,
    country:          validated.country || "DK",
    cvrNumber:        validated.cvrNumber || null,
    eanNumber:        validated.eanNumber || null,
    notes:            validated.notes || null,
    paymentTermsDays: validated.paymentTermsDays ?? 14,
    preferredLanguage: validated.preferredLanguage ?? "da",
    vatExempt:        validated.vatExempt ?? false,
  })

  revalidatePath("/customers")
  revalidatePath(`/customers/${id}`)
}

export async function deleteCustomerAction(id: string) {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("Unauthorized")

  await applyStrictRateLimit(clerkId)

  const userId = await getDbUserId(clerkId)
  if (!userId) throw new Error("User not found")

  await softDeleteCustomer(id, userId)

  revalidatePath("/customers")
  redirect("/customers")
}
