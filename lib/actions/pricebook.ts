"use server"

import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { revalidatePath } from "next/cache"
import {
  getPricebookItemsByUser,
  countPricebookItems,
  createPricebookItem,
  updatePricebookItem,
  softDeletePricebookItem,
} from "@/lib/db/queries/pricebook"

const FREE_TIER_PRICEBOOK_LIMIT = 20

const priceRegex = /^\d+(\.\d{1,2})?$/
const optionalPrice = z.string().regex(priceRegex, "Invalid price").optional().or(z.literal(""))

const itemSchema = z.object({
  name:                 z.string().min(1).max(120),
  description:          z.string().max(300).optional(),
  unitPrice:            z.string().regex(priceRegex, "Invalid price"),
  costPrice:            optionalPrice,
  unit:                 z.string().max(20).optional(),
  sku:                  z.string().max(80).optional(),
  category:             z.string().max(80).optional(),
  supplierName:         z.string().max(120).optional(),
  defaultMarkupPercent: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid markup").optional().or(z.literal("")),
  defaultQuantity:      z.string().regex(/^\d+(\.\d{1,3})?$/, "Invalid quantity").optional().or(z.literal("")),
  notes:                z.string().max(500).optional(),
  isFavourite:          z.boolean().default(false),
  itemType:             z.enum(["labour", "material", "fixed", "travel"]),
  isActive:             z.boolean().default(true),
})

async function getUser(clerkId: string) {
  return db.query.users.findFirst({ where: eq(users.clerkId, clerkId) })
}

async function applyRateLimit(clerkId: string) {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const { rateLimiter } = await import("@/lib/upstash")
    const { success } = await rateLimiter.limit(clerkId)
    if (!success) throw new Error("Rate limit exceeded. Try again in a moment.")
  }
}

export async function getPricebookAction() {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("Unauthorized")
  const user = await getUser(clerkId)
  if (!user) throw new Error("User not found")
  return getPricebookItemsByUser(user.id)
}

export async function createPricebookItemAction(data: z.infer<typeof itemSchema>) {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("Unauthorized")

  await applyRateLimit(clerkId)

  const user = await getUser(clerkId)
  if (!user) throw new Error("User not found")

  const validated = itemSchema.parse(data)

  if (user.tier === "free") {
    const count = await countPricebookItems(user.id)
    if (count >= FREE_TIER_PRICEBOOK_LIMIT) {
      throw new Error(`Free tier limit: ${FREE_TIER_PRICEBOOK_LIMIT} pricebook items. Upgrade to add more.`)
    }
  }

  const item = await createPricebookItem({
    userId:               user.id,
    name:                 validated.name,
    description:          validated.description ?? null,
    unitPrice:            validated.unitPrice,
    costPrice:            validated.costPrice || null,
    unit:                 validated.unit ?? null,
    sku:                  validated.sku ?? null,
    category:             validated.category ?? null,
    supplierName:         validated.supplierName ?? null,
    defaultMarkupPercent: validated.defaultMarkupPercent || null,
    defaultQuantity:      validated.defaultQuantity || null,
    notes:                validated.notes ?? null,
    isFavourite:          validated.isFavourite,
    itemType:             validated.itemType,
    isActive:             validated.isActive,
  })

  revalidatePath("/pricebook")
  return { id: item.id }
}

export async function updatePricebookItemAction(id: string, data: z.infer<typeof itemSchema>) {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("Unauthorized")

  await applyRateLimit(clerkId)

  const user = await getUser(clerkId)
  if (!user) throw new Error("User not found")

  const validated = itemSchema.parse(data)

  await updatePricebookItem(id, user.id, {
    name:                 validated.name,
    description:          validated.description ?? null,
    unitPrice:            validated.unitPrice,
    costPrice:            validated.costPrice || null,
    unit:                 validated.unit ?? null,
    sku:                  validated.sku ?? null,
    category:             validated.category ?? null,
    supplierName:         validated.supplierName ?? null,
    defaultMarkupPercent: validated.defaultMarkupPercent || null,
    defaultQuantity:      validated.defaultQuantity || null,
    notes:                validated.notes ?? null,
    isFavourite:          validated.isFavourite,
    itemType:             validated.itemType,
    isActive:             validated.isActive,
  })

  // Keep company profile hourly rate in sync with the default Labour item
  if (validated.name === "Labour" && validated.itemType === "labour") {
    await db
      .update(users)
      .set({ hourlyRate: validated.unitPrice, updatedAt: new Date() })
      .where(eq(users.clerkId, clerkId))
    revalidatePath("/profile")
    revalidatePath("/overview")
  }

  revalidatePath("/pricebook")
}

export async function togglePricebookItemActiveAction(id: string, isActive: boolean) {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("Unauthorized")

  await applyRateLimit(clerkId)

  const user = await getUser(clerkId)
  if (!user) throw new Error("User not found")

  await updatePricebookItem(id, user.id, { isActive })
  revalidatePath("/pricebook")
}

export async function togglePricebookItemFavouriteAction(id: string, isFavourite: boolean) {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("Unauthorized")

  await applyRateLimit(clerkId)

  const user = await getUser(clerkId)
  if (!user) throw new Error("User not found")

  await updatePricebookItem(id, user.id, { isFavourite })
  revalidatePath("/pricebook")
}

export async function deletePricebookItemAction(id: string) {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("Unauthorized")

  await applyRateLimit(clerkId)

  const user = await getUser(clerkId)
  if (!user) throw new Error("User not found")

  await softDeletePricebookItem(id, user.id)
  revalidatePath("/pricebook")
}
