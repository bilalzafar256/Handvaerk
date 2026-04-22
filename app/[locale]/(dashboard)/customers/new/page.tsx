import { setRequestLocale, getTranslations } from "next-intl/server"
import { Topbar } from "@/components/shared/topbar"
import { NewCustomerEntry } from "@/components/customers/new-customer-entry"
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
            className="flex items-center gap-1 text-sm h-8 px-2 rounded-lg transition-colors hover:bg-[var(--accent)] cursor-pointer"
            style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-body)" }}
          >
            <ChevronLeft className="w-4 h-4" />
          </Link>
        }
      />
      <div className="pt-2">
        <NewCustomerEntry />
      </div>
    </>
  )
}
