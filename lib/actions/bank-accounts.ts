"use server"

import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import {
  createBankAccount,
  setBankAccountDefault,
  deleteBankAccount,
} from "@/lib/db/queries/bank-accounts"

const bankAccountSchema = z.object({
  bankName:      z.string().optional(),
  regNumber:     z.string().min(1, "Reg. number is required"),
  accountNumber: z.string().min(1, "Account number is required"),
})

async function getDbUser(clerkId: string) {
  return db.query.users.findFirst({ where: eq(users.clerkId, clerkId) })
}

async function applyRateLimit(clerkId: string) {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const { rateLimiter } = await import("@/lib/upstash")
    const { success } = await rateLimiter.limit(clerkId)
    if (!success) throw new Error("Rate limit exceeded.")
  }
}

export async function addBankAccountAction(data: z.infer<typeof bankAccountSchema>) {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("Unauthorized")

  await applyRateLimit(clerkId)

  const validated = bankAccountSchema.parse(data)
  const user = await getDbUser(clerkId)
  if (!user) throw new Error("User not found")

  const account = await createBankAccount({
    userId:        user.id,
    bankName:      validated.bankName || null,
    regNumber:     validated.regNumber,
    accountNumber: validated.accountNumber,
    isDefault:     false,
  })

  revalidatePath("/profile")
  return { id: account.id }
}

export async function setBankAccountDefaultAction(id: string) {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("Unauthorized")

  await applyRateLimit(clerkId)

  const user = await getDbUser(clerkId)
  if (!user) throw new Error("User not found")

  await setBankAccountDefault(id, user.id)
  revalidatePath("/profile")
}

export async function deleteBankAccountAction(id: string) {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("Unauthorized")

  await applyRateLimit(clerkId)

  const user = await getDbUser(clerkId)
  if (!user) throw new Error("User not found")

  await deleteBankAccount(id, user.id)
  revalidatePath("/profile")
}
