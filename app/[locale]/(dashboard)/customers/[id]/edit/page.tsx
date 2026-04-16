import { setRequestLocale, getTranslations } from "next-intl/server"
import { auth } from "@clerk/nextjs/server"
import { notFound, redirect } from "next/navigation"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getCustomerById } from "@/lib/db/queries/customers"
import { Topbar } from "@/components/shared/topbar"
import { CustomerForm } from "@/components/forms/customer-form"
import { Link } from "@/i18n/navigation"
import { ChevronLeft } from "lucide-react"

export const dynamic = "force-dynamic"

type Props = { params: Promise<{ locale: string; id: string }> }

export async function generateMetadata({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "CustomerForm" })
  return { title: t("editTitle") + " | Håndværk Pro" }
}

export default async function EditCustomerPage({ params }: Props) {
  const { locale, id } = await params
  setRequestLocale(locale)

  const t = await getTranslations("CustomerForm")

  const { userId: clerkId } = await auth()
  if (!clerkId) redirect("/sign-in")

  const user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) })
  if (!user) redirect("/sign-in")

  const customer = await getCustomerById(id, user.id)
  if (!customer) notFound()

  return (
    <>
      <Topbar
        title={t("editTitle")}
        action={
          <Link
            href={`/customers/${id}`}
            className="flex items-center gap-1 h-9 px-2 rounded-[--radius-sm] transition-colors duration-150"
            style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}
          >
            <ChevronLeft className="w-4 h-4" />
          </Link>
        }
      />
      <div className="pt-14 max-w-lg mx-auto">
        <div className="pt-6">
          <CustomerForm customer={customer} />
        </div>
      </div>
    </>
  )
}
