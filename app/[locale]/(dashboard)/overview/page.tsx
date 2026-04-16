import { setRequestLocale } from "next-intl/server"
import { getTranslations } from "next-intl/server"
import { SignOutButton } from "@clerk/nextjs"

export const dynamic = "force-dynamic"

type Props = { params: Promise<{ locale: string }> }

export default async function OverviewPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("Overview")

  return (
    <div className="p-4 flex items-center justify-between">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <SignOutButton redirectUrl="/">
        <button
          className="h-9 px-4 rounded-[8px] text-[14px] font-medium border transition-colors"
          style={{
            fontFamily: "var(--font-body)",
            backgroundColor: "var(--surface)",
            color: "var(--workshop-600)",
            borderColor: "var(--workshop-200)",
          }}
        >
          {t("signOut")}
        </button>
      </SignOutButton>
    </div>
  )
}
