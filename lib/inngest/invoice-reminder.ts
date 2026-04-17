import { inngest } from "./client"
import { db } from "@/lib/db"
import { invoices } from "@/lib/db/schema"
import { eq, and, isNull } from "drizzle-orm"
import { formatDKK } from "@/lib/utils/currency"

export const invoiceReminder = inngest.createFunction(
  {
    id: "invoice-reminder",
    triggers: [{ event: "invoice/sent" }],
  },
  async ({ event, step }: { event: { data: { invoiceId: string; userId: string; customerEmail: string; dueDate: string; amount: string } }; step: { waitForEvent: (id: string, opts: { event: string; timeout: string; match: string }) => Promise<unknown>; sleep: (id: string, duration: string) => Promise<void>; run: <T>(id: string, fn: () => Promise<T>) => Promise<T> } }) => {
    const { invoiceId, customerEmail, dueDate, amount } = event.data

    // Wait up to 8 days for payment event; if timeout → send first reminder
    const paid = await step.waitForEvent("wait-for-payment-first", {
      event:   "invoice/paid",
      timeout: "8d",
      match:   "data.invoiceId",
    })

    if (paid) return // Invoice was paid — stop

    // Send first reminder
    await step.run("send-first-reminder", async () => {
      const invoice = await db.query.invoices.findFirst({
        where: and(eq(invoices.id, invoiceId), isNull(invoices.paidAt)),
        with:  { customer: true },
      })
      if (!invoice) return

      const { resend } = await import("@/lib/email/client")
      const { PaymentReminderEmail } = await import("@/lib/email/templates/payment-reminder")

      await resend.emails.send({
        from:    "Håndværk Pro <onboarding@resend.dev>",
        to:      [customerEmail],
        subject: "Betalingspåmindelse",
        react:   PaymentReminderEmail({
          customerName:   invoice.customer.name,
          invoiceNumber:  invoice.invoiceNumber,
          amountDKK:      formatDKK(parseFloat(amount)),
          dueDate,
          reminderNumber: 1,
        }),
      })

      await db
        .update(invoices)
        .set({ reminder1SentAt: new Date(), updatedAt: new Date() })
        .where(eq(invoices.id, invoiceId))
    })

    // Wait 7 more days for second reminder
    await step.sleep("wait-second-reminder", "7d")

    await step.run("send-second-reminder", async () => {
      const invoice = await db.query.invoices.findFirst({
        where: and(eq(invoices.id, invoiceId), isNull(invoices.paidAt)),
        with:  { customer: true },
      })
      if (!invoice) return

      const { resend } = await import("@/lib/email/client")
      const { PaymentReminderEmail } = await import("@/lib/email/templates/payment-reminder")

      await resend.emails.send({
        from:    "Håndværk Pro <onboarding@resend.dev>",
        to:      [customerEmail],
        subject: "Anden betalingspåmindelse",
        react:   PaymentReminderEmail({
          customerName:   invoice.customer.name,
          invoiceNumber:  invoice.invoiceNumber,
          amountDKK:      formatDKK(parseFloat(amount)),
          dueDate,
          reminderNumber: 2,
        }),
      })

      await db
        .update(invoices)
        .set({ reminder2SentAt: new Date(), updatedAt: new Date() })
        .where(eq(invoices.id, invoiceId))
    })
  }
)
