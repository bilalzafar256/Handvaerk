"use server"

import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { users, invoices } from "@/lib/db/schema"
import { eq, inArray } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import {
  createInvoice,
  updateInvoice,
  softDeleteInvoice,
  countAllInvoicesEver,
  replaceInvoiceItems,
  getInvoiceById,
  getInvoiceByQuote,
  markOverdueInvoices,
} from "@/lib/db/queries/invoices"
import { getJobById } from "@/lib/db/queries/jobs"
import { getQuoteById } from "@/lib/db/queries/quotes"
import { getDefaultBankAccount } from "@/lib/db/queries/bank-accounts"

const lineItemSchema = z.object({
  itemType:      z.enum(["labour", "material", "fixed", "travel"]),
  description:   z.string().min(1),
  quantity:      z.string().optional(),
  unitPrice:     z.string().optional(),
  discountType:  z.enum(["percent", "fixed"]).optional(),
  discountValue: z.string().optional(),
  vatRate:       z.string().default("25.00"),
  lineTotal:     z.string().optional(),
  sortOrder:     z.number().default(0),
})

const invoiceSchema = z.object({
  customerId:       z.string().uuid("Invalid customer"),
  jobId:            z.string().uuid().optional(),
  quoteId:          z.string().uuid().optional(),
  dueDate:          z.string().min(1, "Due date is required"),
  paymentTermsDays: z.number().default(14),
  bankAccount:      z.string().optional(),
  mobilepayNumber:  z.string().optional(),
  notes:            z.string().optional(),
  items:            z.array(lineItemSchema).default([]),
})

export type InvoiceFormData = z.infer<typeof invoiceSchema>

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

async function applyStrictRateLimit(clerkId: string) {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const { strictRateLimiter } = await import("@/lib/upstash")
    const { success } = await strictRateLimiter.limit(clerkId)
    if (!success) throw new Error("Too many requests. Please wait before trying again.")
  }
}

function applyLineDiscount(gross: number, discountType?: string, discountValue?: string): number {
  if (!discountType || !discountValue) return gross
  const dv = parseFloat(discountValue) || 0
  if (discountType === "percent") return gross * (1 - dv / 100)
  return Math.max(0, gross - dv)
}

function calcTotals(items: z.infer<typeof lineItemSchema>[], headerDiscountType?: string, headerDiscountValue?: string) {
  let subtotalExVat = 0
  let vatAmount = 0

  for (const item of items) {
    const qty = parseFloat(item.quantity ?? "1")
    const price = parseFloat(item.unitPrice ?? "0")
    const gross = qty * price
    const lineEx = applyLineDiscount(gross, item.discountType, item.discountValue)
    subtotalExVat += lineEx
    vatAmount += lineEx * (parseFloat(item.vatRate ?? "25") / 100)
  }

  // Apply header discount
  let discountAmount = 0
  if (headerDiscountType && headerDiscountValue) {
    const dv = parseFloat(headerDiscountValue) || 0
    discountAmount = headerDiscountType === "percent"
      ? subtotalExVat * (dv / 100)
      : Math.min(dv, subtotalExVat)
    subtotalExVat -= discountAmount
    vatAmount = subtotalExVat * 0.25
  }

  return {
    subtotalExVat: subtotalExVat.toFixed(2),
    vatAmount: vatAmount.toFixed(2),
    totalInclVat: (subtotalExVat + vatAmount).toFixed(2),
    discountAmount: discountAmount.toFixed(2),
  }
}

function makeInvoiceNumber(total: number) {
  return `FAK-${String(total + 1).padStart(4, "0")}`
}

function makeDueDate(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split("T")[0]
}

