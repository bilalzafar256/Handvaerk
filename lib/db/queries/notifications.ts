import { db } from "@/lib/db"
import { notifications } from "@/lib/db/schema"
import { eq, and, desc, count } from "drizzle-orm"
import type { NewNotification } from "@/lib/db/schema/notifications"

export async function getNotificationsForUser(userId: string, limit = 30) {
  return db.query.notifications.findMany({
    where: eq(notifications.userId, userId),
    orderBy: [desc(notifications.createdAt)],
    limit,
  })
}

export async function getUnreadCount(userId: string): Promise<number> {
  const [row] = await db
    .select({ count: count() })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.read, false)))
  return row?.count ?? 0
}

export async function createNotification(data: Omit<NewNotification, "id" | "createdAt">) {
  const [row] = await db.insert(notifications).values(data).returning()
  return row
}

export async function markNotificationRead(id: string, userId: string) {
  await db
    .update(notifications)
    .set({ read: true, readAt: new Date() })
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
}

export async function markAllNotificationsRead(userId: string) {
  await db
    .update(notifications)
    .set({ read: true, readAt: new Date() })
    .where(and(eq(notifications.userId, userId), eq(notifications.read, false)))
}

export async function clearAllNotifications(userId: string) {
  await db.delete(notifications).where(eq(notifications.userId, userId))
}
