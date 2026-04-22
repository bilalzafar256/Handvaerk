import { db } from "@/lib/db"
import { customers } from "@/lib/db/schema"
import { eq, and, isNull, ilike, or, desc } from "drizzle-orm"
import type { NewCustomer } from "@/lib/db/schema/customers"

export async function getCustomersByUser(userId: string, search?: string) {
  const baseWhere = and(eq(customers.userId, userId), isNull(customers.deletedAt))

  if (search && search.trim()) {
    const term = `%${search.trim()}%`
    return db.query.customers.findMany({
      where: and(
        baseWhere,
        or(
          ilike(customers.name, term),
          ilike(customers.phone, term),
          ilike(customers.email, term),
        )
      ),
      orderBy: [desc(customers.createdAt)],
    })
  }

  return db.query.customers.findMany({
    where: baseWhere,
    orderBy: [desc(customers.createdAt)],
  })
}

export async function getCustomerById(id: string, userId: string) {
  return db.query.customers.findFirst({
    where: and(
      eq(customers.id, id),
      eq(customers.userId, userId),
      isNull(customers.deletedAt)
    ),
  })
}

export async function createCustomer(data: NewCustomer) {
  const [customer] = await db.insert(customers).values(data).returning()
  return customer
}

export async function updateCustomer(
  id: string,
  userId: string,
  data: Partial<Omit<NewCustomer, "id" | "userId" | "createdAt">>
) {
  const [updated] = await db
    .update(customers)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(customers.id, id), eq(customers.userId, userId)))
    .returning()
  return updated
}

export async function softDeleteCustomer(id: string, userId: string) {
  await db
    .update(customers)
    .set({ deletedAt: new Date() })
    .where(and(eq(customers.id, id), eq(customers.userId, userId)))
}

export async function toggleCustomerFavorite(id: string, userId: string) {
  const customer = await db.query.customers.findFirst({
    where: and(eq(customers.id, id), eq(customers.userId, userId), isNull(customers.deletedAt)),
    columns: { isFavorite: true },
  })
  if (!customer) return

  await db
    .update(customers)
    .set({ isFavorite: !customer.isFavorite, updatedAt: new Date() })
    .where(and(eq(customers.id, id), eq(customers.userId, userId)))
}
