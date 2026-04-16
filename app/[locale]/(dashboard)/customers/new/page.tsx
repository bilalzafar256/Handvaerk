import { setRequestLocale, getTranslations } from "next-intl/server"
import { Topbar } from "@/components/shared/topbar"
import { CustomerForm } from "@/components/forms/customer-form"
import { Link } from "@/i18n/navigation"
import { ChevronLeft } from "lucide-react"

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "CustomerForm" })
  return { title: t("newTitle") + " | Håndværk Pro" }
}

export default async function NewCustomerPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations("CustomerForm")

  return (
    <>
      <Topbar
        title={t("newTitle")}
        action={
          <Link
            href="/customers"
            className="flex items-center gap-1 text-sm h-9 px-2 rounded-[--radius-sm] transition-colors duration-150"
            style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}
          >
            <ChevronLeft className="w-4 h-4" />
          </Link>
        }
      />
      <div className="pt-14 max-w-lg mx-auto">
        <div className="pt-6">
          <CustomerForm />
        </div>
      </div>
    </>
  )
}
