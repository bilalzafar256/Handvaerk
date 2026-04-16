import { setRequestLocale, getTranslations } from "next-intl/server"
import { getDbUser } from "@/lib/auth"
import { CompanyProfileForm } from "@/components/forms/company-profile-form"
import { LogoUpload } from "@/components/forms/logo-upload"
import { Topbar } from "@/components/shared/topbar"
import { Building2, MapPin, Wrench } from "lucide-react"

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
  const user = await getDbUser()

  const addressLine = [user?.addressLine1, user?.addressZip, user?.addressCity]
    .filter(Boolean)
    .join(", ")

  return (
    <>
      <Topbar title={t("title")} />

      <div className="pt-14 pb-24">
        {/* Company header — logo + identity */}
        <div
          className="mx-4 mt-5 rounded-[--radius-lg] border overflow-hidden"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-sm)" }}
        >
          {/* Amber accent bar */}
          <div className="h-1.5" style={{ backgroundColor: "var(--primary)" }} />

          <div className="p-5 flex items-start gap-5">
            {/* Logo — large, prominent */}
            <div className="flex-shrink-0">
              <LogoUpload currentLogoUrl={user?.logoUrl} size="lg" />
            </div>

            {/* Company identity */}
            <div className="flex-1 min-w-0 pt-1">
              <p
                className="text-xl font-bold truncate"
                style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
              >
                {user?.companyName || t("noCompanyName")}
              </p>

              <div className="mt-2 space-y-1">
                {user?.cvrNumber && (
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--text-tertiary)" }} />
                    <p
                      className="text-sm"
                      style={{ fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}
                    >
                      CVR {user.cvrNumber}
                    </p>
                  </div>
                )}
                {addressLine && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--text-tertiary)" }} />
                    <p
                      className="text-sm truncate"
                      style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}
                    >
                      {addressLine}
                    </p>
                  </div>
                )}
                {user?.hourlyRate && (
                  <div className="flex items-center gap-2">
                    <Wrench className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--text-tertiary)" }} />
                    <p
                      className="text-sm"
                      style={{ fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}
                    >
                      {user.hourlyRate} kr./t
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Edit form */}
        <div
          className="mx-4 mt-4 rounded-[--radius-lg] border overflow-hidden"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-sm)" }}
        >
          <div
            className="px-5 py-3 border-b"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--background-subtle)" }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)" }}
            >
              {t("companyDetails")}
            </p>
          </div>
          <div className="p-5">
            <CompanyProfileForm
              initialValues={{
                companyName: user?.companyName ?? "",
                cvrNumber: user?.cvrNumber ?? "",
                addressLine1: user?.addressLine1 ?? "",
                addressCity: user?.addressCity ?? "",
                addressZip: user?.addressZip ?? "",
                hourlyRate: user?.hourlyRate?.toString() ?? "",
              }}
              twoColumn
            />
          </div>
        </div>
      </div>
    </>
  )
}
