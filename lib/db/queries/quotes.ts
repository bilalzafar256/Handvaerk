import { db } from "@/lib/db"
import { quotes, quoteItems, quoteTemplates, materialsCatalog } from "@/lib/db/schema"
import { eq, and, isNull, ilike, or, desc, count } from "drizzle-orm"
import type {
  NewQuote,
  NewQuoteItem,
  QuoteTemplate,
} from "@/lib/db/schema/quotes"

export async function getQuotesByUser(userId: string, search?: string) {
  const baseWhere = and(eq(quotes.userId, userId), isNull(quotes.deletedAt))

  if (search && search.trim()) {
    const term = `%${search.trim()}%`
    return db.query.quotes.findMany({
      where: and(baseWhere, ilike(quotes.quoteNumber, term)),
      orderBy: [desc(quotes.createdAt)],
      with: { customer: true, items: true },
    })
  }

  return db.query.quotes.findMany({
    where: baseWhere,
    orderBy: [desc(quotes.createdAt)],
    with: { customer: true, items: true },
  })
}

export async function getQuotesByCustomer(customerId: string, userId: string) {
  return db.query.quotes.findMany({
    where: and(eq(quotes.customerId, customerId), eq(quotes.userId, userId), isNull(quotes.deletedAt)),
    orderBy: [desc(quotes.createdAt)],
    with: { items: true },
  })
}

export async function getQuotesByJob(jobId: string, userId: string) {
  return db.query.quotes.findMany({
    where: and(eq(quotes.jobId, jobId), eq(quotes.userId, userId), isNull(quotes.deletedAt)),
    orderBy: [desc(quotes.createdAt)],
    with: { customer: true, items: true },
  })
}

export async function getQuoteById(id: string, userId: string) {
  return db.query.quotes.findFirst({
    where: and(eq(quotes.id, id), eq(quotes.userId, userId), isNull(quotes.deletedAt)),
    with: { customer: true, job: true, items: true },
  })
}

export async function getQuoteByToken(token: string) {
  return db.query.quotes.findFirst({
    where: and(eq(quotes.shareToken, token), isNull(quotes.deletedAt)),
    with: { customer: true, items: true, user: true },
  })
}

export async function createQuote(data: NewQuote) {
  const [quote] = await db.insert(quotes).values(data).returning()
  return quote
}

export async function updateQuote(
  id: string,
  userId: string,
  data: Partial<Omit<NewQuote, "id" | "userId" | "createdAt">>
) {
  const [updated] = await db
    .update(quotes)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(quotes.id, id), eq(quotes.userId, userId)))
    .returning()
  return updated
}

export async function softDeleteQuote(id: string, userId: string) {
  await db
    .update(quotes)
    .set({ deletedAt: new Date() })
    .where(and(eq(quotes.id, id), eq(quotes.userId, userId)))
}

export async function countAllQuotesEver(userId: string) {
  const result = await db
    .select({ value: count() })
    .from(quotes)
    .where(eq(quotes.userId, userId))
  return Number(result[0]?.value ?? 0)
}

// Line items
export async function replaceQuoteItems(quoteId: string, items: Omit<NewQuoteItem, "quoteId">[]) {
  await db.delete(quoteItems).where(eq(quoteItems.quoteId, quoteId))
  if (items.length === 0) return []
  return db.insert(quoteItems).values(items.map(item => ({ ...item, quoteId }))).returning()
}

// Templates
export async function getTemplatesByUser(userId: string) {
  return db.query.quoteTemplates.findMany({
    where: eq(quoteTemplates.userId, userId),
    orderBy: [desc(quoteTemplates.createdAt)],
  })
}

export async function createTemplate(userId: string, name: string, items: unknown) {
  const [template] = await db.insert(quoteTemplates).values({ userId, name, items }).returning()
  return template
}

export async function deleteTemplate(id: string, userId: string) {
  await db.delete(quoteTemplates).where(and(eq(quoteTemplates.id, id), eq(quoteTemplates.userId, userId)))
}

// Materials catalog
export async function getMaterialsByUser(userId: string, search?: string) {
  if (search && search.trim()) {
    return db.query.materialsCatalog.findMany({
      where: and(eq(materialsCatalog.userId, userId), ilike(materialsCatalog.name, `%${search.trim()}%`)),
      orderBy: [desc(materialsCatalog.createdAt)],
    })
  }
  return db.query.materialsCatalog.findMany({
    where: eq(materialsCatalog.userId, userId),
    orderBy: [desc(materialsCatalog.createdAt)],
  })
}

export async function upsertMaterial(
  userId: string,
  name: string,
  defaultUnit?: string,
  defaultPrice?: string,
  defaultMarkup?: string
) {
  const [material] = await db
    .insert(materialsCatalog)
    .values({ userId, name, defaultUnit, defaultPrice, defaultMarkup })
    .returning()
  return material
}
