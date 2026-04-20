"use server"

import { auth, clerkClient } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { users, customers, jobs, jobPhotos, quotes, quoteItems, invoices, invoiceItems, timeEntries, pricebookItems } from "@/lib/db/schema"
import { eq, and, isNull, inArray } from "drizzle-orm"
import { resend, EMAIL_FROM } from "@/lib/email/client"
import { AccountDeletionConfirmationEmail } from "@/lib/email/templates/account-deletion-confirmation"
import { render } from "@react-email/render"

async function applyStrictRateLimit(clerkId: string) {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const { strictRateLimiter } = await import("@/lib/upstash")
    const { success } = await strictRateLimiter.limit(clerkId)
    if (!success) throw new Error("Too many requests. Please wait before trying again.")
  }
}

export async function exportUserDataAction(): Promise<string> {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("Unauthorized")

  await applyStrictRateLimit(clerkId)

  const user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) })
  if (!user) throw new Error("User not found")

  const [allCustomers, allJobs, allQuotes, allInvoices] = await Promise.all([
    db.query.customers.findMany({
      where: and(eq(customers.userId, user.id), isNull(customers.deletedAt)),
    }),
    db.query.jobs.findMany({
      where: and(eq(jobs.userId, user.id), isNull(jobs.deletedAt)),
    }),
    db.query.quotes.findMany({
      where: and(eq(quotes.userId, user.id), isNull(quotes.deletedAt)),
    }),
    db.query.invoices.findMany({
      where: and(eq(invoices.userId, user.id), isNull(invoices.deletedAt)),
    }),
  ])

  const jobIds = allJobs.map((j) => j.id)
  const quoteIds = allQuotes.map((q) => q.id)
  const invoiceIds = allInvoices.map((i) => i.id)

  const [allPhotos, allQuoteItems, allInvoiceItems, allTimeEntries, allPricebookItems] = await Promise.all([
    jobIds.length > 0
      ? db.select().from(jobPhotos).where(inArray(jobPhotos.jobId, jobIds))
      : Promise.resolve([]),
    quoteIds.length > 0
      ? db.select().from(quoteItems).where(inArray(quoteItems.quoteId, quoteIds))
      : Promise.resolve([]),
    invoiceIds.length > 0
      ? db.select().from(invoiceItems).where(inArray(invoiceItems.invoiceId, invoiceIds))
      : Promise.resolve([]),
    db.select().from(timeEntries).where(eq(timeEntries.userId, user.id)),
    db.select().from(pricebookItems).where(and(eq(pricebookItems.userId, user.id), isNull(pricebookItems.deletedAt))),
  ])

  const exportData = {
    exportedAt: new Date().toISOString(),
    profile: {
      email: user.email,
      phone: user.phone,
      companyName: user.companyName,
      cvrNumber: user.cvrNumber,
      addressLine1: user.addressLine1,
      addressCity: user.addressCity,
      addressZip: user.addressZip,
      hourlyRate: user.hourlyRate,
      tier: user.tier,
      createdAt: user.createdAt,
    },
    customers: allCustomers,
    jobs: allJobs.map((job) => ({
      ...job,
      photos: allPhotos.filter((p) => p.jobId === job.id),
    })),
    quotes: allQuotes.map((quote) => ({
      ...quote,
      items: allQuoteItems.filter((item) => item.quoteId === quote.id),
    })),
    invoices: allInvoices.map((invoice) => ({
      ...invoice,
      items: allInvoiceItems.filter((item) => item.invoiceId === invoice.id),
    })),
    timeEntries: allTimeEntries,
    pricebook:   allPricebookItems,
  }

  return JSON.stringify(exportData, null, 2)
}

export async function initiateAccountDeletionAction(confirmEmail: string): Promise<void> {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("Unauthorized")

  await applyStrictRateLimit(clerkId)

  const user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) })
  if (!user) throw new Error("User not found")

  if (!user.email || user.email.toLowerCase() !== confirmEmail.toLowerCase()) {
    throw new Error("Email does not match your account email.")
  }

  if (user.email) {
    const html = await render(AccountDeletionConfirmationEmail({ email: user.email }))
    await resend.emails.send({
      from: EMAIL_FROM,
      to: user.email,
      subject: "Your Håndværk Pro account has been deleted",
      html,
    })
  }

  const client = await clerkClient()
  await client.users.deleteUser(clerkId)
}
