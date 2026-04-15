import { setRequestLocale } from "next-intl/server"
import { getTranslations } from "next-intl/server"

export const dynamic = "force-dynamic"

type Props = { params: Promise<{ locale: string }> }

export default async function OverviewPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("Overview")

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
    </div>
  )
}
