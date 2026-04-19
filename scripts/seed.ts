/**
 * Comprehensive test seed — covers every workflow status in the app.
 * Run: npx tsx --env-file=.env.local scripts/seed.ts
 *
 * Seeds data for the first user found in the DB (i.e. you, after signing in once).
 */

import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import * as schema from "../lib/db/schema"
import { eq } from "drizzle-orm"

const {
  users,
  customers,
  jobs,
  quotes,
  quoteItems,
  invoices,
  invoiceItems,
  bankAccounts,
  quoteTemplates,
  materialsCatalog,
} = schema

function daysFromNow(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

async function seed() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error("DATABASE_URL is not set")

  const sql = neon(url)
  const db = drizzle(sql, { schema })

  // ── 1. Find the test user ──────────────────────────────────────────────────
  const [user] = await db.select().from(users).limit(1)
  if (!user) {
    console.error("No user found. Sign in to the app once first, then re-run.")
    process.exit(1)
  }
  const uid = user.id
  console.log(`Seeding for user: ${user.email ?? user.clerkId} (${uid})`)

  // ── 2. Bank accounts ──────────────────────────────────────────────────────
  const [bankAcc] = await db
    .insert(bankAccounts)
    .values([
      {
        userId: uid,
        bankName: "National Bank",
        regNumber: "0400",
        accountNumber: "3064561234",
        isDefault: true,
      },
      {
        userId: uid,
        bankName: "Metro Bank",
        regNumber: "2109",
        accountNumber: "5987654321",
        isDefault: false,
      },
    ])
    .returning()
  console.log("✓ bank accounts")

  // ── 3. Customers ──────────────────────────────────────────────────────────
  const customerRows = await db
    .insert(customers)
    .values([
      // private customer, favorite
      {
        userId: uid,
        name: "Lars Anderson",
        phone: "+1 555 011 2233",
        email: "lars.anderson@gmail.com",
        addressLine1: "12 Elm Street",
        addressCity: "Springfield",
        addressZip: "62701",
        notes: "Prefers calls in the morning.",
        isFavorite: true,
      },
      // business customer with CVR
      {
        userId: uid,
        name: "Jorgensen & Sons Ltd.",
        phone: "+1 555 344 5566",
        email: "info@jorgensen-sons.com",
        addressLine1: "8 Industrial Avenue",
        addressCity: "Riverside",
        addressZip: "92501",
        cvrNumber: "28563412",
        isFavorite: false,
      },
      // customer with EAN (NemHandel)
      {
        userId: uid,
        name: "City Council — Engineering",
        phone: "+1 555 637 5000",
        email: "engineering@city.gov",
        addressLine1: "36 North Street",
        addressCity: "Capital City",
        addressZip: "10001",
        cvrNumber: "35209115",
        eanNumber: "5790000211327",
      },
      // recurring small jobs customer
      {
        userId: uid,
        name: "Mette Holst",
        phone: "+1 555 506 6778",
        email: "mette.holst@hotmail.com",
        addressLine1: "4 Rose Garden Lane",
        addressCity: "Greenville",
        addressZip: "29601",
        isFavorite: true,
      },
      // customer whose invoice is overdue (owes money)
      {
        userId: uid,
        name: "Soren Holm Construction",
        phone: "+1 555 720 3040",
        email: "sh@holm-construction.com",
        addressLine1: "55 Harbor Road",
        addressCity: "Port City",
        addressZip: "77001",
        cvrNumber: "31204567",
      },
      // new customer, no email
      {
        userId: uid,
        name: "Thomas Kjaer",
        phone: "+1 555 421 1990",
        addressLine1: "7 Forest Edge Drive",
        addressCity: "Lakeside",
        addressZip: "86001",
      },
      // soft-deleted customer
      {
        userId: uid,
        name: "Old Client Ltd.",
        phone: "+1 555 998 8776",
        email: "old@example.com",
        deletedAt: new Date(),
      },
      // customer with no contact details
      {
        userId: uid,
        name: "Anonymous Client",
      },
    ])
    .returning()
  console.log("✓ customers")

  const [cLars, cJoerg, cCity, cMette, cSoren, cThomas, , cAnon] = customerRows

  // ── 4. Materials catalog ──────────────────────────────────────────────────
  await db.insert(materialsCatalog).values([
    {
      userId: uid,
      name: "Copper pipe 15mm (per m)",
      defaultUnit: "m",
      defaultPrice: "45.00",
      defaultMarkup: "20",
    },
    {
      userId: uid,
      name: "Ball valve 1/2\"",
      defaultUnit: "pcs",
      defaultPrice: "125.00",
      defaultMarkup: "25",
    },
    {
      userId: uid,
      name: "Expanding foam 750ml",
      defaultUnit: "can",
      defaultPrice: "89.00",
      defaultMarkup: "15",
    },
  ])
  console.log("✓ materials catalog")

  // ── 5. Quote template ─────────────────────────────────────────────────────
  await db.insert(quoteTemplates).values([
    {
      userId: uid,
      name: "Standard Plumbing Inspection",
      items: [
        {
          itemType: "labour",
          description: "Inspection time",
          quantity: 1,
          unitPrice: 795,
          vatRate: 25,
        },
        {
          itemType: "fixed",
          description: "Call-out fee",
          quantity: 1,
          unitPrice: 250,
          vatRate: 25,
        },
      ],
    },
  ])
  console.log("✓ quote templates")

  // ── 6. Jobs — one per status ──────────────────────────────────────────────

  const [jNew] = await db
    .insert(jobs)
    .values({
      userId: uid,
      customerId: cThomas.id,
      jobNumber: "JOB-0001",
      title: "Kitchen tap replacement",
      description: "Customer wants a new mixer tap installed.",
      jobType: "service",
      status: "new",
    })
    .returning()

  const [jScheduled] = await db
    .insert(jobs)
    .values({
      userId: uid,
      customerId: cLars.id,
      jobNumber: "JOB-0002",
      title: "Thermostat replacement — all radiator valves",
      jobType: "service",
      status: "scheduled",
      scheduledDate: daysFromNow(3),
      notes: "Key left in the mailbox.",
    })
    .returning()

  const [jInProgress] = await db
    .insert(jobs)
    .values({
      userId: uid,
      customerId: cMette.id,
      jobNumber: "JOB-0003",
      title: "Bathroom renovation",
      jobType: "project",
      status: "in_progress",
      scheduledDate: daysFromNow(-5),
      endDate: daysFromNow(10),
      notes: "Tiles arrive Wednesday.",
    })
    .returning()

  const [jDone] = await db
    .insert(jobs)
    .values({
      userId: uid,
      customerId: cJoerg.id,
      jobNumber: "JOB-0004",
      title: "Industrial pipe installation — warehouse",
      jobType: "project",
      status: "done",
      scheduledDate: daysFromNow(-20),
      completedDate: daysFromNow(-2),
    })
    .returning()

  const [jInvoiced] = await db
    .insert(jobs)
    .values({
      userId: uid,
      customerId: cSoren.id,
      jobNumber: "JOB-0005",
      title: "Drain cleaning — commercial building",
      jobType: "service",
      status: "invoiced",
      scheduledDate: daysFromNow(-30),
      completedDate: daysFromNow(-28),
    })
    .returning()

  const [jPaid] = await db
    .insert(jobs)
    .values({
      userId: uid,
      customerId: cLars.id,
      jobNumber: "JOB-0006",
      title: "Heat pump service",
      jobType: "recurring",
      status: "paid",
      scheduledDate: daysFromNow(-60),
      completedDate: daysFromNow(-58),
    })
    .returning()

  const [jAnon] = await db
    .insert(jobs)
    .values({
      userId: uid,
      customerId: cAnon.id,
      jobNumber: "JOB-0007",
      title: "Emergency water damage — basement",
      jobType: "service",
      status: "in_progress",
      scheduledDate: daysFromNow(-1),
    })
    .returning()

  const [jCity] = await db
    .insert(jobs)
    .values({
      userId: uid,
      customerId: cCity.id,
      jobNumber: "JOB-0008",
      title: "Municipal ventilation inspection",
      jobType: "recurring",
      status: "scheduled",
      scheduledDate: daysFromNow(7),
      endDate: daysFromNow(7),
    })
    .returning()

  console.log("✓ jobs")

  // ── 7. Quotes ─────────────────────────────────────────────────────────────

  // status: draft
  const [qDraft] = await db
    .insert(quotes)
    .values({
      userId: uid,
      jobId: jNew.id,
      customerId: cThomas.id,
      quoteNumber: "QUO-0001",
      status: "draft",
      validUntil: daysFromNow(30),
      notes: "Price includes materials and labour.",
    })
    .returning()
  await db.insert(quoteItems).values([
    {
      quoteId: qDraft.id,
      itemType: "labour",
      description: "Mixer tap installation",
      quantity: "1.5",
      unitPrice: "650.00",
      vatRate: "25.00",
      sortOrder: 0,
    },
    {
      quoteId: qDraft.id,
      itemType: "material",
      description: "Grohe Eurosmart mixer tap",
      quantity: "1",
      unitPrice: "895.00",
      markupPercent: "15",
      vatRate: "25.00",
      sortOrder: 1,
    },
  ])

  // status: sent
  const [qSent] = await db
    .insert(quotes)
    .values({
      userId: uid,
      jobId: jScheduled.id,
      customerId: cLars.id,
      quoteNumber: "QUO-0002",
      status: "sent",
      validUntil: daysFromNow(14),
      sentAt: new Date(Date.now() - 2 * 86400_000),
      shareToken: "tok_sent_lars_thermostat",
      notes: "Quote valid for 14 days.",
    })
    .returning()
  await db.insert(quoteItems).values([
    {
      quoteId: qSent.id,
      itemType: "labour",
      description: "Thermostat valve replacement (8 units)",
      quantity: "3",
      unitPrice: "650.00",
      vatRate: "25.00",
      sortOrder: 0,
    },
    {
      quoteId: qSent.id,
      itemType: "material",
      description: "Danfoss RA-N thermostat valve",
      quantity: "8",
      unitPrice: "189.00",
      markupPercent: "20",
      vatRate: "25.00",
      sortOrder: 1,
    },
    {
      quoteId: qSent.id,
      itemType: "travel",
      description: "Travel",
      quantity: "1",
      unitPrice: "250.00",
      vatRate: "25.00",
      sortOrder: 2,
    },
  ])

  // status: accepted
  const [qAccepted] = await db
    .insert(quotes)
    .values({
      userId: uid,
      jobId: jInProgress.id,
      customerId: cMette.id,
      quoteNumber: "QUO-0003",
      status: "accepted",
      validUntil: daysFromNow(-5),
      sentAt: new Date(Date.now() - 10 * 86400_000),
      acceptedAt: new Date(Date.now() - 7 * 86400_000),
      shareToken: "tok_accepted_mette_bathroom",
      discountType: "percent",
      discountValue: "5.00",
      notes: "5% discount agreed for cash payment.",
    })
    .returning()
  await db.insert(quoteItems).values([
    {
      quoteId: qAccepted.id,
      itemType: "labour",
      description: "Demolition and preparation",
      quantity: "8",
      unitPrice: "650.00",
      vatRate: "25.00",
      sortOrder: 0,
    },
    {
      quoteId: qAccepted.id,
      itemType: "material",
      description: "White tiles 30x60 (sqm)",
      quantity: "12",
      unitPrice: "285.00",
      markupPercent: "18",
      vatRate: "25.00",
      sortOrder: 1,
    },
    {
      quoteId: qAccepted.id,
      itemType: "material",
      description: "Complete shower set",
      quantity: "1",
      unitPrice: "3200.00",
      markupPercent: "20",
      vatRate: "25.00",
      sortOrder: 2,
    },
    {
      quoteId: qAccepted.id,
      itemType: "fixed",
      description: "Waste disposal fee",
      quantity: "1",
      unitPrice: "450.00",
      vatRate: "25.00",
      sortOrder: 3,
    },
  ])

  // status: rejected
  const [qRejected] = await db
    .insert(quotes)
    .values({
      userId: uid,
      customerId: cJoerg.id,
      quoteNumber: "QUO-0004",
      status: "rejected",
      validUntil: daysFromNow(-10),
      sentAt: new Date(Date.now() - 20 * 86400_000),
      rejectedAt: new Date(Date.now() - 14 * 86400_000),
      shareToken: "tok_rejected_joerg",
      internalNotes: "Too expensive per customer — competitor won the job.",
    })
    .returning()
  await db.insert(quoteItems).values([
    {
      quoteId: qRejected.id,
      itemType: "labour",
      description: "Pipe installation warehouse (estimated)",
      quantity: "40",
      unitPrice: "650.00",
      vatRate: "25.00",
      sortOrder: 0,
    },
    {
      quoteId: qRejected.id,
      itemType: "material",
      description: "Galvanised pipe 2\" (per m)",
      quantity: "80",
      unitPrice: "220.00",
      markupPercent: "22",
      vatRate: "25.00",
      sortOrder: 1,
    },
  ])

  // status: expired
  const [qExpired] = await db
    .insert(quotes)
    .values({
      userId: uid,
      customerId: cSoren.id,
      quoteNumber: "QUO-0005",
      status: "expired",
      validUntil: daysFromNow(-45),
      sentAt: new Date(Date.now() - 60 * 86400_000),
      shareToken: "tok_expired_soren",
    })
    .returning()
  await db.insert(quoteItems).values([
    {
      quoteId: qExpired.id,
      itemType: "labour",
      description: "Drain inspection",
      quantity: "2",
      unitPrice: "650.00",
      vatRate: "25.00",
      sortOrder: 0,
    },
  ])

  // status: merged — two quotes merged into one
  const [qMergeA] = await db
    .insert(quotes)
    .values({
      userId: uid,
      customerId: cCity.id,
      quoteNumber: "QUO-0006",
      status: "merged",
      validUntil: daysFromNow(30),
      sentAt: new Date(Date.now() - 5 * 86400_000),
      internalNotes: "Merged into QUO-0007.",
    })
    .returning()
  await db.insert(quoteItems).values([
    {
      quoteId: qMergeA.id,
      itemType: "labour",
      description: "Ventilation inspection zone A",
      quantity: "4",
      unitPrice: "650.00",
      vatRate: "25.00",
      sortOrder: 0,
    },
  ])

  const [qMergeB] = await db
    .insert(quotes)
    .values({
      userId: uid,
      customerId: cCity.id,
      jobId: jCity.id,
      quoteNumber: "QUO-0007",
      status: "sent",
      validUntil: daysFromNow(30),
      sentAt: new Date(Date.now() - 5 * 86400_000),
      shareToken: "tok_merged_city",
      notes: "Combined quote for ventilation + pipework.",
    })
    .returning()
  await db.insert(quoteItems).values([
    {
      quoteId: qMergeB.id,
      itemType: "labour",
      description: "Ventilation inspection zone A",
      quantity: "4",
      unitPrice: "650.00",
      vatRate: "25.00",
      sortOrder: 0,
    },
    {
      quoteId: qMergeB.id,
      itemType: "labour",
      description: "Ventilation inspection zone B",
      quantity: "4",
      unitPrice: "650.00",
      vatRate: "25.00",
      sortOrder: 1,
    },
    {
      quoteId: qMergeB.id,
      itemType: "material",
      description: "HEPA filter set (2 units)",
      quantity: "2",
      unitPrice: "640.00",
      markupPercent: "20",
      vatRate: "25.00",
      sortOrder: 2,
    },
  ])

  await db
    .update(quotes)
    .set({ mergedInto: qMergeB.id })
    .where(eq(quotes.id, qMergeA.id))

  console.log("✓ quotes")

  // ── 8. Invoices ───────────────────────────────────────────────────────────

  // status: draft
  const [invDraft] = await db
    .insert(invoices)
    .values({
      userId: uid,
      jobId: jDone.id,
      customerId: cJoerg.id,
      invoiceNumber: "INV-0001",
      status: "draft",
      issueDate: daysFromNow(0),
      dueDate: daysFromNow(14),
      paymentTermsDays: 14,
      subtotalExVat: "26000.00",
      vatAmount: "6500.00",
      totalInclVat: "32500.00",
      bankAccount: `${bankAcc.regNumber}-${bankAcc.accountNumber}`,
      notes: "Please make payment before the due date.",
    })
    .returning()
  await db.insert(invoiceItems).values([
    {
      invoiceId: invDraft.id,
      itemType: "labour",
      description: "Pipe installation — warehouse",
      quantity: "40",
      unitPrice: "650.00",
      vatRate: "25.00",
      lineTotal: "26000.00",
      sortOrder: 0,
    },
  ])

  // status: sent
  const [invSent] = await db
    .insert(invoices)
    .values({
      userId: uid,
      jobId: jInvoiced.id,
      customerId: cSoren.id,
      invoiceNumber: "INV-0002",
      status: "sent",
      issueDate: daysFromNow(-3),
      dueDate: daysFromNow(11),
      paymentTermsDays: 14,
      sentAt: new Date(Date.now() - 3 * 86400_000),
      subtotalExVat: "1300.00",
      vatAmount: "325.00",
      totalInclVat: "1625.00",
      bankAccount: `${bankAcc.regNumber}-${bankAcc.accountNumber}`,
    })
    .returning()
  await db.insert(invoiceItems).values([
    {
      invoiceId: invSent.id,
      itemType: "labour",
      description: "Drain cleaning",
      quantity: "2",
      unitPrice: "650.00",
      vatRate: "25.00",
      lineTotal: "1300.00",
      sortOrder: 0,
    },
  ])

  // status: viewed
  const [invViewed] = await db
    .insert(invoices)
    .values({
      userId: uid,
      customerId: cMette.id,
      invoiceNumber: "INV-0003",
      status: "viewed",
      issueDate: daysFromNow(-7),
      dueDate: daysFromNow(7),
      paymentTermsDays: 14,
      sentAt: new Date(Date.now() - 7 * 86400_000),
      viewedAt: new Date(Date.now() - 5 * 86400_000),
      subtotalExVat: "4800.00",
      vatAmount: "1200.00",
      totalInclVat: "6000.00",
      bankAccount: `${bankAcc.regNumber}-${bankAcc.accountNumber}`,
    })
    .returning()
  await db.insert(invoiceItems).values([
    {
      invoiceId: invViewed.id,
      itemType: "labour",
      description: "Phase 1: demolition and preparation",
      quantity: "8",
      unitPrice: "600.00",
      vatRate: "25.00",
      lineTotal: "4800.00",
      sortOrder: 0,
    },
  ])

  // status: paid
  const [invPaid] = await db
    .insert(invoices)
    .values({
      userId: uid,
      jobId: jPaid.id,
      customerId: cLars.id,
      invoiceNumber: "INV-0004",
      status: "paid",
      issueDate: daysFromNow(-60),
      dueDate: daysFromNow(-46),
      paymentTermsDays: 14,
      sentAt: new Date(Date.now() - 60 * 86400_000),
      viewedAt: new Date(Date.now() - 59 * 86400_000),
      paidAt: new Date(Date.now() - 50 * 86400_000),
      subtotalExVat: "3900.00",
      vatAmount: "975.00",
      totalInclVat: "4875.00",
      bankAccount: `${bankAcc.regNumber}-${bankAcc.accountNumber}`,
    })
    .returning()
  await db.insert(invoiceItems).values([
    {
      invoiceId: invPaid.id,
      itemType: "labour",
      description: "Heat pump service + filter",
      quantity: "3",
      unitPrice: "850.00",
      vatRate: "25.00",
      lineTotal: "2550.00",
      sortOrder: 0,
    },
    {
      invoiceId: invPaid.id,
      itemType: "material",
      description: "Refrigerant R410A (kg)",
      quantity: "1.5",
      unitPrice: "900.00",
      vatRate: "25.00",
      lineTotal: "1350.00",
      sortOrder: 1,
    },
  ])

  // status: overdue
  const [invOverdue] = await db
    .insert(invoices)
    .values({
      userId: uid,
      jobId: jInvoiced.id,
      customerId: cSoren.id,
      invoiceNumber: "INV-0005",
      status: "overdue",
      issueDate: daysFromNow(-45),
      dueDate: daysFromNow(-31),
      paymentTermsDays: 14,
      sentAt: new Date(Date.now() - 45 * 86400_000),
      viewedAt: new Date(Date.now() - 44 * 86400_000),
      reminder1SentAt: new Date(Date.now() - 23 * 86400_000),
      reminder2SentAt: new Date(Date.now() - 16 * 86400_000),
      subtotalExVat: "18400.00",
      vatAmount: "4600.00",
      totalInclVat: "23000.00",
      bankAccount: `${bankAcc.regNumber}-${bankAcc.accountNumber}`,
      notes: "Payment reminders sent 8 and 15 days after due date.",
    })
    .returning()
  await db.insert(invoiceItems).values([
    {
      invoiceId: invOverdue.id,
      itemType: "labour",
      description: "Drain cleaning — large installation",
      quantity: "16",
      unitPrice: "650.00",
      vatRate: "25.00",
      lineTotal: "10400.00",
      sortOrder: 0,
    },
    {
      invoiceId: invOverdue.id,
      itemType: "material",
      description: "High-pressure hose 30m",
      quantity: "1",
      unitPrice: "6000.00",
      vatRate: "25.00",
      lineTotal: "6000.00",
      sortOrder: 1,
    },
    {
      invoiceId: invOverdue.id,
      itemType: "travel",
      description: "Travel + parking",
      quantity: "1",
      unitPrice: "2000.00",
      vatRate: "25.00",
      lineTotal: "2000.00",
      sortOrder: 2,
    },
  ])

  // credit note — partial reversal of INV-0005
  const [invCredit] = await db
    .insert(invoices)
    .values({
      userId: uid,
      customerId: cSoren.id,
      invoiceNumber: "CRN-0001",
      status: "paid",
      isCreditNote: true,
      originalInvoiceId: invOverdue.id,
      issueDate: daysFromNow(-10),
      dueDate: daysFromNow(-10),
      sentAt: new Date(Date.now() - 10 * 86400_000),
      paidAt: new Date(Date.now() - 10 * 86400_000),
      subtotalExVat: "-2000.00",
      vatAmount: "-500.00",
      totalInclVat: "-2500.00",
      bankAccount: `${bankAcc.regNumber}-${bankAcc.accountNumber}`,
      notes: "Credit note for travel — incorrect entry.",
    })
    .returning()
  await db.insert(invoiceItems).values([
    {
      invoiceId: invCredit.id,
      itemType: "travel",
      description: "Travel + parking (credited)",
      quantity: "1",
      unitPrice: "-2000.00",
      vatRate: "25.00",
      lineTotal: "-2000.00",
      sortOrder: 0,
    },
  ])

  // merged invoices
  const [invMergeA] = await db
    .insert(invoices)
    .values({
      userId: uid,
      customerId: cCity.id,
      invoiceNumber: "INV-0006",
      status: "merged",
      issueDate: daysFromNow(-2),
      dueDate: daysFromNow(12),
      subtotalExVat: "5200.00",
      vatAmount: "1300.00",
      totalInclVat: "6500.00",
    })
    .returning()

  const [invMergeB] = await db
    .insert(invoices)
    .values({
      userId: uid,
      customerId: cCity.id,
      jobId: jCity.id,
      invoiceNumber: "INV-0007",
      status: "sent",
      issueDate: daysFromNow(-2),
      dueDate: daysFromNow(12),
      sentAt: new Date(Date.now() - 2 * 86400_000),
      subtotalExVat: "10400.00",
      vatAmount: "2600.00",
      totalInclVat: "13000.00",
      bankAccount: `${bankAcc.regNumber}-${bankAcc.accountNumber}`,
      eanNumber: cCity.eanNumber ?? undefined,
      notes: "Combined invoice for ventilation zones A & B.",
    })
    .returning()
  await db.insert(invoiceItems).values([
    {
      invoiceId: invMergeB.id,
      itemType: "labour",
      description: "Ventilation inspection zone A",
      quantity: "4",
      unitPrice: "650.00",
      vatRate: "25.00",
      lineTotal: "2600.00",
      sortOrder: 0,
    },
    {
      invoiceId: invMergeB.id,
      itemType: "labour",
      description: "Ventilation inspection zone B",
      quantity: "4",
      unitPrice: "650.00",
      vatRate: "25.00",
      lineTotal: "2600.00",
      sortOrder: 1,
    },
    {
      invoiceId: invMergeB.id,
      itemType: "material",
      description: "HEPA filter set (2 units)",
      quantity: "2",
      unitPrice: "800.00",
      vatRate: "25.00",
      lineTotal: "1600.00",
      sortOrder: 2,
    },
    {
      invoiceId: invMergeB.id,
      itemType: "material",
      description: "Work van daily hire",
      quantity: "2",
      unitPrice: "800.00",
      vatRate: "25.00",
      lineTotal: "1600.00",
      sortOrder: 3,
    },
    {
      invoiceId: invMergeB.id,
      itemType: "travel",
      description: "Travel",
      quantity: "1",
      unitPrice: "400.00",
      vatRate: "25.00",
      lineTotal: "400.00",
      sortOrder: 4,
    },
  ])

  await db
    .update(invoices)
    .set({ mergedInto: invMergeB.id })
    .where(eq(invoices.id, invMergeA.id))

  // invoice with per-line discounts
  const [invDiscount] = await db
    .insert(invoices)
    .values({
      userId: uid,
      customerId: cLars.id,
      invoiceNumber: "INV-0008",
      status: "sent",
      issueDate: daysFromNow(-1),
      dueDate: daysFromNow(13),
      paymentTermsDays: 14,
      sentAt: new Date(Date.now() - 86400_000),
      subtotalExVat: "5200.00",
      vatAmount: "1300.00",
      totalInclVat: "6500.00",
      discountAmount: "650.00",
      bankAccount: `${bankAcc.regNumber}-${bankAcc.accountNumber}`,
    })
    .returning()
  await db.insert(invoiceItems).values([
    {
      invoiceId: invDiscount.id,
      itemType: "labour",
      description: "Complex pipe installation",
      quantity: "8",
      unitPrice: "750.00",
      discountType: "percent",
      discountValue: "10",
      vatRate: "25.00",
      lineTotal: "5400.00",
      sortOrder: 0,
    },
    {
      invoiceId: invDiscount.id,
      itemType: "fixed",
      description: "Scaffolding hire",
      quantity: "1",
      unitPrice: "1200.00",
      discountType: "fixed",
      discountValue: "200",
      vatRate: "25.00",
      lineTotal: "1000.00",
      sortOrder: 1,
    },
  ])

  console.log("✓ invoices")

  console.log("\n────────────────────────────────────────────")
  console.log("Seed complete. Records inserted:")
  console.log("  Bank accounts : 2")
  console.log("  Customers     : 8  (1 soft-deleted)")
  console.log("  Materials     : 3")
  console.log("  Templates     : 1")
  console.log("  Jobs          : 8  (new / scheduled / in_progress×2 / done / invoiced / paid / scheduled)")
  console.log("  Quotes        : 7  (draft / sent / accepted / rejected / expired / merged×2)")
  console.log("  Invoices      : 9  (draft / sent / viewed / paid / overdue / credit-note / merged×2 / discount)")
  console.log("────────────────────────────────────────────\n")
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
