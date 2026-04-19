import { z } from "zod"

export const extractedJobRecordSchema = z.object({
  customer: z.object({
    name: z.string(),
    phone: z.string().optional(),
    email: z.string().optional(),
    address: z.string().optional(),
  }),
  job: z.object({
    title: z.string(),
    description: z.string(),
    jobType: z.enum(["service", "project", "recurring"]),
    scheduledDate: z.string().optional(),
    notes: z.string(),
    materials: z.array(z.string()),
  }),
  quote: z.object({
    items: z.array(
      z.object({
        description: z.string(),
        qty: z.number(),
        unitPrice: z.number(),
        type: z.enum(["labour", "material", "fixed", "travel"]),
      })
    ),
    notes: z.string().optional(),
  }),
})

export type ExtractedJobRecord = z.infer<typeof extractedJobRecordSchema>
