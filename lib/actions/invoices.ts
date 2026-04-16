"use server"

import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
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
  markOverdueInvoices,
} from "@/lib/db/queries/invoices"
import { getJobById } from "@/lib/db/queries/jobs"
import { getQuoteById } from "@/lib/db/queries/quotes"

const lineItemSchema = z.object({
  itemType:    z.enum(["labour", "material", "fixed", "travel"]),
  description: z.string().min(1),
  quantity:    z.string().optional(),
  unitPrice:   z.string().optional(),
  vatRate:     z.string().default("25.00"),
  lineTotal:   z.string().optional(),
  sortOrder:   z.number().default(0),
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

function calcTotals(items: z.infer<typeof lineItemSchema>[]) {
  let subtotalExVat = 0
  let vatAmount = 0

  for (const item of items) {
    const qty = parseFloat(item.quantity ?? "1")
    const price = parseFloat(item.unitPrice ?? "0")
    const markup = parseFloat(item.vatRate ?? "25") // vatRate field
    const lineEx = qty * price
    subtotalExVat += lineEx
    vatAmount += lineEx * (parseFloat(item.vatRate ?? "25") / 100)
  }

  return {
    subtotalExVat: subtotalExVat.toFixed(2),
    vatAmount: vatAmount.toFixed(2),
    totalInclVat: (subtotalExVat + vatAmount).toFixed(2),
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
    bankAccount:      validated.bankAccount ?? null,
    mobilepayNumber:  validated.mobilepayNumber ?? null,
    notes:            validated.notes ?? null,
    // Copy EAN from customer if available — fetched via relation in UI
    eanNumber:        null,
  })

  await replaceInvoiceItems(invoice.id, validated.items.map((item, i) => {
    const qty = parseFloat(item.quantity ?? "1")
    const price = parseFloat(item.unitPrice ?? "0")
    const lineTotal = (qty * price).toFixed(2)
    return {
      itemType:    item.itemType,
      description: item.description,
      quantity:    item.quantity ?? null,
      unitPrice:   item.unitPrice ?? null,
      vatRate:     item.vatRate,
      lineTotal,
      sortOrder:   i,
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

  const total = await countAllInvoicesEver(user.id)
  const invoiceNumber = makeInvoiceNumber(total)
  const issueDate = new Date().toISOString().split("T")[0]
  const dueDate = makeDueDate(14)

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
    bankAccount:      null,
    mobilepayNumber:  null,
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
export async function createInvoiceFromQuoteAction(quoteId: string) {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("Unauthorized")

  await applyRateLimit(clerkId)

  const user = await getDbUser(clerkId)
  if (!user) throw new Error("User not found")

  const quote = await getQuoteById(quoteId, user.id)
  if (!quote) throw new Error("Quote not found")

  const total = await countAllInvoicesEver(user.id)
  const invoiceNumber = makeInvoiceNumber(total)
  const issueDate = new Date().toISOString().split("T")[0]
  const dueDate = makeDueDate(14)

  // Calculate totals from quote items
  const subtotalExVat = quote.items.reduce((sum, item) => {
    const qty = parseFloat(item.quantity ?? "1")
    const price = parseFloat(item.unitPrice ?? "0")
    const markup = 1 + parseFloat(item.markupPercent ?? "0") / 100
    return sum + qty * price * markup
  }, 0)
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
    bankAccount:      null,
    mobilepayNumber:  null,
    notes:            quote.notes ?? null,
    eanNumber:        quote.customer.eanNumber ?? null,
  })

  // Map quote items to invoice items
  await replaceInvoiceItems(invoice.id, quote.items.map((item, i) => {
    const qty = parseFloat(item.quantity ?? "1")
    const price = parseFloat(item.unitPrice ?? "0")
    const markup = 1 + parseFloat(item.markupPercent ?? "0") / 100
    const lineTotal = (qty * price * markup).toFixed(2)
    return {
      itemType:    item.itemType,
      description: item.description,
      quantity:    item.quantity ?? null,
      unitPrice:   item.unitPrice ?? null,
      vatRate:     item.vatRate ?? "25.00",
      lineTotal,
      sortOrder:   i,
    }
  }))

  revalidatePath("/invoices")
  redirect(`/invoices/${invoice.id}`)
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
    bankAccount:      validated.bankAccount ?? null,
    mobilepayNumber:  validated.mobilepayNumber ?? null,
    notes:            validated.notes ?? null,
  })

  await replaceInvoiceItems(id, validated.items.map((item, i) => {
    const qty = parseFloat(item.quantity ?? "1")
    const price = parseFloat(item.unitPrice ?? "0")
    const lineTotal = (qty * price).toFixed(2)
    return {
      itemType:    item.itemType,
      description: item.description,
      quantity:    item.quantity ?? null,
      unitPrice:   item.unitPrice ?? null,
      vatRate:     item.vatRate,
      lineTotal,
      sortOrder:   i,
    }
  }))

  revalidatePath(`/invoices/${id}`)
  revalidatePath("/invoices")
}

export async function deleteInvoiceAction(id: string) {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("Unauthorized")

  await applyRateLimit(clerkId)

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

  const { resend } = await import("@/lib/email/client")
  const { InvoiceSentEmail } = await import("@/lib/email/templates/invoice-sent")

  const { data, error } = await resend.emails.send({
    from:    "Håndværk Pro <noreply@haandvaerkpro.dk>",
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

  revalidatePath(`/invoices/${id}`)
  revalidatePath("/invoices")
}

export async function createCreditNoteAction(originalInvoiceId: string) {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("Unauthorized")

  await applyRateLimit(clerkId)

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
