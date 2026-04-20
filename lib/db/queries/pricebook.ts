import { db } from "@/lib/db"
import { pricebookItems } from "@/lib/db/schema"
import { eq, and, isNull, desc, count } from "drizzle-orm"
import type { NewPricebookItem } from "@/lib/db/schema/pricebook"

export async function getPricebookItemsByUser(userId: string) {
  return db.query.pricebookItems.findMany({
    where: and(eq(pricebookItems.userId, userId), isNull(pricebookItems.deletedAt)),
    orderBy: [desc(pricebookItems.createdAt)],
  })
}

export async function countPricebookItems(userId: string) {
  const result = await db
    .select({ total: count() })
    .from(pricebookItems)
    .where(and(eq(pricebookItems.userId, userId), isNull(pricebookItems.deletedAt)))
  return Number(result[0]?.total ?? 0)
}

export async function createPricebookItem(data: NewPricebookItem) {
  const [item] = await db.insert(pricebookItems).values(data).returning()
  return item
}

export async function updatePricebookItem(id: string, userId: string, data: Partial<NewPricebookItem>) {
  await db
    .update(pricebookItems)
    .set(data)
    .where(and(eq(pricebookItems.id, id), eq(pricebookItems.userId, userId)))
}

export async function softDeletePricebookItem(id: string, userId: string) {
  await db
    .update(pricebookItems)
    .set({ deletedAt: new Date() })
    .where(and(eq(pricebookItems.id, id), eq(pricebookItems.userId, userId)))
}