export async function createInvoiceAction(data: InvoiceFormData) {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("Unauthorized")

  await applyRateLimit(clerkId)

  const validated = invoiceSchema.parse(data)
  const user = await getDbUser(clerkId)
  if (!user) throw new Error("User not found")

  const total = await countAllInvoicesEver(user.id)
  const invoiceNumber = makeInvoiceNumber(total)
  const totals = calcTotals(validated.items)
  const issueDate = new Date().toISOString().split("T")[0]
  const dueDate = validated.dueDate

  const invoice = await createInvoice({
    userId:           user.id,
    customerId:       validated.customerId,
    jobId:            validated.jobId ?? null,
    quoteId:          validated.quoteId ?? null,
    invoiceNumber,
    status:           "draft",
    issueDate,
    dueDate,
    paymentTermsDays: validated.paymentTermsDays,
    subtotalExVat:    totals.subtotalExVat,
    vatAmount:        totals.vatAmount,
    totalInclVat:     totals.totalInclVat,
    discountAmount:   totals.discountAmount,
    bankAccount:      validated.bankAccount ?? null,
    mobilepayNumber:  validated.mobilepayNumber ?? null,
    notes:            validated.notes ?? null,
    eanNumber:        null,
  })

  await replaceInvoiceItems(invoice.id, validated.items.map((item, i) => {
    const qty = parseFloat(item.quantity ?? "1")
    const price = parseFloat(item.unitPrice ?? "0")
    const gross = qty * price
    const lineTotal = applyLineDiscount(gross, item.discountType, item.discountValue).toFixed(2)
    return {
      itemType:      item.itemType,
      description:   item.description,
      quantity:      item.quantity ?? null,
      unitPrice:     item.unitPrice ?? null,
      discountType:  item.discountType ?? null,
      discountValue: item.discountValue ?? null,
      vatRate:       item.vatRate,
      lineTotal,
      sortOrder:     i,
    }
  }))

  revalidatePath("/invoices")
  return { id: invoice.id }
}

// One-tap: create invoice pre-filled from a job
export async function createInvoiceFromJobAction(jobId: string) {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("Unauthorized")

  await applyRateLimit(clerkId)

  const user = await getDbUser(clerkId)
  if (!user) throw new Error("User not found")

  const job = await getJobById(jobId, user.id)
  if (!job) throw new Error("Job not found")

  const [total, defaultBankAccount] = await Promise.all([
    countAllInvoicesEver(user.id),
    getDefaultBankAccount(user.id),
  ])
  const invoiceNumber = makeInvoiceNumber(total)
  const issueDate = new Date().toISOString().split("T")[0]
  const dueDate = makeDueDate(14)
  const bankAccountStr = defaultBankAccount
    ? `Reg. ${defaultBankAccount.regNumber} | Konto ${defaultBankAccount.accountNumber}`
    : null

  // Create a basic invoice with one labour line item from the job
  const invoice = await createInvoice({
    userId:           user.id,
    customerId:       job.customerId,
    jobId:            job.id,
    invoiceNumber,
    status:           "draft",
    issueDate,
    dueDate,
    paymentTermsDays: 14,
    subtotalExVat:    "0.00",
    vatAmount:        "0.00",
    totalInclVat:     "0.00",
    bankAccount:      bankAccountStr,
    mobilepayNumber:  user.mobilepayNumber ?? null,
    notes:            job.description ?? null,
    eanNumber:        null,
  })

  // Mark job as invoiced
  const { updateJob } = await import("@/lib/db/queries/jobs")
  await updateJob(jobId, user.id, { status: "invoiced" })

  revalidatePath("/invoices")
  revalidatePath("/jobs")
  revalidatePath(`/jobs/${jobId}`)

  redirect(`/invoices/${invoice.id}/edit`)
}

