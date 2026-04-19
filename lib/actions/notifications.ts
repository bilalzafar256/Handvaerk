"use server"

import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import {
  getNotificationsForUser,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  clearAllNotifications,
} from "@/lib/db/queries/notifications"

async function getUser() {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error("Unauthorized")
  const user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) })
  if (!user) throw new Error("User not found")
  return user
}

export async function getNotificationsAction() {
  const user = await getUser()
  const [items, unreadCount] = await Promise.all([
    getNotificationsForUser(user.id),
    getUnreadCount(user.id),
  ])
  return { items, unreadCount }
}

export async function markNotificationReadAction(id: string) {
  const user = await getUser()
  await markNotificationRead(id, user.id)
}

export async function markAllNotificationsReadAction() {
  const user = await getUser()
  await markAllNotificationsRead(user.id)
}

export async function clearAllNotificationsAction() {
  const user = await getUser()
  await clearAllNotifications(user.id)
}
