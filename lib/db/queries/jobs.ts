import { db } from "@/lib/db"
import { jobs, jobPhotos } from "@/lib/db/schema"
import { eq, and, isNull, ilike, or, desc, notInArray, count } from "drizzle-orm"
import type { NewJob, NewJobPhoto } from "@/lib/db/schema/jobs"

export async function getJobsByUser(userId: string, search?: string) {
  const baseWhere = and(eq(jobs.userId, userId), isNull(jobs.deletedAt))

  if (search && search.trim()) {
    const term = `%${search.trim()}%`
    return db.query.jobs.findMany({
      where: and(
        baseWhere,
        or(ilike(jobs.title, term), ilike(jobs.description, term))
      ),
      orderBy: [desc(jobs.createdAt)],
      with: { customer: true },
    })
  }

  return db.query.jobs.findMany({
    where: baseWhere,
    orderBy: [desc(jobs.createdAt)],
    with: { customer: true },
  })
}

export async function getJobsByCustomer(customerId: string, userId: string) {
  return db.query.jobs.findMany({
    where: and(eq(jobs.customerId, customerId), eq(jobs.userId, userId), isNull(jobs.deletedAt)),
    orderBy: [desc(jobs.createdAt)],
  })
}

export async function getJobById(id: string, userId: string) {
  return db.query.jobs.findFirst({
    where: and(eq(jobs.id, id), eq(jobs.userId, userId), isNull(jobs.deletedAt)),
    with: { customer: true, photos: true },
  })
}

export async function createJob(data: NewJob) {
  const [job] = await db.insert(jobs).values(data).returning()
  return job
}

export async function updateJob(
  id: string,
  userId: string,
  data: Partial<Omit<NewJob, "id" | "userId" | "createdAt">>
) {
  const [updated] = await db
    .update(jobs)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(jobs.id, id), eq(jobs.userId, userId)))
    .returning()
  return updated
}

export async function softDeleteJob(id: string, userId: string) {
  await db
    .update(jobs)
    .set({ deletedAt: new Date() })
    .where(and(eq(jobs.id, id), eq(jobs.userId, userId)))
}

// Count active jobs (not paid or invoiced) — used for free tier gate (F-307)
export async function countActiveJobs(userId: string) {
  const result = await db
    .select({ value: count() })
    .from(jobs)
    .where(
      and(
        eq(jobs.userId, userId),
        isNull(jobs.deletedAt),
        notInArray(jobs.status, ["paid", "invoiced"])
      )
    )
  return Number(result[0]?.value ?? 0)
}

// Count all-time jobs (for job number generation)
export async function countAllJobsEver(userId: string) {
  const result = await db
    .select({ value: count() })
    .from(jobs)
    .where(eq(jobs.userId, userId))
  return Number(result[0]?.value ?? 0)
}

export async function addJobPhoto(data: NewJobPhoto) {
  const [photo] = await db.insert(jobPhotos).values(data).returning()
  return photo
}

export async function deleteJobPhoto(id: string, jobId: string) {
  await db.delete(jobPhotos).where(and(eq(jobPhotos.id, id), eq(jobPhotos.jobId, jobId)))
}
