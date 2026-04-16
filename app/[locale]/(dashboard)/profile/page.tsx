import { setRequestLocale } from "next-intl/server"
import { getTranslations } from "next-intl/server"
import { getDbUser } from "@/lib/auth"
import { CompanyProfileForm } from "@/components/forms/company-profile-form"
import { LogoUpload } from "@/components/forms/logo-upload"
import { Topbar } from "@/components/shared/topbar"

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "Profile" })
  return { title: t("pageTitle") }
}

export default async function ProfilePage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations("Profile")
  const logoT = await getTranslations("ProfileSetup")
  const user = await getDbUser()

  return (
    <div>
      <Topbar title={t("title")} />

      <div className="px-4 py-6 flex flex-col gap-6 max-w-lg">
        {/* Logo section */}
        <section
          className="rounded-[--radius-lg] border p-5 flex flex-col gap-4"
          style={{
            backgroundColor: "var(--surface)",
            borderColor: "var(--border)",
            boxShadow: "var(--shadow-xs)",
          }}
        >
          <div>
            <p
              className="text-[15px] font-semibold"
              style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
            >
              {logoT("logoTitle")}
            </p>
            <p
              className="text-sm mt-0.5"
              style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}
            >
              {logoT("logoDescription")}
            </p>
          </div>
          <LogoUpload currentLogoUrl={user?.logoUrl} />
        </section>

        {/* Profile form section */}
        <section
          className="rounded-[--radius-lg] border p-5 flex flex-col gap-4"
          style={{
            backgroundColor: "var(--surface)",
            borderColor: "var(--border)",
            boxShadow: "var(--shadow-xs)",
          }}
        >
          <p
            className="text-[15px] font-semibold"
            style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
          >
            {t("companyDetails")}
          </p>
          <CompanyProfileForm
            initialValues={{
              companyName: user?.companyName ?? "",
              cvrNumber: user?.cvrNumber ?? "",
              addressLine1: user?.addressLine1 ?? "",
              addressCity: user?.addressCity ?? "",
              addressZip: user?.addressZip ?? "",
              hourlyRate: user?.hourlyRate?.toString() ?? "",
            }}
          />
        </section>
      </div>
    </div>
  )
}
