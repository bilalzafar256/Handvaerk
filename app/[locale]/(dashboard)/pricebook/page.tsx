import { setRequestLocale } from "next-intl/server"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getPricebookItemsByUser } from "@/lib/db/queries/pricebook"
import { Topbar } from "@/components/shared/topbar"
import { PricebookList } from "@/components/pricebook/pricebook-list"

export const dynamic = "force-dynamic"

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata() {
  return { title: "Pricebook" }
}

export default async function PricebookPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  const { userId: clerkId } = await auth()
  if (!clerkId) redirect("/sign-in")

  const user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) })
  if (!user) redirect("/sign-in")

  const items = await getPricebookItemsByUser(user.id)

  return (
    <>
      <Topbar title="Pricebook" />
      <div>
        <PricebookList items={items} />
      </div>
    </>
  )
}