// One-tap: create invoice from accepted quote
// Returns { existingInvoiceId } if a non-deleted invoice already exists for this quote (and force=false)
export async function createInvoiceFromQuoteAction(quoteId: string, force = false): Promise<{ id: string } | { existingInvoiceId: string }> {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("Unauthorized")

  await applyRateLimit(clerkId)

  const user = await getDbUser(clerkId)
  if (!user) throw new Error("User not found")

  const quote = await getQuoteById(quoteId, user.id)
  if (!quote) throw new Error("Quote not found")

  // F-603: duplicate guard
  if (!force) {
    const existing = await getInvoiceByQuote(quoteId, user.id)
    if (existing) return { existingInvoiceId: existing.id }
  }

  const [total, defaultBankAccount] = await Promise.all([
    countAllInvoicesEver(user.id),
    getDefaultBankAccount(user.id),
  ])
  const invoiceNumber = makeInvoiceNumber(total)
  const issueDate = new Date().toISOString().split("T")[0]
  const dueDate = makeDueDate(14)
  const bankAccountStr = defaultBankAccount
    ? `Reg. ${defaultBankAccount.regNumber} | Konto ${defaultBankAccount.accountNumber}`
    : null

  // F-602: Calculate totals from quote items (apply per-line discounts)
  let subtotalExVat = quote.items.reduce((sum, item) => {
    const qty = parseFloat(item.quantity ?? "1")
    const price = parseFloat(item.unitPrice ?? "0")
    const markup = 1 + parseFloat(item.markupPercent ?? "0") / 100
    const gross = qty * price * markup
    return sum + applyLineDiscount(gross, item.discountType ?? undefined, item.discountValue ?? undefined)
  }, 0)

  // F-602: Apply header discount from quote
  let discountAmount = 0
  if (quote.discountType && quote.discountValue) {
    const dv = parseFloat(quote.discountValue) || 0
    discountAmount = quote.discountType === "percent"
      ? subtotalExVat * (dv / 100)
      : Math.min(dv, subtotalExVat)
    subtotalExVat -= discountAmount
  }

  const vatAmount = subtotalExVat * 0.25
  const totalInclVat = subtotalExVat + vatAmount

  const invoice = await createInvoice({
    userId:           user.id,
    customerId:       quote.customerId,
    jobId:            quote.jobId ?? null,
    quoteId:          quote.id,
    invoiceNumber,
    status:           "draft",
    issueDate,
    dueDate,
    paymentTermsDays: 14,
    subtotalExVat:    subtotalExVat.toFixed(2),
    vatAmount:        vatAmount.toFixed(2),
    totalInclVat:     totalInclVat.toFixed(2),
    discountAmount:   discountAmount.toFixed(2),
    bankAccount:      bankAccountStr,
    mobilepayNumber:  user.mobilepayNumber ?? null,
    notes:            quote.notes ?? null,
    eanNumber:        quote.customer.eanNumber ?? null,
  })

  // Map quote items to invoice items (carry per-line discounts)
  await replaceInvoiceItems(invoice.id, quote.items.map((item, i) => {
    const qty = parseFloat(item.quantity ?? "1")
    const price = parseFloat(item.unitPrice ?? "0")
    const markup = 1 + parseFloat(item.markupPercent ?? "0") / 100
    const gross = qty * price * markup
    const lineTotal = applyLineDiscount(gross, item.discountType ?? undefined, item.discountValue ?? undefined).toFixed(2)
    return {
      itemType:      item.itemType,
      description:   item.description,
      quantity:      item.quantity ?? null,
      unitPrice:     item.unitPrice ?? null,
      discountType:  item.discountType ?? null,
      discountValue: item.discountValue ?? null,
      vatRate:       item.vatRate ?? "25.00",
      lineTotal,
      sortOrder:     i,
    }
  }))

  revalidatePath("/invoices")
  return { id: invoice.id }
}

