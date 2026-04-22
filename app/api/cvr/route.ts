import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { rateLimiter } from "@/lib/upstash"

export async function GET(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { success } = await rateLimiter.limit(userId)
  if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 })

  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q")?.trim() ?? ""
  if (q.length < 2) return NextResponse.json(null)

  const res = await fetch(
    `https://cvrapi.dk/api?search=${encodeURIComponent(q)}&country=dk`,
    {
      headers: { "User-Agent": "Haandvaerk-Pro/1.0 (haandvaerk.pro)" },
      next: { revalidate: 300 },
    }
  )

  if (!res.ok) return NextResponse.json(null)

  const data = await res.json()
  if (!data || data.error) return NextResponse.json(null)

  return NextResponse.json({
    name:        data.name ?? "",
    cvr:         String(data.vat ?? ""),
    address:     data.address ?? "",
    zip:         data.zipcode ?? "",
    city:        data.city ?? "",
    companyType: data.type ?? "",
  })
}
