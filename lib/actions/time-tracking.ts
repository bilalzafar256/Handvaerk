"use server"

import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { users, quotes, invoices, quoteItems, invoiceItems, timeEntries } from "@/lib/db/schema"
import { eq, and, isNull } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import {
  getActiveEntry,
  createTimeEntry,
  updateTimeEntry,
  softDeleteTimeEntry,
  countTimeEntries,
  getTotalBillableMinutes,
  markEntriesAsBilledToQuote,
  markEntriesAsBilledToInvoice,
} from "@/lib/db/queries/time-entries"

const FREE_TIER_ENTRY_LIMIT = 50

async function resolveUser(clerkId: string) {
  return db.query.users.findFirst({ where: eq(users.clerkId, clerkId) })
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

// ─── Clock in ────────────────────────────────────────────────────────────────

export async function clockInAction(jobId: string): Promise<{ id: string }> {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("Unauthorized")
  await applyRateLimit(clerkId)

  const user = await resolveUser(clerkId)
  if (!user) throw new Error("User not found")

  const existing = await getActiveEntry(user.id)
  if (existing) throw new Error("You already have an active timer running.")

  if (user.tier === "free") {
    const total = await countTimeEntries(user.id)
    if (total >= FREE_TIER_ENTRY_LIMIT)
      throw new Error(`Free plan limit reached (${FREE_TIER_ENTRY_LIMIT} entries). Upgrade to continue tracking time.`)
  }

  const entry = await createTimeEntry({
    userId: user.id,
    jobId,
    startedAt: new Date(),
    isBillable: true,
  })

  revalidatePath("/overview")
  revalidatePath("/jobs")
  revalidatePath(`/jobs/${jobId}`)
  revalidatePath("/time-tracking")

  return { id: entry.id }
}

// ─── Clock out ───────────────────────────────────────────────────────────────

export async function clockOutAction(entryId: string): Promise<void> {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("Unauthorized")
  await applyRateLimit(clerkId)

  const user = await resolveUser(clerkId)
  if (!user) throw new Error("User not found")

  const entry = await db.query.timeEntries.findFirst({
    where: and(
      eq(timeEntries.id, entryId),
      eq(timeEntries.userId, user.id),
      isNull(timeEntries.deletedAt),
    ),
  })
  if (!entry) throw new Error("Time entry not found")
  if (entry.endedAt) throw new Error("Timer is already stopped")

  const now = new Date()
  const durationMinutes = Math.max(1, Math.round((now.getTime() - entry.startedAt.getTime()) / 60000))

  await updateTimeEntry(entryId, user.id, { endedAt: now, durationMinutes })

  revalidatePath("/overview")
  revalidatePath("/jobs")
  revalidatePath(`/jobs/${entry.jobId}`)
  revalidatePath("/time-tracking")
}

// ─── Manual entry ────────────────────────────────────────────────────────────

const manualSchema = z.object({
  jobId:       z.string().uuid(),
  date:        z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime:   z.string().regex(/^\d{2}:\d{2}$/),
  endTime:     z.string().regex(/^\d{2}:\d{2}$/),
  description: z.string().optional(),
  isBillable:  z.boolean().default(true),
})

export async function createManualEntryAction(raw: z.infer<typeof manualSchema>): Promise<void> {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("Unauthorized")
  await applyRateLimit(clerkId)

  const user = await resolveUser(clerkId)
  if (!user) throw new Error("User not found")

  if (user.tier === "free") {
    const total = await countTimeEntries(user.id)
    if (total >= FREE_TIER_ENTRY_LIMIT)
      throw new Error(`Free plan limit reached (${FREE_TIER_ENTRY_LIMIT} entries). Upgrade to continue tracking time.`)
  }

  const data = manualSchema.parse(raw)
  const startedAt = new Date(`${data.date}T${data.startTime}:00`)
  const endedAt = new Date(`${data.date}T${data.endTime}:00`)
  if (endedAt <= startedAt) throw new Error("End time must be after start time")
  const durationMinutes = Math.max(1, Math.round((endedAt.getTime() - startedAt.getTime()) / 60000))

  await createTimeEntry({
    userId: user.id,
    jobId: data.jobId,
    startedAt,
    endedAt,
    durationMinutes,
    description: data.description ?? null,
    isBillable: data.isBillable,
  })

  revalidatePath(`/jobs/${data.jobId}`)
  revalidatePath("/time-tracking")
}

// ─── Update entry ────────────────────────────────────────────────────────────

const updateSchema = z.object({
  description: z.string().optional(),
  isBillable:  z.boolean(),
})

export async function updateTimeEntryAction(entryId: string, raw: z.infer<typeof updateSchema>): Promise<void> {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("Unauthorized")
  await applyRateLimit(clerkId)

  const user = await resolveUser(clerkId)
  if (!user) throw new Error("User not found")

  const data = updateSchema.parse(raw)
  await updateTimeEntry(entryId, user.id, {
    description: data.description ?? null,
    isBillable: data.isBillable,
  })

  revalidatePath("/time-tracking")
}

// ─── Delete entry ────────────────────────────────────────────────────────────

export async function deleteTimeEntryAction(entryId: string): Promise<void> {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("Unauthorized")
  await applyStrictRateLimit(clerkId)

  const user = await resolveUser(clerkId)
  if (!user) throw new Error("User not found")

  await softDeleteTimeEntry(entryId, user.id)
  revalidatePath("/time-tracking")
}

// ─── Add billable hours to quote or invoice ───────────────────────────────────

export async function addBillableHoursToLineItemAction(
  jobId: string,
  targetType: "quote" | "invoice",
  targetId: string,
): Promise<void> {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("Unauthorized")
  await applyRateLimit(clerkId)

  const user = await resolveUser(clerkId)
  if (!user) throw new Error("User not found")
  if (!user.hourlyRate) throw new Error("Set your hourly rate in profile before adding time to documents.")

  const totalMinutes = await getTotalBillableMinutes(jobId, user.id)
  if (totalMinutes === 0) throw new Error("No billable hours to add.")

  const hours = Math.round((totalMinutes / 60) * 100) / 100
  const rate = Number(user.hourlyRate)
  const lineTotal = Math.round(hours * rate * 100) / 100

  if (targetType === "quote") {
    const quote = await db.query.quotes.findFirst({
      where: and(eq(quotes.id, targetId), eq(quotes.userId, user.id), isNull(quotes.deletedAt)),
    })
    if (!quote) throw new Error("Quote not found")

    const existingCount = await db.query.quoteItems.findMany({
      where: eq(quoteItems.quoteId, targetId),
    })

    await db.insert(quoteItems).values({
      quoteId: targetId,
      itemType: "labour",
      description: "Time on site",
      quantity: String(hours),
      unitPrice: String(rate),
      vatRate: "25.00",
      sortOrder: existingCount.length,
    })

    await markEntriesAsBilledToQuote(jobId, user.id, targetId)
    revalidatePath(`/quotes/${targetId}`)
    revalidatePath(`/quotes/${targetId}/edit`)
  } else {
    const invoice = await db.query.invoices.findFirst({
      where: and(eq(invoices.id, targetId), eq(invoices.userId, user.id), isNull(invoices.deletedAt)),
    })
    if (!invoice) throw new Error("Invoice not found")

    const existingCount = await db.query.invoiceItems.findMany({
      where: eq(invoiceItems.invoiceId, targetId),
    })

    await db.insert(invoiceItems).values({
      invoiceId: targetId,
      itemType: "labour",
      description: "Time on site",
      quantity: String(hours),
      unitPrice: String(rate),
      vatRate: "25.00",
      lineTotal: String(lineTotal),
      sortOrder: existingCount.length,
    })

    await markEntriesAsBilledToInvoice(jobId, user.id, targetId)
    revalidatePath(`/invoices/${targetId}`)
    revalidatePath(`/invoices/${targetId}/edit`)
  }

  revalidatePath(`/jobs/${jobId}`)
}