export async function updateInvoiceAction(id: string, data: InvoiceFormData) {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("Unauthorized")

  await applyRateLimit(clerkId)

  const validated = invoiceSchema.parse(data)
  const user = await getDbUser(clerkId)
  if (!user) throw new Error("User not found")

  const totals = calcTotals(validated.items)

  await updateInvoice(id, user.id, {
    customerId:       validated.customerId,
    jobId:            validated.jobId ?? null,
    quoteId:          validated.quoteId ?? null,
    dueDate:          validated.dueDate,
    paymentTermsDays: validated.paymentTermsDays,
    subtotalExVat:    totals.subtotalExVat,
    vatAmount:        totals.vatAmount,
    totalInclVat:     totals.totalInclVat,
    discountAmount:   totals.discountAmount,
    bankAccount:      validated.bankAccount ?? null,
    mobilepayNumber:  validated.mobilepayNumber ?? null,
    notes:            validated.notes ?? null,
  })

  await replaceInvoiceItems(id, validated.items.map((item, i) => {
    const qty = parseFloat(item.quantity ?? "1")
    const price = parseFloat(item.unitPrice ?? "0")
    const gross = qty * price
    const lineTotal = applyLineDiscount(gross, item.discountType, item.discountValue).toFixed(2)
    return {
      itemType:      item.itemType,
      description:   item.description,
      quantity:      item.quantity ?? null,
      unitPrice:     item.unitPrice ?? null,
      discountType:  item.discountType ?? null,
      discountValue: item.discountValue ?? null,
      vatRate:       item.vatRate,
      lineTotal,
      sortOrder:     i,
    }
  }))

  revalidatePath(`/invoices/${id}`)
  revalidatePath("/invoices")
}

export async function deleteInvoiceAction(id: string) {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("Unauthorized")

  await applyStrictRateLimit(clerkId)

  const user = await getDbUser(clerkId)
  if (!user) throw new Error("User not found")

  await softDeleteInvoice(id, user.id)
  revalidatePath("/invoices")
  redirect("/invoices")
}

export async function sendInvoiceAction(id: string) {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("Unauthorized")

  await applyRateLimit(clerkId)

  const user = await getDbUser(clerkId)
  if (!user) throw new Error("User not found")

  const invoice = await getInvoiceById(id, user.id)
  if (!invoice) throw new Error("Invoice not found")
  if (!invoice.customer.email) throw new Error("Customer has no email address")

  const { generateInvoicePdfBuffer } = await import("@/lib/pdf/generate-invoice")
  const { formatDKK } = await import("@/lib/utils/currency")

  const pdfBuffer = await generateInvoicePdfBuffer({
    invoiceNumber:   invoice.invoiceNumber,
    issueDate:       invoice.issueDate,
    dueDate:         invoice.dueDate,
    companyName:     user.companyName ?? user.email ?? "",
    companyAddress:  user.addressLine1 ?? "",
    companyCity:     `${user.addressZip ?? ""} ${user.addressCity ?? ""}`.trim(),
    companyCvr:      user.cvrNumber ?? "",
    companyLogoUrl:  user.logoUrl ?? undefined,
    customerName:    invoice.customer.name,
    customerAddress: invoice.customer.addressLine1 ?? "",
    customerCity:    `${invoice.customer.addressZip ?? ""} ${invoice.customer.addressCity ?? ""}`.trim(),
    customerEan:     invoice.customer.eanNumber ?? undefined,
    lineItems: invoice.items.map(item => ({
      description: item.description,
      quantity:    parseFloat(item.quantity ?? "1"),
      unitPrice:   parseFloat(item.unitPrice ?? "0"),
    })),
    notes:           invoice.notes ?? undefined,
    bankAccount:     invoice.bankAccount ?? undefined,
    mobilepayNumber: invoice.mobilepayNumber ?? undefined,
  })

  const { resend, EMAIL_FROM } = await import("@/lib/email/client")
  const { InvoiceSentEmail } = await import("@/lib/email/templates/invoice-sent")

  const { data, error } = await resend.emails.send({
    from:    EMAIL_FROM,
    to:      [invoice.customer.email],
    subject: `Faktura ${invoice.invoiceNumber}`,
    react:   InvoiceSentEmail({
      customerName:   invoice.customer.name,
      invoiceNumber:  invoice.invoiceNumber,
      amountDKK:      formatDKK(parseFloat(invoice.totalInclVat ?? "0")),
      dueDate:        invoice.dueDate,
    }),
    attachments: [{
      filename: `faktura-${invoice.invoiceNumber}.pdf`,
      content:  pdfBuffer,
    }],
  })

  if (error) throw new Error(`Email failed: ${error.message}`)

  await updateInvoice(id, user.id, { status: "sent", sentAt: new Date() })

  // Trigger Inngest reminder workflow
  try {
    const { inngest } = await import("@/lib/inngest/client")
    await inngest.send({
      name: "invoice/sent",
      data: {
        invoiceId:     invoice.id,
        userId:        user.id,
        customerEmail: invoice.customer.email,
        dueDate:       invoice.dueDate,
        amount:        invoice.totalInclVat ?? "0",
      },
    })
  } catch {
    // Non-fatal: reminder scheduling failure doesn't block sending
  }

  revalidatePath(`/invoices/${id}`)
  revalidatePath("/invoices")
  return { emailId: data?.id }
}

