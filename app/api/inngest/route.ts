import { serve } from "inngest/next"
import { inngest } from "@/lib/inngest/client"
import { helloWorld } from "@/lib/inngest/functions"
import { invoiceReminder } from "@/lib/inngest/invoice-reminder"

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [helloWorld, invoiceReminder],
})
