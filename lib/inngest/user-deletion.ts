import { inngest } from "./client"
import { db } from "@/lib/db"
import { users, customers, jobs, quotes, invoices, jobPhotos, timeEntries } from "@/lib/db/schema"
import { eq, inArray } from "drizzle-orm"

export const hardDeleteUser = inngest.createFunction(
  {
    id: "hard-delete-user",
    triggers: [{ event: "user/deleted" }],
  },
  async ({
    event,
    step,
  }: {
    event: { data: { userId: string } }
    step: {
      sleep: (id: string, duration: string) => Promise<void>
      run: <T>(id: string, fn: () => Promise<T>) => Promise<T>
    }
  }) => {
    const { userId } = event.data

    await step.sleep("wait-30-days", "30d")

    await step.run("delete-blobs", async () => {
      const userJobs = await db.select({ id: jobs.id }).from(jobs).where(eq(jobs.userId, userId))
      const jobIds = userJobs.map(j => j.id)
      if (jobIds.length > 0) {
        const photos = await db
          .select({ fileUrl: jobPhotos.fileUrl })
          .from(jobPhotos)
          .where(inArray(jobPhotos.jobId, jobIds))
        if (photos.length > 0) {
          const { del } = await import("@vercel/blob")
          await del(photos.map(p => p.fileUrl))
        }
      }
    })

    await step.run("hard-delete-data", async () => {
      // Delete in FK dependency order (invoiceItems cascade from invoices automatically)
      await db.delete(timeEntries).where(eq(timeEntries.userId, userId))
      await db.delete(invoices).where(eq(invoices.userId, userId))
      await db.delete(quotes).where(eq(quotes.userId, userId))

      const userJobs = await db.select({ id: jobs.id }).from(jobs).where(eq(jobs.userId, userId))
      const jobIds = userJobs.map(j => j.id)
      if (jobIds.length > 0) {
        await db.delete(jobPhotos).where(inArray(jobPhotos.jobId, jobIds))
      }

      await db.delete(jobs).where(eq(jobs.userId, userId))
      await db.delete(customers).where(eq(customers.userId, userId))
      await db.delete(users).where(eq(users.id, userId))
    })
  }
)