export async function markInvoicePaidAction(id: string) {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("Unauthorized")

  await applyRateLimit(clerkId)

  const user = await getDbUser(clerkId)
  if (!user) throw new Error("User not found")

  const invoice = await getInvoiceById(id, user.id)

  await updateInvoice(id, user.id, {
    status: "paid",
    paidAt: new Date(),
  })

  // Cancel pending reminders
  try {
    const { inngest } = await import("@/lib/inngest/client")
    await inngest.send({ name: "invoice/paid", data: { invoiceId: id } })
  } catch {
    // Non-fatal
  }

  // Send thank-you + review request email to customer (non-blocking)
  if (invoice?.customer.email) {
    try {
      const { resend, EMAIL_FROM } = await import("@/lib/email/client")
      const { InvoicePaidThankyouEmail } = await import("@/lib/email/templates/invoice-paid-thankyou")
      await resend.emails.send({
        from: EMAIL_FROM,
        to: [invoice.customer.email],
        subject: `Tak for betalingen af faktura ${invoice.invoiceNumber}`,
        react: InvoicePaidThankyouEmail({
          customerName:    invoice.customer.name,
          invoiceNumber:   invoice.invoiceNumber,
          companyName:     user.companyName ?? "",
          googleReviewUrl: user.googleReviewUrl ?? undefined,
        }),
      })
    } catch {
      // Non-fatal
    }
  }

  revalidatePath(`/invoices/${id}`)
  revalidatePath("/invoices")
}

export async function createCreditNoteAction(originalInvoiceId: string) {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("Unauthorized")

  await applyStrictRateLimit(clerkId)

  const user = await getDbUser(clerkId)
  if (!user) throw new Error("User not found")

  const original = await getInvoiceById(originalInvoiceId, user.id)
  if (!original) throw new Error("Invoice not found")

  const total = await countAllInvoicesEver(user.id)
  const invoiceNumber = `KRE-${String(total + 1).padStart(4, "0")}`
  const issueDate = new Date().toISOString().split("T")[0]
  const dueDate = makeDueDate(14)

  // Negate all amounts
  const subtotalExVat = -(parseFloat(original.subtotalExVat ?? "0"))
  const vatAmount     = -(parseFloat(original.vatAmount ?? "0"))
  const totalInclVat  = -(parseFloat(original.totalInclVat ?? "0"))

  const creditNote = await createInvoice({
    userId:             user.id,
    customerId:         original.customerId,
    jobId:              original.jobId ?? null,
    quoteId:            original.quoteId ?? null,
    invoiceNumber,
    status:             "draft",
    isCreditNote:       true,
    originalInvoiceId:  original.id,
    issueDate,
    dueDate,
    paymentTermsDays:   14,
    subtotalExVat:      subtotalExVat.toFixed(2),
    vatAmount:          vatAmount.toFixed(2),
    totalInclVat:       totalInclVat.toFixed(2),
    bankAccount:        original.bankAccount ?? null,
    mobilepayNumber:    original.mobilepayNumber ?? null,
    notes:              `Kreditnota for ${original.invoiceNumber}`,
    eanNumber:          original.eanNumber ?? null,
  })

  await replaceInvoiceItems(creditNote.id, original.items.map((item, i) => ({
    itemType:    item.itemType,
    description: item.description,
    quantity:    item.quantity ?? null,
    unitPrice:   item.unitPrice ? (-parseFloat(item.unitPrice)).toFixed(2) : null,
    vatRate:     item.vatRate ?? "25.00",
    lineTotal:   item.lineTotal ? (-parseFloat(item.lineTotal)).toFixed(2) : null,
    sortOrder:   i,
  })))

  revalidatePath("/invoices")
  redirect(`/invoices/${creditNote.id}`)
}

