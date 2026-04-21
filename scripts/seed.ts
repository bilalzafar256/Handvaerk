/**
 * Comprehensive test seed — covers every feature, status, and Inngest workflow.
 *
 * Usage:
 *   npx tsx --env-file=.env scripts/seed.ts
 *
 * ─── Inngest testing guide ───────────────────────────────────────────────────
 *
 * invoice-reminder  (trigger: invoice/sent)
 *   FAK-0002 was just sent today → fire this event to start the reminder chain:
 *     { "invoiceId": "<FAK-0002 id>", "userId": "...", "customerEmail": "thomas.kjaer@...",
 *       "dueDate": "<today+14>", "amount": "2650.00" }
 *   FAK-0005 is mid-chain: reminder_1 was sent 3 days ago, waiting for reminder_2.
 *   FAK-0007 has both reminders sent + is overdue (end state).
 *
 * mark-overdue-invoices  (cron: daily 6am)
 *   FAK-0006 has status=sent and due_date in the past → cron marks it overdue.
 *   Trigger manually from the Inngest dashboard to test instantly.
 *
 * quote-followup-drafts  (cron: daily 7am)
 *   TIL-0003 was sent 10 days ago with no follow_up_draft → cron generates AI draft.
 *   TIL-0004 already has a draft (shows the post-cron state).
 *
 * process-job-recording  (trigger: recording/submitted)
 *   Four ai_recordings cover: pending / processing / ready (with extractedData) / failed.
 *   To test the pipeline end-to-end, fire this event with the pending recording id:
 *     { "recordingId": "<pending id>", "userId": "...",
 *       "blobUrl": "<any audio URL>", "mimeType": "audio/webm" }
 *
 * hard-delete-user  (trigger: user/deleted)
 *   Fires { "userId": "<id>" } → waits 30d then hard-deletes. Test in isolation.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import * as schema from "../lib/db/schema"
import { eq } from "drizzle-orm"

const {
  users, customers, jobs, jobPhotos,
  quotes, quoteItems, quoteTemplates, materialsCatalog,
  invoices, invoiceItems, bankAccounts,
  timeEntries, pricebookItems, aiRecordings, notifications,
} = schema

// ── helpers ───────────────────────────────────────────────────────────────────

function d(offsetDays: number): string {
  const dt = new Date()
  dt.setDate(dt.getDate() + offsetDays)
  return dt.toISOString().slice(0, 10)
}

function dt(offsetDays: number, hour = 8, minute = 0): Date {
  const date = new Date()
  date.setDate(date.getDate() + offsetDays)
  date.setHours(hour, minute, 0, 0)
  return date
}

// ─────────────────────────────────────────────────────────────────────────────

async function seed() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error("DATABASE_URL is not set")

  const sql = neon(url)
  const db = drizzle(sql, { schema })

  const [user] = await db.select().from(users).limit(1)
  if (!user) {
    console.error("No user found — sign in once first, then re-run.")
    process.exit(1)
  }
  const uid = user.id
  console.log(`Seeding for: ${user.email ?? user.clerkId} (${uid})\n`)

  // ── 1. Bank accounts ──────────────────────────────────────────────────────
  const [bank] = await db.insert(bankAccounts).values([
    { userId: uid, bankName: "Danske Bank", regNumber: "3409", accountNumber: "3064561234", isDefault: true },
    { userId: uid, bankName: "Nordea",      regNumber: "2109", accountNumber: "5987654321", isDefault: false },
  ]).returning()
  const bankStr = `Reg. ${bank.regNumber} | Konto ${bank.accountNumber}`
  console.log("✓ bank accounts (2)")

  // ── 2. Pricebook items ────────────────────────────────────────────────────
  await db.insert(pricebookItems).values([
    { userId: uid, name: "On-site labour",           description: "Standard hourly rate, ex. VAT",    unitPrice: "750.00",  itemType: "labour",   isActive: true  },
    { userId: uid, name: "Emergency call-out rate",  description: "Outside normal hours",             unitPrice: "1200.00", itemType: "labour",   isActive: true  },
    { userId: uid, name: "Copper pipe 15mm (per m)", description: "Pre-insulated, press-fit ends",    unitPrice: "45.00",   itemType: "material", isActive: true  },
    { userId: uid, name: "Ball valve ½ inch",        description: "Full-bore lever ball valve",       unitPrice: "125.00",  itemType: "material", isActive: true  },
    { userId: uid, name: "Standard call-out fee",    description: "Fixed fee for site visit",         unitPrice: "450.00",  itemType: "fixed",    isActive: true  },
    { userId: uid, name: "Travel charge (per km)",   description: "Vehicle operating cost",           unitPrice: "8.50",    itemType: "travel",   isActive: true  },
    { userId: uid, name: "Apprentice rate",          description: "Supervised apprentice hourly",     unitPrice: "380.00",  itemType: "labour",   isActive: false }, // disabled
    { userId: uid, name: "Discontinued product X",                                                    unitPrice: "99.00",   itemType: "material", isActive: true, deletedAt: new Date() }, // soft-deleted
  ])
  console.log("✓ pricebook items (8 — 1 disabled, 1 soft-deleted)")

  // ── 3. Materials catalog ──────────────────────────────────────────────────
  await db.insert(materialsCatalog).values([
    { userId: uid, name: "Copper pipe 15mm (per m)", defaultUnit: "m",   defaultPrice: "45.00",  defaultMarkup: "20" },
    { userId: uid, name: "Ball valve ½ inch",        defaultUnit: "pcs", defaultPrice: "125.00", defaultMarkup: "25" },
    { userId: uid, name: "Expanding foam 750ml",     defaultUnit: "can", defaultPrice: "89.00",  defaultMarkup: "15" },
    { userId: uid, name: "Pressure gauge 0-10 bar",  defaultUnit: "pcs", defaultPrice: "195.00", defaultMarkup: "20" },
    { userId: uid, name: "PVC conduit 20mm (per m)", defaultUnit: "m",   defaultPrice: "22.00",  defaultMarkup: "15" },
  ])
  console.log("✓ materials catalog (5)")

  // ── 4. Quote templates ────────────────────────────────────────────────────
  await db.insert(quoteTemplates).values([
    {
      userId: uid,
      name: "Standard Plumbing Inspection",
      items: [
        { itemType: "fixed",  description: "Site call-out fee",     quantity: 1,   unitPrice: 450, vatRate: 25 },
        { itemType: "labour", description: "Inspection (per hour)", quantity: 1.5, unitPrice: 750, vatRate: 25 },
      ],
    },
    {
      userId: uid,
      name: "Boiler Service Package",
      items: [
        { itemType: "fixed",    description: "Boiler service — full check", quantity: 1, unitPrice: 1295, vatRate: 25 },
        { itemType: "material", description: "Boiler filter pack",          quantity: 1, unitPrice: 285,  markupPercent: 20, vatRate: 25 },
        { itemType: "travel",   description: "Travel",                      quantity: 1, unitPrice: 250,  vatRate: 25 },
      ],
    },
  ])
  console.log("✓ quote templates (2)")

  // ── 5. Customers ──────────────────────────────────────────────────────────
  const cRows = await db.insert(customers).values([
    { userId: uid, name: "Lars Andersen",            phone: "+45 20 11 22 33", email: "lars.andersen@gmail.com",  addressLine1: "Elmevej 12",      addressCity: "Aarhus",     addressZip: "8000", notes: "Prefers morning calls.", isFavorite: true  },
    { userId: uid, name: "Jorgensen & Sons A/S",     phone: "+45 33 44 55 66", email: "info@jorgensen-sons.dk",  addressLine1: "Industrialvej 8", addressCity: "Odense",     addressZip: "5000", cvrNumber: "28563412" },
    { userId: uid, name: "City Council Engineering", phone: "+45 36 37 50 00", email: "engineering@city.dk",     addressLine1: "Nørregade 36",    addressCity: "Copenhagen", addressZip: "1165", cvrNumber: "35209115", eanNumber: "5790000211327" },
    { userId: uid, name: "Mette Holst",              phone: "+45 50 66 77 88", email: "mette.holst@hotmail.com", addressLine1: "Rosevej 4",       addressCity: "Vejle",      addressZip: "7100", isFavorite: true  },
    { userId: uid, name: "Soren Holm Construction",  phone: "+45 72 30 40 50", email: "sh@holm-construction.dk", addressLine1: "Havnevej 55",     addressCity: "Esbjerg",    addressZip: "6700", cvrNumber: "31204567" },
    { userId: uid, name: "Thomas Kjaer",             phone: "+45 42 19 90 01",                                   addressLine1: "Skovkanten 7",    addressCity: "Kolding",    addressZip: "6000" },
    { userId: uid, name: "Anonymous Client" },
    { userId: uid, name: "Henrik Nielsen",           phone: "+45 61 23 45 67", email: "h.nielsen@outlook.dk",   addressLine1: "Kystvejen 22",    addressCity: "Roskilde",   addressZip: "4000" },
    { userId: uid, name: "Old Client Ltd.",          phone: "+45 99 88 77 66", email: "old@example.com",          deletedAt: new Date() },
  ]).returning()
  const [cLars, cJoerg, cCity, cMette, cSoren, cThomas, cAnon, cHenrik] = cRows
  console.log("✓ customers (9 — 1 soft-deleted)")

  // ── 6. Jobs ───────────────────────────────────────────────────────────────
  const [jKitchen] = await db.insert(jobs).values({
    userId: uid, customerId: cThomas.id, jobNumber: "1",
    title: "Kitchen tap replacement",
    description: "Replace kitchen mixer tap and under-sink stop valve.",
    jobType: "service", status: "new", scheduledDate: d(5),
  }).returning()

  const [jThermostats] = await db.insert(jobs).values({
    userId: uid, customerId: cLars.id, jobNumber: "2",
    title: "Thermostat replacement — all radiator valves",
    jobType: "service", status: "scheduled", scheduledDate: d(3),
    notes: "Key in the mailbox. Park on driveway.",
  }).returning()

  const [jBathroom] = await db.insert(jobs).values({
    userId: uid, customerId: cMette.id, jobNumber: "3",
    title: "Full bathroom renovation",
    jobType: "project", status: "in_progress",
    scheduledDate: d(-8), endDate: d(12),
    notes: "Tiles arrive Wednesday. Waterproofing membrane applied.",
  }).returning()

  const [jWarehouse] = await db.insert(jobs).values({
    userId: uid, customerId: cJoerg.id, jobNumber: "4",
    title: "Industrial pipe installation — warehouse",
    jobType: "project", status: "done",
    scheduledDate: d(-24), endDate: d(-20), completedDate: d(-20),
  }).returning()

  const [jDrain] = await db.insert(jobs).values({
    userId: uid, customerId: cSoren.id, jobNumber: "5",
    title: "Drain cleaning — commercial building",
    jobType: "service", status: "invoiced",
    scheduledDate: d(-34), completedDate: d(-32),
  }).returning()

  const [jHeatPump] = await db.insert(jobs).values({
    userId: uid, customerId: cLars.id, jobNumber: "6",
    title: "Heat pump annual service",
    jobType: "recurring", status: "paid",
    scheduledDate: d(-65), completedDate: d(-63),
  }).returning()

  const [jEmergency] = await db.insert(jobs).values({
    userId: uid, customerId: cAnon.id, jobNumber: "7",
    title: "Emergency water damage — basement",
    jobType: "service", status: "in_progress", scheduledDate: d(-2),
  }).returning()

  const [jVentilation] = await db.insert(jobs).values({
    userId: uid, customerId: cCity.id, jobNumber: "8",
    title: "Municipal ventilation inspection — Block C",
    jobType: "recurring", status: "scheduled",
    scheduledDate: d(10), endDate: d(10),
  }).returning()

  const [jOutdoorTap] = await db.insert(jobs).values({
    userId: uid, customerId: cHenrik.id, jobNumber: "9",
    title: "Outdoor garden tap installation",
    jobType: "service", status: "new", scheduledDate: d(8),
  }).returning()

  const [jBoiler] = await db.insert(jobs).values({
    userId: uid, customerId: cThomas.id, jobNumber: "10",
    title: "Boiler service and pressure check",
    jobType: "service", status: "in_progress", scheduledDate: d(-1),
    notes: "Pressure was at 0.5 bar on arrival — refilled to 1.5 bar.",
  }).returning()

  console.log("✓ jobs (10 — new×2 / scheduled×2 / in_progress×3 / done / invoiced / paid)")

  // ── 7. Job photos (picsum.photos = real images, no Blob required) ─────────
  await db.insert(jobPhotos).values([
    { jobId: jThermostats.id, fileUrl: "https://picsum.photos/seed/hvp-job2a/800/600", caption: "Before: existing thermostat valves" },
    { jobId: jThermostats.id, fileUrl: "https://picsum.photos/seed/hvp-job2b/800/600", caption: "Bedroom radiator — valve seized" },
    { jobId: jBathroom.id,    fileUrl: "https://picsum.photos/seed/hvp-job3a/800/600", caption: "Before: old tiles and shower unit" },
    { jobId: jBathroom.id,    fileUrl: "https://picsum.photos/seed/hvp-job3b/800/600", caption: "Day 1: demolition complete" },
    { jobId: jBathroom.id,    fileUrl: "https://picsum.photos/seed/hvp-job3c/800/600", caption: "Waterproofing membrane applied" },
    { jobId: jWarehouse.id,   fileUrl: "https://picsum.photos/seed/hvp-job4a/800/600", caption: "Existing drainage layout" },
    { jobId: jWarehouse.id,   fileUrl: "https://picsum.photos/seed/hvp-job4b/800/600", caption: "Pipe routing along north wall" },
    { jobId: jWarehouse.id,   fileUrl: "https://picsum.photos/seed/hvp-job4c/800/600", caption: "After: all pressure tests passed" },
    { jobId: jEmergency.id,   fileUrl: "https://picsum.photos/seed/hvp-job7a/800/600", caption: "Water ingress on east wall" },
    { jobId: jEmergency.id,   fileUrl: "https://picsum.photos/seed/hvp-job7b/800/600", caption: "Moisture meter reading — 94%" },
  ])
  console.log("✓ job photos (10)")

  // ── 8. Quotes ─────────────────────────────────────────────────────────────

  // TIL-0001 — draft: Thomas kitchen tap
  const [qDraft] = await db.insert(quotes).values({
    userId: uid, jobId: jKitchen.id, customerId: cThomas.id,
    quoteNumber: "TIL-0001", status: "draft",
    validUntil: d(30), notes: "Price includes all materials and labour.",
  }).returning()
  await db.insert(quoteItems).values([
    { quoteId: qDraft.id, itemType: "fixed",    description: "Call-out fee",              quantity: "1",   unitPrice: "450.00", vatRate: "25.00", sortOrder: 0 },
    { quoteId: qDraft.id, itemType: "labour",   description: "Mixer tap installation",    quantity: "1.5", unitPrice: "750.00", vatRate: "25.00", sortOrder: 1 },
    { quoteId: qDraft.id, itemType: "material", description: "Grohe Eurosmart mixer tap", quantity: "1",   unitPrice: "895.00", markupPercent: "15", vatRate: "25.00", sortOrder: 2 },
  ])

  // TIL-0002 — sent 3 days ago: Lars thermostats (normal, within 7d window)
  const [qSent] = await db.insert(quotes).values({
    userId: uid, jobId: jThermostats.id, customerId: cLars.id,
    quoteNumber: "TIL-0002", status: "sent",
    validUntil: d(11), sentAt: dt(-3),
    shareToken: "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6",
    notes: "Includes Danfoss valves on all 8 radiators. Valid 14 days.",
  }).returning()
  await db.insert(quoteItems).values([
    { quoteId: qSent.id, itemType: "labour",   description: "Thermostat valve replacement (8 units)", quantity: "3", unitPrice: "750.00", vatRate: "25.00", sortOrder: 0 },
    { quoteId: qSent.id, itemType: "material", description: "Danfoss RA-N thermostat valve",          quantity: "8", unitPrice: "189.00", markupPercent: "20", vatRate: "25.00", sortOrder: 1 },
    { quoteId: qSent.id, itemType: "travel",   description: "Travel",                                  quantity: "1", unitPrice: "250.00", vatRate: "25.00", sortOrder: 2 },
  ])

  // TIL-0003 — sent 10 days ago, NO follow-up draft: Henrik outdoor tap
  //            ↳ INNGEST: quote-followup-drafts cron WILL process this
  const [qStale] = await db.insert(quotes).values({
    userId: uid, jobId: jOutdoorTap.id, customerId: cHenrik.id,
    quoteNumber: "TIL-0003", status: "sent",
    validUntil: d(4), sentAt: dt(-10),
    shareToken: "b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1",
    notes: "Garden tap with isolation valve and anti-siphon protection.",
    followUpDraft: null,
  }).returning()
  await db.insert(quoteItems).values([
    { quoteId: qStale.id, itemType: "fixed",  description: "Outdoor tap kit (stop valve + check valve)", quantity: "1", unitPrice: "1150.00", vatRate: "25.00", sortOrder: 0 },
    { quoteId: qStale.id, itemType: "labour", description: "Installation",                                quantity: "2", unitPrice: "750.00",  vatRate: "25.00", sortOrder: 1 },
    { quoteId: qStale.id, itemType: "travel", description: "Travel",                                      quantity: "1", unitPrice: "250.00",  vatRate: "25.00", sortOrder: 2 },
  ])

  // TIL-0004 — sent 9 days ago, follow-up draft already written (post-cron state)
  const [qWithDraft] = await db.insert(quotes).values({
    userId: uid, customerId: cSoren.id,
    quoteNumber: "TIL-0004", status: "sent",
    validUntil: d(5), sentAt: dt(-9),
    shareToken: "c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
    followUpDraft: "Hi Soren, just following up on the facade and driveway pressure washing quote I sent last week. Happy to chat if you have questions or want to adjust the scope. Best regards.",
  }).returning()
  await db.insert(quoteItems).values([
    { quoteId: qWithDraft.id, itemType: "fixed", description: "Pressure washing — facade and driveway (flat rate)", quantity: "1", unitPrice: "4200.00", vatRate: "25.00", sortOrder: 0 },
  ])

  // TIL-0005 — accepted 7 days ago: Mette bathroom (header discount 5%)
  const [qAccepted] = await db.insert(quotes).values({
    userId: uid, jobId: jBathroom.id, customerId: cMette.id,
    quoteNumber: "TIL-0005", status: "accepted",
    validUntil: d(-5), sentAt: dt(-14), acceptedAt: dt(-7),
    shareToken: "d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3",
    discountType: "percent", discountValue: "5.00",
    notes: "5% discount for full payment on completion.",
  }).returning()
  await db.insert(quoteItems).values([
    { quoteId: qAccepted.id, itemType: "labour",   description: "Demolition and floor preparation",   quantity: "8",  unitPrice: "750.00",  vatRate: "25.00", sortOrder: 0 },
    { quoteId: qAccepted.id, itemType: "material", description: "White floor tiles 30x60 (sqm)",      quantity: "12", unitPrice: "285.00",  markupPercent: "18", vatRate: "25.00", sortOrder: 1 },
    { quoteId: qAccepted.id, itemType: "material", description: "Complete shower set — Hans Grohe",   quantity: "1",  unitPrice: "3200.00", markupPercent: "20", vatRate: "25.00", sortOrder: 2 },
    { quoteId: qAccepted.id, itemType: "fixed",    description: "Waste and rubble disposal",          quantity: "1",  unitPrice: "450.00",  vatRate: "25.00", sortOrder: 3 },
  ])

  // TIL-0006 — rejected 14 days ago: Jorgensen large warehouse job
  const [qRejected] = await db.insert(quotes).values({
    userId: uid, customerId: cJoerg.id,
    quoteNumber: "TIL-0006", status: "rejected",
    validUntil: d(-7), sentAt: dt(-24), rejectedAt: dt(-14),
    shareToken: "e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4",
    internalNotes: "Lost to cheaper competitor — was approx DKK 12k over their budget.",
  }).returning()
  await db.insert(quoteItems).values([
    { quoteId: qRejected.id, itemType: "labour",   description: "Pipe installation warehouse (40h est.)", quantity: "40", unitPrice: "750.00", vatRate: "25.00", sortOrder: 0 },
    { quoteId: qRejected.id, itemType: "material", description: "Galvanised pipe 2 inch (per m)",         quantity: "80", unitPrice: "220.00", markupPercent: "22", vatRate: "25.00", sortOrder: 1 },
    { quoteId: qRejected.id, itemType: "travel",   description: "Travel",                                  quantity: "1",  unitPrice: "350.00", vatRate: "25.00", sortOrder: 2 },
  ])

  // TIL-0007 — expired 45 days ago: Soren old drain quote
  const [qExpired] = await db.insert(quotes).values({
    userId: uid, jobId: jDrain.id, customerId: cSoren.id,
    quoteNumber: "TIL-0007", status: "expired",
    validUntil: d(-45), sentAt: dt(-60),
    shareToken: "f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5",
  }).returning()
  await db.insert(quoteItems).values([
    { quoteId: qExpired.id, itemType: "fixed",  description: "Drain inspection and high-pressure jetting", quantity: "1", unitPrice: "3200.00", vatRate: "25.00", sortOrder: 0 },
    { quoteId: qExpired.id, itemType: "travel", description: "Travel",                                      quantity: "1", unitPrice: "250.00",  vatRate: "25.00", sortOrder: 1 },
  ])

  // TIL-0008 + TIL-0009 — merged: City ventilation zones A → combined
  const [qMergeA] = await db.insert(quotes).values({
    userId: uid, customerId: cCity.id,
    quoteNumber: "TIL-0008", status: "merged",
    validUntil: d(20), sentAt: dt(-6),
    internalNotes: "Merged into TIL-0009.",
  }).returning()
  await db.insert(quoteItems).values([
    { quoteId: qMergeA.id, itemType: "labour", description: "Ventilation inspection zone A", quantity: "4", unitPrice: "750.00", vatRate: "25.00", sortOrder: 0 },
  ])

  const [qMerged] = await db.insert(quotes).values({
    userId: uid, jobId: jVentilation.id, customerId: cCity.id,
    quoteNumber: "TIL-0009", status: "sent",
    validUntil: d(20), sentAt: dt(-6),
    shareToken: "a2b3c4d5e6f7a2b3c4d5e6f7a2b3c4d5e6f7a2b3c4d5e6f7",
    notes: "Combined quote for ventilation zones A and B plus filter replacement.",
  }).returning()
  await db.insert(quoteItems).values([
    { quoteId: qMerged.id, itemType: "labour",   description: "Ventilation inspection zone A",   quantity: "4", unitPrice: "750.00", vatRate: "25.00", sortOrder: 0 },
    { quoteId: qMerged.id, itemType: "labour",   description: "Ventilation inspection zone B",   quantity: "4", unitPrice: "750.00", vatRate: "25.00", sortOrder: 1 },
    { quoteId: qMerged.id, itemType: "material", description: "HEPA filter set — 2 units",       quantity: "2", unitPrice: "640.00", markupPercent: "20", vatRate: "25.00", sortOrder: 2 },
    { quoteId: qMerged.id, itemType: "travel",   description: "Travel",                           quantity: "1", unitPrice: "350.00", vatRate: "25.00", sortOrder: 3 },
  ])
  await db.update(quotes).set({ mergedInto: qMerged.id }).where(eq(quotes.id, qMergeA.id))
  console.log("✓ quotes (9 — draft / sent×3 / accepted / rejected / expired / merged×2)")

  // ── 9. Invoices ───────────────────────────────────────────────────────────

  // FAK-0001 — draft: Jorgensen warehouse
  const [invDraft] = await db.insert(invoices).values({
    userId: uid, jobId: jWarehouse.id, customerId: cJoerg.id,
    invoiceNumber: "FAK-0001", status: "draft",
    issueDate: d(0), dueDate: d(14), paymentTermsDays: 14,
    subtotalExVat: "38800.00", vatAmount: "9700.00", totalInclVat: "48500.00",
    bankAccount: bankStr,
    notes: "Payment due 14 days from issue date.",
  }).returning()
  await db.insert(invoiceItems).values([
    { invoiceId: invDraft.id, itemType: "labour",   description: "Pipe installation — warehouse (40h)", quantity: "40", unitPrice: "750.00", vatRate: "25.00", lineTotal: "30000.00", sortOrder: 0 },
    { invoiceId: invDraft.id, itemType: "material", description: "Galvanised pipe 2 inch (per m)",      quantity: "80", unitPrice: "110.00", vatRate: "25.00", lineTotal: "8800.00",  sortOrder: 1 },
  ])

  // FAK-0002 — sent TODAY: Thomas kitchen tap
  //            ↳ INNGEST: fire invoice/sent event to trigger reminder chain
  const [invSentToday] = await db.insert(invoices).values({
    userId: uid, jobId: jKitchen.id, customerId: cThomas.id,
    invoiceNumber: "FAK-0002", status: "sent",
    issueDate: d(0), dueDate: d(14), paymentTermsDays: 14,
    sentAt: dt(0, 9, 30),
    subtotalExVat: "2120.00", vatAmount: "530.00", totalInclVat: "2650.00",
    bankAccount: bankStr,
  }).returning()
  await db.insert(invoiceItems).values([
    { invoiceId: invSentToday.id, itemType: "fixed",    description: "Call-out fee",              quantity: "1",   unitPrice: "450.00", vatRate: "25.00", lineTotal: "450.00",  sortOrder: 0 },
    { invoiceId: invSentToday.id, itemType: "labour",   description: "Mixer tap installation",    quantity: "1.5", unitPrice: "750.00", vatRate: "25.00", lineTotal: "1125.00", sortOrder: 1 },
    { invoiceId: invSentToday.id, itemType: "material", description: "Grohe Eurosmart mixer tap", quantity: "1",   unitPrice: "545.00", vatRate: "25.00", lineTotal: "545.00",  sortOrder: 2 },
  ])

  // FAK-0003 — viewed: Mette bathroom phase 1
  const [invViewed] = await db.insert(invoices).values({
    userId: uid, customerId: cMette.id,
    invoiceNumber: "FAK-0003", status: "viewed",
    issueDate: d(-10), dueDate: d(4), paymentTermsDays: 14,
    sentAt: dt(-10), viewedAt: dt(-8),
    subtotalExVat: "6000.00", vatAmount: "1500.00", totalInclVat: "7500.00",
    bankAccount: bankStr,
  }).returning()
  await db.insert(invoiceItems).values([
    { invoiceId: invViewed.id, itemType: "labour", description: "Phase 1: demolition and floor preparation", quantity: "8", unitPrice: "750.00", vatRate: "25.00", lineTotal: "6000.00", sortOrder: 0 },
  ])

  // FAK-0004 — paid: Lars heat pump
  const [invPaid] = await db.insert(invoices).values({
    userId: uid, jobId: jHeatPump.id, customerId: cLars.id,
    invoiceNumber: "FAK-0004", status: "paid",
    issueDate: d(-65), dueDate: d(-51), paymentTermsDays: 14,
    sentAt: dt(-65), viewedAt: dt(-64), paidAt: dt(-55),
    subtotalExVat: "3900.00", vatAmount: "975.00", totalInclVat: "4875.00",
    bankAccount: bankStr,
  }).returning()
  await db.insert(invoiceItems).values([
    { invoiceId: invPaid.id, itemType: "labour",   description: "Heat pump service + diagnostics", quantity: "3",   unitPrice: "750.00", vatRate: "25.00", lineTotal: "2250.00", sortOrder: 0 },
    { invoiceId: invPaid.id, itemType: "material", description: "Refrigerant R410A (kg)",          quantity: "1.5", unitPrice: "900.00", vatRate: "25.00", lineTotal: "1350.00", sortOrder: 1 },
    { invoiceId: invPaid.id, itemType: "travel",   description: "Travel",                           quantity: "1",   unitPrice: "300.00", vatRate: "25.00", lineTotal: "300.00",  sortOrder: 2 },
  ])

  // FAK-0005 — sent, mid-reminder: Soren pressure washing
  //            ↳ INNGEST: reminder_1 sent 3 days ago, reminder_2 is ~4 days away
  const [invMidReminder] = await db.insert(invoices).values({
    userId: uid, customerId: cSoren.id,
    invoiceNumber: "FAK-0005", status: "sent",
    issueDate: d(-14), dueDate: d(0), paymentTermsDays: 14,
    sentAt: dt(-14), reminder1SentAt: dt(-6),
    subtotalExVat: "4200.00", vatAmount: "1050.00", totalInclVat: "5250.00",
    bankAccount: bankStr,
    notes: "First payment reminder sent 8 days after sending.",
  }).returning()
  await db.insert(invoiceItems).values([
    { invoiceId: invMidReminder.id, itemType: "fixed", description: "Facade and driveway pressure washing", quantity: "1", unitPrice: "4200.00", vatRate: "25.00", lineTotal: "4200.00", sortOrder: 0 },
  ])

  // FAK-0006 — sent, PAST DUE DATE (no paidAt, no overdue status yet)
  //            ↳ INNGEST: mark-overdue-invoices cron WILL flip this to overdue
  const [invPastDue] = await db.insert(invoices).values({
    userId: uid, jobId: jEmergency.id, customerId: cAnon.id,
    invoiceNumber: "FAK-0006", status: "sent",
    issueDate: d(-18), dueDate: d(-4), paymentTermsDays: 14,
    sentAt: dt(-18),
    subtotalExVat: "1800.00", vatAmount: "450.00", totalInclVat: "2250.00",
    bankAccount: bankStr,
  }).returning()
  await db.insert(invoiceItems).values([
    { invoiceId: invPastDue.id, itemType: "labour", description: "Emergency water damage response (3h)", quantity: "3", unitPrice: "600.00", vatRate: "25.00", lineTotal: "1800.00", sortOrder: 0 },
  ])

  // FAK-0007 — overdue: Soren large drain job (both reminders sent)
  const [invOverdue] = await db.insert(invoices).values({
    userId: uid, jobId: jDrain.id, customerId: cSoren.id,
    invoiceNumber: "FAK-0007", status: "overdue",
    issueDate: d(-45), dueDate: d(-31), paymentTermsDays: 14,
    sentAt: dt(-45), viewedAt: dt(-44),
    reminder1SentAt: dt(-23), reminder2SentAt: dt(-16),
    subtotalExVat: "18400.00", vatAmount: "4600.00", totalInclVat: "23000.00",
    bankAccount: bankStr,
    notes: "Payment reminders sent at day 8 and day 15.",
  }).returning()
  await db.insert(invoiceItems).values([
    { invoiceId: invOverdue.id, itemType: "labour",   description: "Drain cleaning — large installation",  quantity: "16", unitPrice: "650.00",  vatRate: "25.00", lineTotal: "10400.00", sortOrder: 0 },
    { invoiceId: invOverdue.id, itemType: "material", description: "High-pressure hose 30m",               quantity: "1",  unitPrice: "6000.00", vatRate: "25.00", lineTotal: "6000.00",  sortOrder: 1 },
    { invoiceId: invOverdue.id, itemType: "travel",   description: "Travel + van hire",                    quantity: "1",  unitPrice: "2000.00", vatRate: "25.00", lineTotal: "2000.00",  sortOrder: 2 },
  ])

  // KRE-0001 — credit note: partial reversal of FAK-0007 (travel line)
  const [invCredit] = await db.insert(invoices).values({
    userId: uid, customerId: cSoren.id,
    invoiceNumber: "KRE-0001", status: "paid",
    isCreditNote: true, originalInvoiceId: invOverdue.id,
    issueDate: d(-12), dueDate: d(-12),
    sentAt: dt(-12), paidAt: dt(-12),
    subtotalExVat: "-2000.00", vatAmount: "-500.00", totalInclVat: "-2500.00",
    bankAccount: bankStr,
    notes: "Credit note for travel — line item was entered in error.",
  }).returning()
  await db.insert(invoiceItems).values([
    { invoiceId: invCredit.id, itemType: "travel", description: "Travel + van hire (credited)", quantity: "1", unitPrice: "-2000.00", vatRate: "25.00", lineTotal: "-2000.00", sortOrder: 0 },
  ])

  // FAK-0008 (merged) + FAK-0009 (merged result): City ventilation
  const [invMergeA] = await db.insert(invoices).values({
    userId: uid, customerId: cCity.id,
    invoiceNumber: "FAK-0008", status: "merged",
    issueDate: d(-3), dueDate: d(11),
    subtotalExVat: "3000.00", vatAmount: "750.00", totalInclVat: "3750.00",
  }).returning()

  const [invMerged] = await db.insert(invoices).values({
    userId: uid, jobId: jVentilation.id, customerId: cCity.id,
    invoiceNumber: "FAK-0009", status: "sent",
    issueDate: d(-3), dueDate: d(11), paymentTermsDays: 14,
    sentAt: dt(-3),
    subtotalExVat: "9750.00", vatAmount: "2437.50", totalInclVat: "12187.50",
    bankAccount: bankStr,
    eanNumber: cCity.eanNumber ?? undefined,
    notes: "Combined invoice — ventilation zones A and B.",
  }).returning()
  await db.insert(invoiceItems).values([
    { invoiceId: invMerged.id, itemType: "labour",   description: "Ventilation inspection zone A",  quantity: "4", unitPrice: "750.00", vatRate: "25.00", lineTotal: "3000.00", sortOrder: 0 },
    { invoiceId: invMerged.id, itemType: "labour",   description: "Ventilation inspection zone B",  quantity: "4", unitPrice: "750.00", vatRate: "25.00", lineTotal: "3000.00", sortOrder: 1 },
    { invoiceId: invMerged.id, itemType: "material", description: "HEPA filter set — 2 units",      quantity: "2", unitPrice: "768.00", vatRate: "25.00", lineTotal: "1536.00", sortOrder: 2 },
    { invoiceId: invMerged.id, itemType: "travel",   description: "Travel",                          quantity: "1", unitPrice: "350.00", vatRate: "25.00", lineTotal: "350.00",  sortOrder: 3 },
    { invoiceId: invMerged.id, itemType: "material", description: "Filter adhesive tape (roll)",     quantity: "2", unitPrice: "132.00", vatRate: "25.00", lineTotal: "264.00",  sortOrder: 4 },
    { invoiceId: invMerged.id, itemType: "labour",   description: "Zone A + B travel coordination", quantity: "2", unitPrice: "300.00", vatRate: "25.00", lineTotal: "600.00",  sortOrder: 5 },
  ])
  await db.update(invoices).set({ mergedInto: invMerged.id }).where(eq(invoices.id, invMergeA.id))

  // FAK-0010 — sent, with per-line discounts: Lars complex piping
  const [invDiscounted] = await db.insert(invoices).values({
    userId: uid, customerId: cLars.id,
    invoiceNumber: "FAK-0010", status: "sent",
    issueDate: d(-2), dueDate: d(12), paymentTermsDays: 14,
    sentAt: dt(-2),
    subtotalExVat: "6000.00", vatAmount: "1500.00", totalInclVat: "7500.00",
    discountAmount: "750.00",
    bankAccount: bankStr,
  }).returning()
  await db.insert(invoiceItems).values([
    {
      invoiceId: invDiscounted.id, itemType: "labour",
      description: "Complex pipe rerouting (full day)", quantity: "8", unitPrice: "750.00",
      discountType: "percent", discountValue: "10",
      vatRate: "25.00", lineTotal: "5400.00", sortOrder: 0,
    },
    {
      invoiceId: invDiscounted.id, itemType: "fixed",
      description: "Scaffolding hire",               quantity: "1", unitPrice: "1200.00",
      discountType: "fixed", discountValue: "600",
      vatRate: "25.00", lineTotal: "600.00", sortOrder: 1,
    },
  ])

  console.log("✓ invoices (11 — draft/sent×3/viewed/paid/mid-reminder/past-due/overdue/credit-note/merged×2/discounted)")

  // ── 10. Time entries ──────────────────────────────────────────────────────

  await db.insert(timeEntries).values([
    // Bathroom renovation (in_progress, Mette) — 3 entries
    {
      userId: uid, jobId: jBathroom.id,
      startedAt: dt(-8, 8, 0), endedAt: dt(-8, 15, 30), durationMinutes: 450,
      isBillable: true, description: "Demolition and floor preparation",
    },
    {
      userId: uid, jobId: jBathroom.id,
      startedAt: dt(-6, 9, 0), endedAt: dt(-6, 9, 45), durationMinutes: 45,
      isBillable: false, description: "Material measurements and supplier order",
    },
    {
      // ACTIVE — clock currently running
      userId: uid, jobId: jBathroom.id,
      startedAt: dt(0, 8, 0), endedAt: null, durationMinutes: null,
      isBillable: true, description: "Tiling east wall",
    },

    // Warehouse job (done, Jorgensen) — 3 completed entries billed to invDraft
    {
      userId: uid, jobId: jWarehouse.id,
      startedAt: dt(-24, 7, 0), endedAt: dt(-24, 17, 0), durationMinutes: 600,
      isBillable: true, description: "Pipe routing and installation day 1",
      billedToInvoiceId: invDraft.id,
    },
    {
      userId: uid, jobId: jWarehouse.id,
      startedAt: dt(-23, 7, 0), endedAt: dt(-23, 17, 0), durationMinutes: 600,
      isBillable: true, description: "Pipe routing and installation day 2",
      billedToInvoiceId: invDraft.id,
    },
    {
      userId: uid, jobId: jWarehouse.id,
      startedAt: dt(-22, 7, 0), endedAt: dt(-22, 14, 0), durationMinutes: 420,
      isBillable: true, description: "Final connections and pressure test",
      billedToInvoiceId: invDraft.id,
    },

    // Heat pump (paid, Lars) — 1 entry billed to invPaid
    {
      userId: uid, jobId: jHeatPump.id,
      startedAt: dt(-65, 9, 0), endedAt: dt(-65, 12, 30), durationMinutes: 210,
      isBillable: true, description: "Annual service and refrigerant top-up",
      billedToInvoiceId: invPaid.id,
    },

    // Bathroom quote survey — billed to accepted quote TIL-0005
    {
      userId: uid, jobId: jBathroom.id,
      startedAt: dt(-16, 10, 0), endedAt: dt(-16, 11, 30), durationMinutes: 90,
      isBillable: true, description: "Site survey and measurements",
      billedToQuoteId: qAccepted.id,
    },

    // Boiler service (in_progress, Thomas) — 1 completed entry
    {
      userId: uid, jobId: jBoiler.id,
      startedAt: dt(-1, 10, 0), endedAt: dt(-1, 11, 30), durationMinutes: 90,
      isBillable: true, description: "Initial inspection and boiler diagnostics",
    },

    // Emergency job (in_progress, Anonymous) — non-billable note entry
    {
      userId: uid, jobId: jEmergency.id,
      startedAt: dt(-2, 14, 0), endedAt: dt(-2, 15, 0), durationMinutes: 60,
      isBillable: false, description: "Assessment and moisture readings",
    },

    // Soft-deleted entry
    {
      userId: uid, jobId: jBathroom.id,
      startedAt: dt(-3, 13, 0), endedAt: dt(-3, 13, 30), durationMinutes: 30,
      isBillable: true, description: "Removed duplicate entry",
      deletedAt: new Date(),
    },
  ])
  console.log("✓ time entries (11 — active clock / billed-to-invoice×4 / billed-to-quote×1 / unbilled×4 / soft-deleted×1)")

  // ── 11. AI recordings ─────────────────────────────────────────────────────
  await db.insert(aiRecordings).values([
    {
      // pending — just submitted, Inngest not yet started
      userId: uid, status: "pending",
      blobUrl: "https://blob.vercel-storage.com/seed-pending-audio.webm",
      mimeType: "audio/webm",
    },
    {
      // processing — Inngest function is mid-run
      userId: uid, status: "processing",
      blobUrl: "https://blob.vercel-storage.com/seed-processing-audio.webm",
      mimeType: "audio/webm",
      currentStep: "ai-extract:groq-transcribe",
      inngestRunId: "01HZ1234ABCD5678EFGH",
    },
    {
      // ready — pipeline complete, extractedData populated
      userId: uid, status: "ready",
      blobUrl: "",
      mimeType: "audio/webm",
      currentStep: "done",
      extractedData: {
        customer: {
          name: "Bjorn Larsen",
          phone: "+45 40 12 34 56",
          address: "Birkevej 9, 4000 Roskilde",
        },
        job: {
          title: "Leaking radiator valve — living room",
          description: "Customer reports water around the valve on the living room radiator. Possible worn olive or stem seal.",
          jobType: "service",
          scheduledDate: d(4),
          notes: "Customer wants work done before the weekend.",
          materials: ["valve", "olive", "PTFE tape", "radiator key"],
        },
        quote: {
          items: [
            { description: "Call-out fee", qty: 1, unitPrice: 450, type: "fixed" },
            { description: "Radiator valve repair", qty: 1.5, unitPrice: 750, type: "labour" },
            { description: "Valve and fittings", qty: 1, unitPrice: 320, type: "material" },
          ],
          notes: "Price subject to confirmation of parts needed on site.",
        },
      },
    },
    {
      // failed — extraction error
      userId: uid, status: "failed",
      blobUrl: "",
      mimeType: "audio/webm",
      currentStep: "ai-extract:groq-extract",
      errorStep: "ai-extract:groq-extract",
      errorMessage: "JSON parsing failed: model returned incomplete response. Likely audio quality too low.",
      inngestRunId: "01HZ5678EFGH1234ABCD",
    },
  ])
  console.log("✓ ai recordings (4 — pending / processing / ready / failed)")

  // ── 12. Notifications ─────────────────────────────────────────────────────
  const [readyRecording] = await db
    .select()
    .from(aiRecordings)
    .where(eq(aiRecordings.status, "ready"))
    .limit(1)

  await db.insert(notifications).values([
    {
      userId: uid,
      type: "ai_customer_found",
      title: "Customer extracted from recording",
      body: "Bjorn Larsen · +45 40 12 34 56 · Birkevej 9, 4000 Roskilde",
      metadata: { recordingId: readyRecording.id, entityType: "customer" },
      read: false,
    },
    {
      userId: uid,
      type: "ai_job_found",
      title: "Job extracted from recording",
      body: "Leaking radiator valve — living room · service",
      metadata: { recordingId: readyRecording.id, entityType: "job" },
      read: false,
    },
    {
      userId: uid,
      type: "ai_quote_found",
      title: "Quote items extracted from recording",
      body: "3 items · Est. DKK 1,520",
      metadata: { recordingId: readyRecording.id, entityType: "quote" },
      read: true,
      readAt: dt(-1, 10),
    },
    {
      userId: uid,
      type: "quote_followup_draft",
      title: "Follow-up draft ready",
      body: `A follow-up draft is ready for Henrik Nielsen (Quote #TIL-0003).`,
      metadata: { quoteId: qStale.id, quoteNumber: "TIL-0003" },
      read: false,
    },
    {
      userId: uid,
      type: "quote_followup_draft",
      title: "Follow-up draft ready",
      body: `A follow-up draft is ready for Soren Holm Construction (Quote #TIL-0004).`,
      metadata: { quoteId: qWithDraft.id, quoteNumber: "TIL-0004" },
      read: true,
      readAt: dt(-2, 8),
    },
  ])
  console.log("✓ notifications (5 — 2 unread / 1 read / all 4 types covered)")

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log(`
────────────────────────────────────────────────────────────
Seed complete.

  Bank accounts   : 2 (1 default)
  Pricebook items : 8 (all 4 types, 1 disabled, 1 soft-deleted)
  Materials       : 5
  Templates       : 2
  Customers       : 9 (1 soft-deleted)
  Jobs            : 10 (all 6 statuses + 4 extras, 3 job types)
  Job photos      : 10 (real picsum.photos URLs)
  Quotes          : 9 (all statuses incl. merged)
  Invoices        : 11 (all statuses incl. mid-reminder, past-due)
  Time entries    : 11 (active clock, billed-to-invoice/quote, soft-deleted)
  AI recordings   : 4 (pending / processing / ready / failed)
  Notifications   : 5 (all 4 types, mix of read/unread)

Inngest triggers ready to test:
  invoice/sent        → FAK-0002 (just sent today)
  mark-overdue cron   → FAK-0006 (past due, still 'sent')
  quote-followup cron → TIL-0003 (10 days old, no draft)
  recording/submitted → pending ai_recording
────────────────────────────────────────────────────────────
`)
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
