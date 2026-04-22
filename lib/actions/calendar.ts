"use server"

import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import {
  getCalendarJobs,
  getCalendarInvoices,
  getCalendarQuotes,
  getUnscheduledJobs,
} from "@/lib/db/queries/calendar"

async function getDbUserId(clerkId: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
    columns: { id: true },
  })
  return user?.id
}

export async function getCalendarDataAction(from: string, to: string) {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("Unauthorized")

  const userId = await getDbUserId(clerkId)
  if (!userId) throw new Error("User not found")

  const [jobs, invoiceDueDates, quotesExpiring, unscheduledJobs] = await Promise.all([
    getCalendarJobs(userId, from, to),
    getCalendarInvoices(userId, from, to),
    getCalendarQuotes(userId, from, to),
    getUnscheduledJobs(userId),
  ])

  return { jobs, invoiceDueDates, quotesExpiring, unscheduledJobs }
}

export type CalendarData = Awaited<ReturnType<typeof getCalendarDataAction>>
export type CalendarJob = CalendarData["jobs"][number]
export type CalendarInvoice = CalendarData["invoiceDueDates"][number]
export type CalendarQuote = CalendarData["quotesExpiring"][number]
