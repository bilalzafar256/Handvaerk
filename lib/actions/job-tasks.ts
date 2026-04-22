"use server"

import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { users, jobTasks } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"

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

export async function createJobTaskAction(jobId: string, text: string) {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("Unauthorized")

  await applyRateLimit(clerkId)

  const validated = z.string().min(1).parse(text.trim())

  const user = await getDbUser(clerkId)
  if (!user) throw new Error("User not found")

  const [task] = await db
    .insert(jobTasks)
    .values({ jobId, userId: user.id, text: validated })
    .returning()

  revalidatePath(`/jobs/${jobId}`)
  return { id: task.id }
}

export async function updateJobTaskAction(
  taskId: string,
  jobId: string,
  data: { text?: string; isCompleted?: boolean }
) {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("Unauthorized")

  await applyRateLimit(clerkId)

  const user = await getDbUser(clerkId)
  if (!user) throw new Error("User not found")

  await db
    .update(jobTasks)
    .set(data)
    .where(and(eq(jobTasks.id, taskId), eq(jobTasks.userId, user.id)))

  revalidatePath(`/jobs/${jobId}`)
}

export async function deleteJobTaskAction(taskId: string, jobId: string) {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("Unauthorized")

  await applyRateLimit(clerkId)

  const user = await getDbUser(clerkId)
  if (!user) throw new Error("User not found")

  await db
    .delete(jobTasks)
    .where(and(eq(jobTasks.id, taskId), eq(jobTasks.userId, user.id)))

  revalidatePath(`/jobs/${jobId}`)
}
