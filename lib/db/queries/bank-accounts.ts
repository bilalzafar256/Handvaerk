import { db } from "@/lib/db"
import { bankAccounts } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import type { NewBankAccount } from "@/lib/db/schema/bank-accounts"

export async function getBankAccountsByUser(userId: string) {
  return db
    .select()
    .from(bankAccounts)
    .where(eq(bankAccounts.userId, userId))
    .orderBy(bankAccounts.createdAt)
}

export async function getDefaultBankAccount(userId: string) {
  return db.query.bankAccounts.findFirst({
    where: and(
      eq(bankAccounts.userId, userId),
      eq(bankAccounts.isDefault, true)
    ),
  })
}

export async function createBankAccount(data: NewBankAccount) {
  const [row] = await db.insert(bankAccounts).values(data).returning()
  return row
}

export async function setBankAccountDefault(id: string, userId: string) {
  // Clear all defaults for this user first
  await db
    .update(bankAccounts)
    .set({ isDefault: false })
    .where(eq(bankAccounts.userId, userId))

  // Set the target as default
  await db
    .update(bankAccounts)
    .set({ isDefault: true, updatedAt: new Date() })
    .where(and(eq(bankAccounts.id, id), eq(bankAccounts.userId, userId)))
}

export async function deleteBankAccount(id: string, userId: string) {
  await db
    .delete(bankAccounts)
    .where(and(eq(bankAccounts.id, id), eq(bankAccounts.userId, userId)))
}
