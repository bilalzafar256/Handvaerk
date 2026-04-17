"use server"

import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { users, quotes } from "@/lib/db/schema"
import { eq, inArray } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { randomBytes } from "crypto"
import {
  createQuote,
  updateQuote,
  softDeleteQuote,
  countAllQuotesEver,
  replaceQuoteItems,
  getQuoteById,
  getQuoteByToken,
  createTemplate,
  deleteTemplate,
  upsertMaterial,
} from "@/lib/db/queries/quotes"

const lineItemSchema = z.object({
  itemType:      z.enum(["labour", "material", "fixed", "travel"]),
  description:   z.string().min(1),
  quantity:      z.string().optional(),
  unitPrice:     z.string().optional(),
  markupPercent: z.string().optional(),
  discountType:  z.enum(["percent", "fixed"]).optional(),
  discountValue: z.string().optional(),
  vatRate:       z.string().default("25.00"),
  sortOrder:     z.number().default(0),
})

const quoteSchema = z.object({
  customerId:    z.string().uuid("Invalid customer"),
  jobId:         z.string().uuid().optional(),
  validUntil:    z.string().optional(),
  discountType:  z.enum(["percent", "fixed"]).optional(),
  discountValue: z.string().optional(),
  notes:         z.string().optional(),
  internalNotes: z.string().optional(),
  items:         z.array(lineItemSchema).default([]),
})

export type QuoteFormData = z.infer<typeof quoteSchema>

async function getDbUser(clerkId: string) {
  return db.query.users.findFirst({ where: eq(users.clerkId, clerkId) })
}

async function applyRateLimit(clerkId: string) {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const { rateLimiter } = await import("@/lib/upstash")
    const { success } = await rateLimiter.limit(clerkId)
    if (!success) throw new Error("Rate limit exceeded. Try again in a moment.")
  }
}

export async function createQuoteAction(data: QuoteFormData) {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("Unauthorized")

  await applyRateLimit(clerkId)

  const validated = quoteSchema.parse(data)
  const user = await getDbUser(clerkId)
  if (!user) throw new Error("User not found")

  const total = await countAllQuotesEver(user.id)
  const quoteNumber = `TIL-${String(total + 1).padStart(4, "0")}`
  const shareToken = randomBytes(24).toString("hex")

  const quote = await createQuote({
    userId:        user.id,
    customerId:    validated.customerId,
    jobId:         validated.jobId ?? null,
    quoteNumber,
    shareToken,
    validUntil:    validated.validUntil ?? null,
    discountType:  validated.discountType ?? null,
    discountValue: validated.discountValue ?? null,
    notes:         validated.notes ?? null,
    internalNotes: validated.internalNotes ?? null,
    status:        "draft",
  })

  if (validated.items.length > 0) {
    await replaceQuoteItems(quote.id, validated.items.map((item, i) => ({
      ...item,
      quantity:      item.quantity ?? null,
      unitPrice:     item.unitPrice ?? null,
      markupPercent: item.markupPercent ?? null,
      discountType:  item.discountType ?? null,
      discountValue: item.discountValue ?? null,
      sortOrder:     i,
    })))
  }

  revalidatePath("/quotes")
  return { id: quote.id }
}

export async function updateQuoteAction(id: string, data: QuoteFormData) {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("Unauthorized")

  await applyRateLimit(clerkId)

  const validated = quoteSchema.parse(data)
  const user = await getDbUser(clerkId)
  if (!user) throw new Error("User not found")

  await updateQuote(id, user.id, {
    customerId:    validated.customerId,
    jobId:         validated.jobId ?? null,
    validUntil:    validated.validUntil ?? null,
    discountType:  validated.discountType ?? null,
    discountValue: validated.discountValue ?? null,
    notes:         validated.notes ?? null,
    internalNotes: validated.internalNotes ?? null,
  })

  await replaceQuoteItems(id, validated.items.map((item, i) => ({
    ...item,
    quantity:      item.quantity ?? null,
    unitPrice:     item.unitPrice ?? null,
    markupPercent: item.markupPercent ?? null,
    sortOrder:     i,
  })))

  revalidatePath("/quotes")
  revalidatePath(`/quotes/${id}`)
}

export async function updateQuoteStatusAction(id: string, status: string) {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("Unauthorized")

  await applyRateLimit(clerkId)

  const user = await getDbUser(clerkId)
  if (!user) throw new Error("User not found")

  const validStatuses = ["draft", "sent", "accepted", "rejected", "expired"]
  if (!validStatuses.includes(status)) throw new Error("Invalid status")

  const updates: Record<string, unknown> = { status }
  if (status === "sent") updates.sentAt = new Date()
  if (status === "accepted") updates.acceptedAt = new Date()
  if (status === "rejected") updates.rejectedAt = new Date()

  await updateQuote(id, user.id, updates)
  revalidatePath(`/quotes/${id}`)
  revalidatePath("/quotes")
}

export async function deleteQuoteAction(id: string) {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("Unauthorized")

  await applyRateLimit(clerkId)

  const user = await getDbUser(clerkId)
  if (!user) throw new Error("User not found")

  await softDeleteQuote(id, user.id)
  revalidatePath("/quotes")
  redirect("/quotes")
}

