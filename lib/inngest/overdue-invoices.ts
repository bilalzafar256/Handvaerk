import { inngest } from "./client"
import { markAllOverdueInvoices } from "@/lib/db/queries/invoices"

export const markOverdueInvoicesCron = inngest.createFunction(
  {
    id: "mark-overdue-invoices",
    triggers: [{ cron: "0 6 * * *" }],
  },
  async ({ step }: { step: { run: <T>(id: string, fn: () => Promise<T>) => Promise<T> } }) => {
    await step.run("mark-overdue", async () => {
      await markAllOverdueInvoices()
    })
  }
)
