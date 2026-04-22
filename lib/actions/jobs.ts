"use server"

import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { users, jobPhotos } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import {
  createJob,
  updateJob,
  softDeleteJob,
  countActiveJobs,
  countAllJobsEver,
  addJobPhoto,
  deleteJobPhoto,
} from "@/lib/db/queries/jobs"
import { TIER_LIMITS } from "@/lib/utils/tier"

const jobSchema = z.object({
  customerId:      z.string().uuid("Invalid customer"),
  title:           z.string().min(1, "Title is required"),
  description:     z.string().optional(),
  jobType:         z.enum(["service", "project", "recurring"]).default("service"),
  status:          z.enum(["new", "scheduled", "in_progress", "done", "invoiced", "paid"]).default("new"),
  priority:        z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  scheduledDate:   z.string().optional(),
  endDate:         z.string().optional(),
  estimatedHours:  z.string().optional(),
  locationAddress: z.string().optional(),
  locationZip:     z.string().optional(),
  locationCity:    z.string().optional(),
  tags:            z.string().optional(),
  notes:           z.string().optional(),
})

export type JobFormData = z.infer<typeof jobSchema>

async function getDbUser(clerkId: string) {
  return db.query.users.findFirst({ where: eq(users.clerkId, clerkId) })
}

async function applyRateLimit(clerkId: string) {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const { rateLimiter } = await import("@/lib/upstash")
    const { success } = await rateLimiter.limit(clerkId)
    if (!success) throw new Error("Rate limit exceeded. Try again in a moment.")
  }
}

async function applyStrictRateLimit(clerkId: string) {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const { strictRateLimiter } = await import("@/lib/upstash")
    const { success } = await strictRateLimiter.limit(clerkId)
    if (!success) throw new Error("Too many requests. Please wait before trying again.")
  }
}

export async function createJobAction(data: JobFormData) {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("Unauthorized")

  await applyRateLimit(clerkId)

  const validated = jobSchema.parse(data)

  const user = await getDbUser(clerkId)
  if (!user) throw new Error("User not found")

  // F-307: free tier gate
  if (user.tier === "free") {
    const activeCount = await countActiveJobs(user.id)
    if (activeCount >= TIER_LIMITS.free.activeJobs) {
      throw new Error(`Free tier is limited to ${TIER_LIMITS.free.activeJobs} active jobs.`)
    }
  }

  // Auto-generate job number (sequential per user)
  const total = await countAllJobsEver(user.id)
  const jobNumber = String(total + 1)

  const job = await createJob({
    userId:          user.id,
    customerId:      validated.customerId,
    jobNumber,
    title:           validated.title,
    description:     validated.description || null,
    jobType:         validated.jobType,
    status:          validated.status,
    priority:        validated.priority,
    scheduledDate:   validated.scheduledDate || null,
    endDate:         validated.endDate || null,
    estimatedHours:  validated.estimatedHours || null,
    locationAddress: validated.locationAddress || null,
    locationZip:     validated.locationZip || null,
    locationCity:    validated.locationCity || null,
    tags:            validated.tags || null,
    notes:           validated.notes || null,
  })

  revalidatePath("/jobs")
  return { id: job.id }
}

export async function updateJobAction(id: string, data: JobFormData) {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("Unauthorized")

  await applyRateLimit(clerkId)

  const validated = jobSchema.parse(data)

  const user = await getDbUser(clerkId)
  if (!user) throw new Error("User not found")

  await updateJob(id, user.id, {
    customerId:      validated.customerId,
    title:           validated.title,
    description:     validated.description || null,
    jobType:         validated.jobType,
    status:          validated.status,
    priority:        validated.priority,
    scheduledDate:   validated.scheduledDate || null,
    endDate:         validated.endDate || null,
    estimatedHours:  validated.estimatedHours || null,
    locationAddress: validated.locationAddress || null,
    locationZip:     validated.locationZip || null,
    locationCity:    validated.locationCity || null,
    tags:            validated.tags || null,
    notes:           validated.notes || null,
  })

  revalidatePath("/jobs")
  revalidatePath(`/jobs/${id}`)
}

export async function updateJobNotesAction(id: string, notes: string | null) {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("Unauthorized")

  await applyRateLimit(clerkId)

  const user = await getDbUser(clerkId)
  if (!user) throw new Error("User not found")

  await updateJob(id, user.id, { notes })
  revalidatePath(`/jobs/${id}`)
}

export async function updateJobStatusAction(id: string, status: string) {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("Unauthorized")

  await applyRateLimit(clerkId)

  const user = await getDbUser(clerkId)
  if (!user) throw new Error("User not found")

  const validStatuses = ["new", "scheduled", "in_progress", "done", "invoiced", "paid"]
  if (!validStatuses.includes(status)) throw new Error("Invalid status")

  const completedDate = status === "done" ? new Date().toISOString().split("T")[0] : undefined

  await updateJob(id, user.id, {
    status,
    ...(completedDate ? { completedDate } : {}),
  })

  revalidatePath(`/jobs/${id}`)
  revalidatePath("/jobs")
}

export async function deleteJobAction(id: string) {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("Unauthorized")

  await applyStrictRateLimit(clerkId)

  const user = await getDbUser(clerkId)
  if (!user) throw new Error("User not found")

  await softDeleteJob(id, user.id)

  revalidatePath("/jobs")
  redirect("/jobs")
}

export async function addJobPhotoAction(jobId: string, fileUrl: string, tag?: string | null) {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("Unauthorized")

  const user = await getDbUser(clerkId)
  if (!user) throw new Error("User not found")

  const photo = await addJobPhoto({ jobId, fileUrl, caption: null, tag: tag || null })
  revalidatePath(`/jobs/${jobId}`)
  return { id: photo.id }
}

export async function deleteJobPhotoAction(photoId: string, jobId: string) {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("Unauthorized")

  const photo = await db.query.jobPhotos.findFirst({
    where: and(eq(jobPhotos.id, photoId), eq(jobPhotos.jobId, jobId)),
  })

  await deleteJobPhoto(photoId, jobId)

  if (photo?.fileUrl) {
    const { del } = await import("@vercel/blob")
    await del(photo.fileUrl)
  }

  revalidatePath(`/jobs/${jobId}`)
}
