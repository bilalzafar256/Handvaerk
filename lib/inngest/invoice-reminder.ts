import { inngest } from "./client"
import { db } from "@/lib/db"
import { invoices, users } from "@/lib/db/schema"
import { eq, and, isNull } from "drizzle-orm"
import { formatDKK } from "@/lib/utils/currency"

type Step = {
  sleepUntil: (id: string, datetime: Date | string) => Promise<void>
  run: <T>(id: string, fn: () => Promise<T>) => Promise<T>
}

export const invoiceReminder = inngest.createFunction(
  {
    id: "invoice-reminder",
    triggers: [{ event: "invoice/sent" }],
    cancelOn: [{ event: "invoice/sent", match: "data.invoiceId" }],
  },
  async ({ event, step }: { event: { data: { invoiceId: string; userId: string; customerEmail: string; dueDate: string; amount: string } }; step: Step }) => {
    const { invoiceId, userId, customerEmail, dueDate, amount } = event.data

    // Fetch user's reminder day settings
    const user = await db.query.users.findFirst({ where: eq(users.id, userId) })
    const reminder1Days = user?.invoiceReminder1Days ?? 3
    const reminder2Days = user?.invoiceReminder2Days ?? 7

    const due = new Date(dueDate)
    const reminder1At = new Date(due.getTime() + reminder1Days * 86_400_000)
    const reminder2At = new Date(due.getTime() + reminder2Days * 86_400_000)

    await step.sleepUntil("wait-reminder1", reminder1At)

    await step.run("send-first-reminder", async () => {
      const invoice = await db.query.invoices.findFirst({
        where: and(eq(invoices.id, invoiceId), isNull(invoices.paidAt)),
        with: { customer: true },
      })
      if (!invoice) return

      const { resend, EMAIL_FROM } = await import("@/lib/email/client")
      const { PaymentReminderEmail } = await import("@/lib/email/templates/payment-reminder")

      await resend.emails.send({
        from:    EMAIL_FROM,
        to:      [customerEmail],
        subject: "Payment reminder",
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

    await step.sleepUntil("wait-reminder2", reminder2At)

    await step.run("send-second-reminder", async () => {
      const invoice = await db.query.invoices.findFirst({
        where: and(eq(invoices.id, invoiceId), isNull(invoices.paidAt)),
        with: { customer: true },
      })
      if (!invoice) return

      const { resend, EMAIL_FROM } = await import("@/lib/email/client")
      const { PaymentReminderEmail } = await import("@/lib/email/templates/payment-reminder")

      await resend.emails.send({
        from:    EMAIL_FROM,
        to:      [customerEmail],
        subject: "Second payment reminder",
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
