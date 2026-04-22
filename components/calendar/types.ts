export type RBCEvent = {
  id: string
  title: string
  start: Date
  end: Date
  allDay: boolean
  entityType: "job" | "invoice" | "quote"
  status: string
  customerName: string
  customerId: string
  entityId: string
  jobType?: string | null
  invoiceNumber?: string
  quoteNumber?: string
  totalInclVat?: string | null
}
