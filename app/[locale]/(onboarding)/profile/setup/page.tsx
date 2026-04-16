import { setRequestLocale } from "next-intl/server"
import { getTranslations } from "next-intl/server"
import { getDbUser } from "@/lib/auth"
import { CompanyProfileForm } from "@/components/forms/company-profile-form"

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "ProfileSetup" })
  return { title: t("pageTitle") }
}

export default async function ProfileSetupPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations("ProfileSetup")
  const user = await getDbUser()

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1
          className="text-[28px] font-bold leading-tight"
          style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
        >
          {t("title")}
        </h1>
        <p
          className="text-base"
          style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}
        >
          {t("subtitle")}
        </p>
      </div>

      {/* Form card */}
      <div
        className="rounded-[--radius-lg] border p-6"
        style={{
          backgroundColor: "var(--surface)",
          borderColor: "var(--border)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <CompanyProfileForm
          initialValues={{
            companyName: user?.companyName ?? "",
            cvrNumber: user?.cvrNumber ?? "",
          }}
          compact
          redirectTo="/overview"
        />
      </div>
    </div>
  )
}
