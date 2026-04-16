import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getMaterialsByUser } from "@/lib/db/queries/quotes"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q") ?? ""

  const materials = await getMaterialsByUser(user.id, q)
  return NextResponse.json(materials.slice(0, 10))
}