export async function markOverdueAction() {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("Unauthorized")

  const user = await getDbUser(clerkId)
  if (!user) throw new Error("User not found")

  await markOverdueInvoices(user.id)
  revalidatePath("/invoices")
}

export async function mergeInvoicesAction(ids: string[]): Promise<{ id: string }> {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("Unauthorized")

  await applyStrictRateLimit(clerkId)

  if (ids.length < 2) throw new Error("Select at least 2 invoices to merge")

  const user = await getDbUser(clerkId)
  if (!user) throw new Error("User not found")

  const rows = await db.query.invoices.findMany({
    where: (inv, { and, inArray, isNull, eq }) =>
      and(inArray(inv.id, ids), eq(inv.userId, user.id), isNull(inv.deletedAt)),
    with: { items: true, customer: true },
  })

  if (rows.length !== ids.length) throw new Error("One or more invoices not found")

  const uniqueCustomers = [...new Set(rows.map(inv => inv.customerId))]
  if (uniqueCustomers.length > 1) throw new Error("All invoices must be for the same customer")

  const total = await countAllInvoicesEver(user.id)
  const invoiceNumber = makeInvoiceNumber(total)
  const issueDate = new Date().toISOString().split("T")[0]
  const dueDate = makeDueDate(14)

  // Combine all items from all invoices
  const allItems = rows.flatMap(inv => inv.items)
  allItems.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))

  // Build line item array compatible with calcTotals
  const itemsForCalc = allItems.map(item => ({
    itemType:      item.itemType as "labour" | "material" | "fixed" | "travel",
    description:   item.description,
    quantity:      item.quantity ?? undefined,
    unitPrice:     item.unitPrice ?? undefined,
    discountType:  (item.discountType ?? undefined) as "percent" | "fixed" | undefined,
    discountValue: item.discountValue ?? undefined,
    vatRate:       item.vatRate ?? "25.00",
    lineTotal:     item.lineTotal ?? undefined,
    sortOrder:     item.sortOrder ?? 0,
  }))

  const totals = calcTotals(itemsForCalc)

  // Pick bank info from first invoice that has it
  const bankAccount = rows.find(inv => inv.bankAccount)?.bankAccount ?? null
  const mobilepayNumber = rows.find(inv => inv.mobilepayNumber)?.mobilepayNumber ?? null

  // Merge notes
  const allNotes = rows.map(inv => inv.notes).filter((n): n is string => !!n?.trim())
  const uniqueNotes = [...new Set(allNotes)]
  const mergedNotes = uniqueNotes.join("\n---\n") || null

  const newInvoice = await createInvoice({
    userId:           user.id,
    customerId:       rows[0].customerId,
    invoiceNumber,
    status:           "draft",
    issueDate,
    dueDate,
    paymentTermsDays: 14,
    subtotalExVat:    totals.subtotalExVat,
    vatAmount:        totals.vatAmount,
    totalInclVat:     totals.totalInclVat,
    discountAmount:   totals.discountAmount,
    bankAccount,
    mobilepayNumber,
    notes:            mergedNotes,
    eanNumber:        null,
  })

  await replaceInvoiceItems(newInvoice.id, allItems.map((item, i) => ({
    itemType:      item.itemType,
    description:   item.description,
    quantity:      item.quantity ?? null,
    unitPrice:     item.unitPrice ?? null,
    discountType:  item.discountType ?? null,
    discountValue: item.discountValue ?? null,
    vatRate:       item.vatRate ?? "25.00",
    lineTotal:     item.lineTotal ?? null,
    sortOrder:     i,
  })))

  // Mark originals as merged
  await db.update(invoices)
    .set({ status: "merged", mergedInto: newInvoice.id, updatedAt: new Date() })
    .where(inArray(invoices.id, ids))

  revalidatePath("/invoices")
  return { id: newInvoice.id }
}
