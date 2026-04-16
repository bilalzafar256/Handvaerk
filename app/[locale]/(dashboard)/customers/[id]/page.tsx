import { setRequestLocale, getTranslations } from "next-intl/server"
import { auth } from "@clerk/nextjs/server"
import { notFound, redirect } from "next/navigation"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getCustomerById } from "@/lib/db/queries/customers"
import { Topbar } from "@/components/shared/topbar"
import { DeleteCustomerButton } from "@/components/customers/customer-detail-actions"
import { Link } from "@/i18n/navigation"
import { ChevronLeft, Phone, Mail, MapPin, FileText, Building2, Pencil } from "lucide-react"

export const dynamic = "force-dynamic"

type Props = { params: Promise<{ locale: string; id: string }> }

export async function generateMetadata({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "CustomerDetail" })
  return { title: t("pageTitle") }
}

export default async function CustomerDetailPage({ params }: Props) {
  const { locale, id } = await params
  setRequestLocale(locale)

  const t = await getTranslations("CustomerDetail")

  const { userId: clerkId } = await auth()
  if (!clerkId) redirect("/sign-in")

  const user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) })
  if (!user) redirect("/sign-in")

  const customer = await getCustomerById(id, user.id)
  if (!customer) notFound()

  const addressLine = [customer.addressLine1, customer.addressZip, customer.addressCity]
    .filter(Boolean)
    .join(", ")

  return (
    <>
      <Topbar
        title={customer.name}
        action={
          <div className="flex items-center gap-2">
            <Link
              href={`/customers/${id}/edit`}
              className="flex items-center gap-1.5 h-9 px-3 rounded-[--radius-sm] text-sm font-medium border transition-colors duration-150"
              style={{
                borderColor: "var(--border)",
                color: "var(--text-primary)",
                fontFamily: "var(--font-body)",
                backgroundColor: "var(--surface)",
              }}
            >
              <Pencil className="w-4 h-4" />
              {t("editButton")}
            </Link>
            <DeleteCustomerButton customerId={id} />
          </div>
        }
      />

      <div className="pt-14 max-w-lg mx-auto px-4 pb-10">
        {/* Back link */}
        <div className="pt-4 pb-2">
          <Link
            href="/customers"
            className="inline-flex items-center gap-1 text-sm transition-colors duration-150"
            style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}
          >
            <ChevronLeft className="w-4 h-4" />
            Customers
          </Link>
        </div>

        {/* Avatar + name */}
        <div className="flex items-center gap-4 py-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0"
            style={{
              backgroundColor: "var(--accent-light)",
              color: "var(--accent)",
              fontFamily: "var(--font-display)",
            }}
          >
            {customer.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p
              className="text-xl font-bold"
              style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
            >
              {customer.name}
            </p>
            {customer.cvrNumber && (
              <p
                className="text-sm mt-0.5"
                style={{ fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}
              >
                CVR {customer.cvrNumber}
              </p>
            )}
          </div>
        </div>

        {/* Contact info */}
        <Section title={t("contactInfo")}>
          {customer.phone && (
            <InfoRow
              icon={Phone}
              label={customer.phone}
              action={
                // F-206: quick-dial
                <a
                  href={`tel:${customer.phone.replace(/\s/g, "")}`}
                  className="flex items-center gap-1.5 h-9 px-3 rounded-[--radius-sm] text-sm font-medium transition-colors duration-150"
                  style={{
                    backgroundColor: "var(--accent-light)",
                    color: "var(--accent)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  <Phone className="w-4 h-4" />
                  {t("callButton")}
                </a>
              }
            />
          )}
          {customer.email && (
            <InfoRow
              icon={Mail}
              label={customer.email}
              action={
                <a
                  href={`mailto:${customer.email}`}
                  className="h-9 px-3 rounded-[--radius-sm] text-sm font-medium transition-colors duration-150 flex items-center"
                  style={{
                    backgroundColor: "var(--accent-light)",
                    color: "var(--accent)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  Email
                </a>
              }
            />
          )}
          {!customer.phone && !customer.email && (
            <p className="text-sm py-2" style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}>
              No contact info
            </p>
          )}
        </Section>

        {/* Address */}
        {addressLine && (
          <Section title={t("addressSection")}>
            <InfoRow icon={MapPin} label={addressLine} />
          </Section>
        )}

        {/* Business */}
        {customer.cvrNumber && (
          <Section title={t("businessSection")}>
            <InfoRow
              icon={Building2}
              label={customer.cvrNumber}
              labelMono
              sublabel={t("cvrLabel")}
            />
          </Section>
        )}

        {/* Notes */}
        {customer.notes && (
          <Section title={t("notesSection")}>
            <div className="flex gap-3">
              <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "var(--text-tertiary)" }} />
              <p
                className="text-sm whitespace-pre-wrap"
                style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}
              >
                {customer.notes}
              </p>
            </div>
          </Section>
        )}
      </div>
    </>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="mt-4 rounded-[--radius-md] border overflow-hidden"
      style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
    >
      <div
        className="px-4 py-2 border-b"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--background-subtle)" }}
      >
        <p
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)" }}
        >
          {title}
        </p>
      </div>
      <div className="px-4 py-3 space-y-3">{children}</div>
    </div>
  )
}

function InfoRow({
  icon: Icon,
  label,
  sublabel,
  labelMono,
  action,
}: {
  icon: React.ElementType
  label: string
  sublabel?: string
  labelMono?: boolean
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <Icon className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-tertiary)" }} />
        <div className="min-w-0">
          {sublabel && (
            <p className="text-xs mb-0.5" style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}>
              {sublabel}
            </p>
          )}
          <p
            className="text-sm truncate"
            style={{
              fontFamily: labelMono ? "var(--font-mono)" : "var(--font-body)",
              color: "var(--text-primary)",
            }}
          >
            {label}
          </p>
        </div>
      </div>
      {action}
    </div>
  )
}
