import { serve } from "inngest/next"
import { inngest } from "@/lib/inngest/client"
import { helloWorld } from "@/lib/inngest/functions"
import { invoiceReminder } from "@/lib/inngest/invoice-reminder"
import { processJobRecording } from "@/lib/inngest/process-job-recording"
import { markOverdueInvoicesCron } from "@/lib/inngest/overdue-invoices"
import { hardDeleteUser } from "@/lib/inngest/user-deletion"

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [helloWorld, invoiceReminder, processJobRecording, markOverdueInvoicesCron, hardDeleteUser],
})
