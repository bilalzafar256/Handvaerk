import { setRequestLocale } from "next-intl/server"
import { getTranslations } from "next-intl/server"
import { Topbar } from "@/components/shared/topbar"

export const dynamic = "force-dynamic"

type Props = { params: Promise<{ locale: string }> }

export default async function OverviewPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("Overview")

  return (
    <>
      <Topbar title={t("title")} />
      <div className="p-6">
        <p
          className="text-sm"
          style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}
        >
          {/* Dashboard widgets added in Phase 6 */}
        </p>
      </div>
    </>
  )
}
