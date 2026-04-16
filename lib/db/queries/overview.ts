import { db } from "@/lib/db"
import { jobs, customers } from "@/lib/db/schema"
import { eq, and, isNull, notInArray, count, desc } from "drizzle-orm"

export async function getOverviewStats(userId: string) {
  const [
    customerCountResult,
    activeJobsResult,
    allJobCountsResult,
    recentJobsResult,
  ] = await Promise.all([
    // Total customers
    db
      .select({ value: count() })
      .from(customers)
      .where(and(eq(customers.userId, userId), isNull(customers.deletedAt))),

    // Active jobs (not paid/invoiced)
    db
      .select({ value: count() })
      .from(jobs)
      .where(
        and(
          eq(jobs.userId, userId),
          isNull(jobs.deletedAt),
          notInArray(jobs.status, ["paid", "invoiced"])
        )
      ),

    // Count jobs by status
    db
      .select({ status: jobs.status, value: count() })
      .from(jobs)
      .where(and(eq(jobs.userId, userId), isNull(jobs.deletedAt)))
      .groupBy(jobs.status),

    // 5 most recent jobs
    db.query.jobs.findMany({
      where: and(eq(jobs.userId, userId), isNull(jobs.deletedAt)),
      orderBy: [desc(jobs.createdAt)],
      limit: 5,
      with: { customer: true },
    }),
  ])

  const statusCounts = Object.fromEntries(
    allJobCountsResult.map((r) => [r.status, Number(r.value)])
  )

  return {
    customerCount: Number(customerCountResult[0]?.value ?? 0),
    activeJobCount: Number(activeJobsResult[0]?.value ?? 0),
    statusCounts: {
      new:         statusCounts["new"] ?? 0,
      scheduled:   statusCounts["scheduled"] ?? 0,
      in_progress: statusCounts["in_progress"] ?? 0,
      done:        statusCounts["done"] ?? 0,
      invoiced:    statusCounts["invoiced"] ?? 0,
      paid:        statusCounts["paid"] ?? 0,
    },
    recentJobs: recentJobsResult,
  }
}
