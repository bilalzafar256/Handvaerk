import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { rateLimiter } from "@/lib/upstash"
import { extractBusinessCard } from "@/lib/ai/operations/extract-business-card"

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { success } = await rateLimiter.limit(userId)
  if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 })

  const body = await request.json()
  const { imageBase64, mimeType } = body as { imageBase64?: string; mimeType?: string }

  if (!imageBase64 || !mimeType) {
    return NextResponse.json({ error: "Missing image" }, { status: 400 })
  }

  const fields = await extractBusinessCard(imageBase64, mimeType)
  return NextResponse.json(fields)
}