// Public: customer accept/reject via share token
export async function acceptQuoteByTokenAction(token: string) {
  const quote = await getQuoteByToken(token)
  if (!quote || !["sent", "draft"].includes(quote.status ?? "")) throw new Error("Quote not available")
  if (quote.validUntil && new Date(quote.validUntil) < new Date(new Date().toDateString())) throw new Error("This quote has expired")

  await updateQuote(quote.id, quote.userId, {
    status: "accepted",
    acceptedAt: new Date(),
  })
  revalidatePath(`/quotes/${quote.id}`)
}

export async function rejectQuoteByTokenAction(token: string) {
  const quote = await getQuoteByToken(token)
  if (!quote || !["sent", "draft"].includes(quote.status ?? "")) throw new Error("Quote not available")
  if (quote.validUntil && new Date(quote.validUntil) < new Date(new Date().toDateString())) throw new Error("This quote has expired")

  await updateQuote(quote.id, quote.userId, {
    status: "rejected",
    rejectedAt: new Date(),
  })
  revalidatePath(`/quotes/${quote.id}`)
}

// Send quote email
export async function sendQuoteEmailAction(id: string) {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("Unauthorized")

  await applyRateLimit(clerkId)

  const user = await getDbUser(clerkId)
  if (!user) throw new Error("User not found")

  const quote = await getQuoteById(id, user.id)
  if (!quote) throw new Error("Quote not found")
  if (!quote.customer.email) throw new Error("Customer has no email address")

  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/en/q/${quote.shareToken}`

  const { resend, EMAIL_FROM } = await import("@/lib/email/client")
  const { QuoteSentEmail } = await import("@/lib/email/templates/quote-sent")

  const { data, error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: [quote.customer.email],
    subject: `Tilbud ${quote.quoteNumber}`,
    react: QuoteSentEmail({
      customerName: quote.customer.name,
      quoteNumber:  quote.quoteNumber,
      validUntil:   quote.validUntil ?? undefined,
      shareUrl,
    }),
  })

  if (error) throw new Error(`Email failed: ${error.message}`)

  await updateQuote(id, user.id, { status: "sent", sentAt: new Date() })
  revalidatePath(`/quotes/${id}`)
  revalidatePath("/quotes")

  return { emailId: data?.id }
}

// Save as template
export async function saveQuoteAsTemplateAction(quoteId: string, name: string) {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("Unauthorized")

  const user = await getDbUser(clerkId)
  if (!user) throw new Error("User not found")

  const quote = await getQuoteById(quoteId, user.id)
  if (!quote) throw new Error("Quote not found")

  const template = await createTemplate(user.id, name, quote.items)
  revalidatePath("/quotes")
  return { id: template.id }
}

export async function deleteTemplateAction(id: string) {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("Unauthorized")

  const user = await getDbUser(clerkId)
  if (!user) throw new Error("User not found")

  await deleteTemplate(id, user.id)
  revalidatePath("/quotes")
}

export async function mergeQuotesAction(ids: string[]): Promise<{ id: string }> {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("Unauthorized")

  await applyRateLimit(clerkId)

  if (ids.length < 2) throw new Error("Select at least 2 quotes to merge")

  const user = await getDbUser(clerkId)
  if (!user) throw new Error("User not found")

  const rows = await db.query.quotes.findMany({
    where: (q, { and, inArray, isNull, eq }) =>
      and(inArray(q.id, ids), eq(q.userId, user.id), isNull(q.deletedAt)),
    with: { items: true, customer: true },
  })

  if (rows.length !== ids.length) throw new Error("One or more quotes not found")

  const uniqueCustomers = [...new Set(rows.map(q => q.customerId))]
  if (uniqueCustomers.length > 1) throw new Error("All quotes must be for the same customer")

  const total = await countAllQuotesEver(user.id)
  const quoteNumber = `TIL-${String(total + 1).padStart(4, "0")}`
  const shareToken = randomBytes(24).toString("hex")

  // Merge notes: collect distinct non-empty notes
  const allNotes = rows.map(q => q.notes).filter((n): n is string => !!n?.trim())
  const uniqueNotes = [...new Set(allNotes)]
  const mergedNotes = uniqueNotes.join("\n---\n") || null

  const newQuote = await createQuote({
    userId:        user.id,
    customerId:    rows[0].customerId,
    quoteNumber,
    shareToken,
    status:        "draft",
    notes:         mergedNotes,
    discountType:  null,
    discountValue: null,
  })

  // Combine all items, re-assign sortOrder
  const allItems = rows.flatMap(q => q.items)
  allItems.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))

  await replaceQuoteItems(newQuote.id, allItems.map((item, i) => ({
    itemType:      item.itemType,
    description:   item.description,
    quantity:      item.quantity ?? null,
    unitPrice:     item.unitPrice ?? null,
    markupPercent: item.markupPercent ?? null,
    discountType:  item.discountType ?? null,
    discountValue: item.discountValue ?? null,
    vatRate:       item.vatRate ?? "25.00",
    sortOrder:     i,
  })))

  // Mark originals as merged
  await db.update(quotes)
    .set({ status: "merged", mergedInto: newQuote.id, updatedAt: new Date() })
    .where(inArray(quotes.id, ids))

  revalidatePath("/quotes")
  return { id: newQuote.id }
}

// Upsert material to catalog
export async function upsertMaterialAction(
  name: string,
  defaultUnit?: string,
  defaultPrice?: string,
  defaultMarkup?: string
) {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("Unauthorized")

  const user = await getDbUser(clerkId)
  if (!user) throw new Error("User not found")

  return upsertMaterial(user.id, name, defaultUnit, defaultPrice, defaultMarkup)
}
