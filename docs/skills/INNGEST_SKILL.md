# SKILL: Inngest — Background Jobs & Event-Driven Functions
> Source: https://www.inngest.com/docs | https://www.inngest.com/docs/sdk/serve
> Version: inngest ^3

---

## PROJECT-SPECIFIC RULES
- Use Inngest for: invoice reminder emails, user sync from Clerk webhook, scheduled tasks.
- Inngest functions run as serverless functions on Vercel.
- All Inngest functions live in `/lib/inngest/functions/`.

---

## SETUP

### Environment variables
```env
INNGEST_EVENT_KEY=...
INNGEST_SIGNING_KEY=...
```

### Client
```typescript
// lib/inngest/client.ts
import { Inngest } from "inngest"

export const inngest = new Inngest({
  id: "haandvaerk-pro",
  name: "Håndværk Pro",
})
```

### Serve handler (registers all functions with Inngest)
```typescript
// app/api/inngest/route.ts
import { serve } from "inngest/next"
import { inngest } from "@/lib/inngest/client"
import { invoiceReminder } from "@/lib/inngest/functions/invoice-reminder"
import { userSync } from "@/lib/inngest/functions/user-sync"

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [invoiceReminder, userSync],
})
```

---

## INVOICE REMINDER FUNCTION

```typescript
// lib/inngest/functions/invoice-reminder.ts
import { inngest } from "../client"
import { db } from "@/lib/db"
import { invoices } from "@/lib/db/schema"
import { eq, and, isNull, lte, isNotNull } from "drizzle-orm"
import { sendInvoiceReminder } from "@/lib/email"

export const invoiceReminder = inngest.createFunction(
  {
    id: "invoice-reminder",
    name: "Send Invoice Reminder",
  },
  { event: "invoice/sent" },  // Triggered when invoice is sent
  async ({ event, step }) => {
    const { invoiceId, userId, customerEmail, dueDate, amount } = event.data

    // Wait until 8 days after due date, then check if still unpaid
    await step.waitForEvent("invoice/paid", {
      timeout: "8d",          // wait 8 days for a payment event
      match: "data.invoiceId",
    })

    // If we're here, invoice was NOT paid (timeout reached)
    await step.run("send-first-reminder", async () => {
      const invoice = await db.query.invoices.findFirst({
        where: and(eq(invoices.id, invoiceId), isNull(invoices.paidAt)),
      })
      if (!invoice) return // Already paid

      await sendInvoiceReminder({
        to: customerEmail,
        invoiceNumber: invoice.invoiceNumber,
        amount,
        dueDate,
        reminderNumber: 1,
      })

      await db.update(invoices)
        .set({ reminder1SentAt: new Date() })
        .where(eq(invoices.id, invoiceId))
    })

    // Wait another 7 days for second reminder
    await step.sleep("wait-for-second-reminder", "7d")

    await step.run("send-second-reminder", async () => {
      const invoice = await db.query.invoices.findFirst({
        where: and(eq(invoices.id, invoiceId), isNull(invoices.paidAt)),
      })
      if (!invoice) return // Paid in the meantime

      await sendInvoiceReminder({
        to: customerEmail,
        invoiceNumber: invoice.invoiceNumber,
        amount,
        dueDate,
        reminderNumber: 2,
      })

      await db.update(invoices)
        .set({ reminder2SentAt: new Date() })
        .where(eq(invoices.id, invoiceId))
    })
  }
)
```

---

## TRIGGERING AN INNGEST EVENT

```typescript
// lib/actions/invoices.ts — after sending an invoice
import { inngest } from "@/lib/inngest/client"

export async function sendInvoice(invoiceId: string) {
  // ... send email logic ...

  // Trigger background reminder workflow
  await inngest.send({
    name: "invoice/sent",
    data: {
      invoiceId,
      userId,
      customerEmail: customer.email,
      dueDate: invoice.dueDate,
      amount: invoice.totalInclVat,
    },
  })
}

// When invoice is marked paid — cancels pending reminders
export async function markInvoicePaid(invoiceId: string) {
  // ... update DB ...

  await inngest.send({
    name: "invoice/paid",
    data: { invoiceId },
  })
}
```

---

## USER SYNC FUNCTION (Inngest alternative to webhook)

```typescript
// lib/inngest/functions/user-sync.ts
import { inngest } from "../client"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"

export const userSync = inngest.createFunction(
  { id: "user-sync", name: "Sync Clerk User to DB" },
  { event: "clerk/user.created" },
  async ({ event }) => {
    const { clerkId, email, phone } = event.data
    await db.insert(users).values({ clerkId, email, phone, tier: "free" })
      .onConflictDoNothing()
  }
)
```

---

## DEVELOPING LOCALLY

```bash
# Install Inngest Dev Server
npx inngest-cli@latest dev

# This starts a local Inngest server at http://localhost:8288
# It captures all events and runs functions locally
# No real Inngest account needed for local development
```
