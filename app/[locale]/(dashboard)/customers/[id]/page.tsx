import { setRequestLocale, getTranslations } from "next-intl/server"
import { auth } from "@clerk/nextjs/server"
import { notFound, redirect } from "next/navigation"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getCustomerById } from "@/lib/db/queries/customers"
import { getJobsByCustomer } from "@/lib/db/queries/jobs"
import { getInvoicesByCustomer } from "@/lib/db/queries/invoices"
import { getQuotesByCustomer } from "@/lib/db/queries/quotes"
import { Topbar } from "@/components/shared/topbar"
import { DeleteCustomerButton, FavoriteCustomerButton } from "@/components/customers/customer-detail-actions"
import { Link } from "@/i18n/navigation"
import { formatDKK } from "@/lib/utils/currency"
import {
  ChevronLeft, Pencil, Phone, Mail, MapPin, Building2,
  FileText, Receipt, Briefcase, Plus, ChevronRight, ExternalLink, Globe, CreditCard, User,
} from "lucide-react"
import { StatusBadge } from "@/components/jobs/status-changer"

export const dynamic = "force-dynamic"

type Props = { params: Promise<{ locale: string; id: string }> }

export async function generateMetadata({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "CustomerDetail" })
  return { title: t("pageTitle") }
}

const SECTION_ACCENTS: Record<string, string> = {
  blue:   "oklch(0.55 0.15 240)",
  amber:  "var(--amber-500)",
  purple: "oklch(0.55 0.12 290)",
  green:  "oklch(0.52 0.14 145)",
}

export default async function CustomerDetailPage({ params }: Props) {
  const { locale, id } = await params
  setRequestLocale(locale)
  const t = await getTranslations("CustomerDetail")

  const { userId: clerkId } = await auth()
  if (!clerkId) redirect("/sign-in")

  const user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) })
  if (!user) redirect("/sign-in")

  const [customer, customerJobs, customerInvoices, customerQuotes] = await Promise.all([
    getCustomerById(id, user.id),
    getJobsByCustomer(id, user.id),
    getInvoicesByCustomer(id, user.id),
    getQuotesByCustomer(id, user.id),
  ])
  if (!customer) notFound()

  const addressLine = [customer.addressLine1, customer.addressZip, customer.addressCity]
    .filter(Boolean).join(", ")

  return (
    <>
      <Topbar
        title={customer.name}
        action={
          <div className="flex items-center gap-2">
            <FavoriteCustomerButton customerId={id} isFavorite={customer.isFavorite ?? false} />
            <Link
              href={`/customers/${id}/edit`}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-sm font-medium border bg-[var(--background)] hover:bg-[var(--accent)] transition-colors"
              style={{ borderColor: "var(--border)", color: "var(--foreground)", fontFamily: "var(--font-body)" }}
            >
              <Pencil className="w-3.5 h-3.5" />
              {t("editButton")}
            </Link>
            <DeleteCustomerButton customerId={id} />
          </div>
        }
      />

      <div className="pt-2 pb-8 overflow-x-hidden">
        <div className="px-4 lg:px-6">
          {/* Back */}
          <div className="pt-3 pb-2">
            <Link
              href="/customers"
              className="inline-flex items-center gap-1 text-sm transition-opacity hover:opacity-70"
              style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-body)" }}
            >
              <ChevronLeft className="w-4 h-4" />
              Customers
            </Link>
          </div>

          {/* Customer header */}
          <div className="pb-3 border-b flex items-center gap-4" style={{ borderColor: "var(--border)" }}>
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 text-xl font-bold"
              style={{ backgroundColor: "var(--amber-500)", color: "oklch(0.10 0.005 52)", fontFamily: "var(--font-display)" }}
            >
              {customer.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>
                {customer.name}
              </h1>
              {customer.cvrNumber && (
                <p className="text-sm mt-0.5" style={{ fontFamily: "var(--font-mono)", color: "var(--muted-foreground)" }}>
                  CVR {customer.cvrNumber}
                </p>
              )}
            </div>
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4 pt-4">

            {/* ── Left column ── */}
            <div className="space-y-4 min-w-0">

              {/* Contact info */}
              {(customer.contactPerson || customer.phone || customer.secondPhone || customer.email) && (
                <Card title={t("contactInfo")} accent="blue">
                  <div className="space-y-3">
                    {customer.contactPerson && (
                      <ContactRow icon={User} label={customer.contactPerson} sublabel={t("contactPersonLabel")} />
                    )}
                    {customer.phone && (
                      <ContactRow
                        icon={Phone}
                        label={customer.phone}
                        action={
                          <a
                            href={`tel:${customer.phone.replace(/\s/g, "")}`}
                            className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-xs font-medium bg-[var(--accent-light)] hover:bg-[var(--amber-200)] transition-colors"
                            style={{ color: "var(--primary)", fontFamily: "var(--font-body)" }}
                          >
                            <Phone className="w-3 h-3" />
                            {t("callButton")}
                          </a>
                        }
                      />
                    )}
                    {customer.secondPhone && (
                      <ContactRow
                        icon={Phone}
                        label={customer.secondPhone}
                        sublabel={t("secondPhoneLabel")}
                        action={
                          <a
                            href={`tel:${customer.secondPhone.replace(/\s/g, "")}`}
                            className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-xs font-medium bg-[var(--accent-light)] hover:bg-[var(--amber-200)] transition-colors"
                            style={{ color: "var(--primary)", fontFamily: "var(--font-body)" }}
                          >
                            <Phone className="w-3 h-3" />
                            {t("callButton")}
                          </a>
                        }
                      />
                    )}
                    {customer.email && (
                      <ContactRow
                        icon={Mail}
                        label={customer.email}
                        action={
                          <a
                            href={`mailto:${customer.email}`}
                            className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-xs font-medium bg-[var(--accent-light)] hover:bg-[var(--amber-200)] transition-colors"
                            style={{ color: "var(--primary)", fontFamily: "var(--font-body)" }}
                          >
                            <Mail className="w-3 h-3" />
                            Email
                          </a>
                        }
                      />
                    )}
                  </div>
                </Card>
              )}

              {/* Address */}
              {(addressLine || (customer.country && customer.country !== "DK")) && (
                <Card title={t("addressSection")} accent="green">
                  <div className="space-y-3">
                    {addressLine && (
                      <ContactRow
                        icon={MapPin}
                        label={addressLine}
                        action={
                          <a
                            href={`https://maps.google.com/?q=${encodeURIComponent(addressLine)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-xs font-medium bg-[var(--accent-light)] hover:bg-[var(--amber-200)] transition-colors"
                            style={{ color: "var(--primary)", fontFamily: "var(--font-body)" }}
                          >
                            <ExternalLink className="w-3 h-3" />
                            Maps
                          </a>
                        }
                      />
                    )}
                    {customer.country && customer.country !== "DK" && (
                      <ContactRow icon={Globe} label={customer.country} sublabel={t("countryLabel")} />
                    )}
                  </div>
                </Card>
              )}

              {/* Business / Billing */}
              {(customer.cvrNumber || customer.eanNumber || customer.vatExempt || customer.paymentTermsDays !== 14 || customer.preferredLanguage !== "da") && (
                <Card title={t("businessSection")} accent="purple">
                  <div className="space-y-3">
                    {customer.cvrNumber && (
                      <ContactRow icon={Building2} label={customer.cvrNumber} mono sublabel={t("cvrLabel")} />
                    )}
                    {customer.eanNumber && (
                      <ContactRow icon={Building2} label={customer.eanNumber} mono sublabel={t("eanLabel")} />
                    )}
                    {customer.vatExempt && (
                      <div className="flex items-center gap-2 rounded-md px-3 py-1.5"
                        style={{ backgroundColor: "oklch(0.96 0.03 155)", border: "1px solid oklch(0.80 0.09 155)" }}>
                        <span className="text-xs font-medium" style={{ color: "oklch(0.36 0.14 155)", fontFamily: "var(--font-body)" }}>
                          VAT-exempt customer
                        </span>
                      </div>
                    )}
                    <ContactRow
                      icon={CreditCard}
                      label={`Net ${customer.paymentTermsDays ?? 14}`}
                      sublabel={t("paymentTermsLabel")}
                    />
                    {customer.preferredLanguage && customer.preferredLanguage !== "da" && (
                      <ContactRow
                        icon={Globe}
                        label={customer.preferredLanguage === "en" ? "English" : customer.preferredLanguage}
                        sublabel={t("preferredLanguageLabel")}
                      />
                    )}
                  </div>
                </Card>
              )}

              {/* Notes */}
              {customer.notes && (
                <Card title={t("notesSection")} accent="amber">
                  <div className="flex gap-3">
                    <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "var(--muted-foreground)" }} />
                    <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}>
                      {customer.notes}
                    </p>
                  </div>
                </Card>
              )}
            </div>

            {/* ── Right column ── */}
            <div className="space-y-3 lg:sticky lg:top-16 self-start">

              {/* Quick actions */}
              <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}>
                <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider border-b" style={{ color: "var(--muted-foreground)", borderColor: "var(--border)", backgroundColor: "var(--muted)", fontFamily: "var(--font-body)" }}>
                  Quick actions
                </p>
                <div className="p-2 flex flex-col gap-1">
                  <Link
                    href={`/jobs/new?customerId=${id}`}
                    className="flex items-center gap-2.5 h-9 px-3 rounded-lg text-sm font-medium hover:bg-[var(--accent)] transition-colors"
                    style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}
                  >
                    <Briefcase className="w-4 h-4 flex-shrink-0" style={{ color: "var(--muted-foreground)" }} />
                    New job
                    <Plus className="w-3.5 h-3.5 ml-auto" style={{ color: "var(--muted-foreground)" }} />
                  </Link>
                  <Link
                    href={`/quotes/new?customerId=${id}`}
                    className="flex items-center gap-2.5 h-9 px-3 rounded-lg text-sm font-medium hover:bg-[var(--accent)] transition-colors"
                    style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}
                  >
                    <FileText className="w-4 h-4 flex-shrink-0" style={{ color: "var(--muted-foreground)" }} />
                    New quote
                    <Plus className="w-3.5 h-3.5 ml-auto" style={{ color: "var(--muted-foreground)" }} />
                  </Link>
                  <Link
                    href={`/invoices/new?customerId=${id}`}
                    className="flex items-center gap-2.5 h-9 px-3 rounded-lg text-sm font-medium hover:bg-[var(--accent)] transition-colors"
                    style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}
                  >
                    <Receipt className="w-4 h-4 flex-shrink-0" style={{ color: "var(--muted-foreground)" }} />
                    New invoice
                    <Plus className="w-3.5 h-3.5 ml-auto" style={{ color: "var(--muted-foreground)" }} />
                  </Link>
                </div>
              </div>

              {/* Jobs list */}
              <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}>
                <div className="px-3 py-2 border-b flex items-center justify-between" style={{ borderColor: "var(--border)", backgroundColor: "var(--muted)" }}>
                  <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ fontFamily: "var(--font-body)", color: "var(--muted-foreground)" }}>
                    Jobs{customerJobs.length > 0 ? ` (${customerJobs.length})` : ""}
                  </p>
                  <Link
                    href={`/jobs/new?customerId=${id}`}
                    className="flex items-center gap-1 text-[11px] font-medium px-2 h-6 rounded-md bg-[var(--accent-light)] hover:bg-[var(--amber-200)] transition-colors"
                    style={{ color: "var(--primary)", fontFamily: "var(--font-body)" }}
                  >
                    <Plus className="w-3 h-3" />
                    New job
                  </Link>
                </div>
                <div className="divide-y" style={{ ["--tw-divide-color" as string]: "var(--border)" }}>
                  {customerJobs.length === 0 ? (
                    <p className="px-3 py-3 text-sm" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-body)" }}>
                      No jobs yet
                    </p>
                  ) : (
                    customerJobs.map(job => (
                      <Link
                        key={job.id}
                        href={`/jobs/${job.id}`}
                        className="flex items-center gap-2 px-3 py-2.5 hover:bg-[var(--accent)] transition-colors"
                        style={{ fontFamily: "var(--font-body)" }}
                      >
                        <Briefcase className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--primary)" }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}>
                            {job.title}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <StatusBadge status={job.status as Parameters<typeof StatusBadge>[0]["status"]} />
                            <p className="text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--muted-foreground)" }}>
                              #{job.jobNumber}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--muted-foreground)" }} />
                      </Link>
                    ))
                  )}
                </div>
              </div>

              {/* Invoices list */}
              {(() => {
                const unpaidStatuses = ["sent", "viewed", "overdue"]
                const totalOutstanding = customerInvoices
                  .filter(inv => unpaidStatuses.includes(inv.status ?? ""))
                  .reduce((sum, inv) => sum + parseFloat(inv.totalInclVat ?? "0"), 0)
                const totalOverdue = customerInvoices
                  .filter(inv => inv.status === "overdue")
                  .reduce((sum, inv) => sum + parseFloat(inv.totalInclVat ?? "0"), 0)

                return (
                  <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}>
                    <div className="px-3 py-2 border-b flex items-center justify-between" style={{ borderColor: "var(--border)", backgroundColor: "var(--muted)" }}>
                      <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ fontFamily: "var(--font-body)", color: "var(--muted-foreground)" }}>
                        Invoices{customerInvoices.length > 0 ? ` (${customerInvoices.length})` : ""}
                      </p>
                      <Link
                        href={`/invoices/new?customerId=${id}`}
                        className="flex items-center gap-1 text-[11px] font-medium px-2 h-6 rounded-md bg-[var(--accent-light)] hover:bg-[var(--amber-200)] transition-colors"
                        style={{ color: "var(--primary)", fontFamily: "var(--font-body)" }}
                      >
                        <Plus className="w-3 h-3" />
                        New
                      </Link>
                    </div>

                    {/* Outstanding / overdue summary */}
                    {totalOutstanding > 0 && (
                      <div className="px-3 py-2.5 flex items-center justify-between gap-3 border-b" style={{ borderColor: "var(--border)", backgroundColor: totalOverdue > 0 ? "oklch(0.98 0.02 25)" : "var(--background)" }}>
                        <div>
                          <p className="text-[11px] font-medium uppercase tracking-wider" style={{ fontFamily: "var(--font-body)", color: "var(--muted-foreground)" }}>
                            Outstanding
                          </p>
                          <p className="text-base font-bold mt-0.5" style={{ fontFamily: "var(--font-mono)", color: "var(--foreground)" }}>
                            {formatDKK(totalOutstanding)}
                          </p>
                        </div>
                        {totalOverdue > 0 && (
                          <div className="text-right">
                            <p className="text-[11px] font-medium uppercase tracking-wider" style={{ fontFamily: "var(--font-body)", color: "oklch(0.44 0.22 25)" }}>
                              Overdue
                            </p>
                            <p className="text-base font-bold mt-0.5" style={{ fontFamily: "var(--font-mono)", color: "oklch(0.44 0.22 25)" }}>
                              {formatDKK(totalOverdue)}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="divide-y" style={{ ["--tw-divide-color" as string]: "var(--border)" }}>
                      {customerInvoices.length === 0 ? (
                        <p className="px-3 py-3 text-sm" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-body)" }}>
                          No invoices yet
                        </p>
                      ) : (
                        customerInvoices.map(inv => {
                          const isOverdue = inv.status === "overdue"
                          return (
                            <Link
                              key={inv.id}
                              href={`/invoices/${inv.id}/edit`}
                              className="flex items-center gap-2 px-3 py-2.5 hover:bg-[var(--accent)] transition-colors"
                              style={isOverdue ? { borderLeft: "3px solid oklch(0.60 0.22 25)", backgroundColor: "oklch(0.99 0.01 25)" } : {}}
                            >
                              <Receipt className="w-3.5 h-3.5 flex-shrink-0" style={{ color: isOverdue ? "oklch(0.60 0.22 25)" : "var(--primary)" }} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate" style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}>
                                  #{inv.invoiceNumber}
                                </p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <InvoiceStatusBadge status={inv.status ?? "draft"} />
                                  {inv.totalInclVat && (
                                    <p className="text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--muted-foreground)" }}>
                                      {formatDKK(inv.totalInclVat)}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--muted-foreground)" }} />
                            </Link>
                          )
                        })
                      )}
                    </div>
                  </div>
                )
              })()}

              {/* Quotes list */}
              <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}>
                <div className="px-3 py-2 border-b flex items-center justify-between" style={{ borderColor: "var(--border)", backgroundColor: "var(--muted)" }}>
                  <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ fontFamily: "var(--font-body)", color: "var(--muted-foreground)" }}>
                    Quotes{customerQuotes.length > 0 ? ` (${customerQuotes.length})` : ""}
                  </p>
                  <Link
                    href={`/quotes/new?customerId=${id}`}
                    className="flex items-center gap-1 text-[11px] font-medium px-2 h-6 rounded-md bg-[var(--accent-light)] hover:bg-[var(--amber-200)] transition-colors"
                    style={{ color: "var(--primary)", fontFamily: "var(--font-body)" }}
                  >
                    <Plus className="w-3 h-3" />
                    New
                  </Link>
                </div>
                <div className="divide-y" style={{ ["--tw-divide-color" as string]: "var(--border)" }}>
                  {customerQuotes.length === 0 ? (
                    <p className="px-3 py-3 text-sm" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-body)" }}>
                      No quotes yet
                    </p>
                  ) : (
                    customerQuotes.map(quote => (
                      <Link
                        key={quote.id}
                        href={`/quotes/${quote.id}/edit`}
                        className="flex items-center gap-2 px-3 py-2.5 hover:bg-[var(--accent)] transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--primary)" }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}>
                            #{quote.quoteNumber}
                          </p>
                          <div className="mt-0.5">
                            <QuoteStatusBadge status={quote.status ?? "draft"} />
                          </div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--muted-foreground)" }} />
                      </Link>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

/* ── Sub-components ── */

function Card({ title, children, accent = "blue" }: { title: string; children: React.ReactNode; accent?: keyof typeof SECTION_ACCENTS }) {
  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
      <div className="px-4 py-2.5 border-b flex items-center gap-2.5" style={{ borderColor: "var(--border)", backgroundColor: "var(--muted)" }}>
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: SECTION_ACCENTS[accent] }} />
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}>
          {title}
        </p>
      </div>
      <div className="px-4 py-3" style={{ backgroundColor: "var(--card)" }}>{children}</div>
    </div>
  )
}

function InvoiceStatusBadge({ status }: { status: string }) {
  const s = {
    paid:    { bg: "oklch(0.93 0.06 145)", color: "oklch(0.36 0.14 145)" },
    overdue: { bg: "oklch(0.95 0.06 25)",  color: "oklch(0.44 0.22 25)"  },
    sent:    { bg: "oklch(0.93 0.06 240)", color: "oklch(0.37 0.14 240)" },
    viewed:  { bg: "oklch(0.93 0.06 240)", color: "oklch(0.37 0.14 240)" },
    draft:   { bg: "var(--accent)",        color: "var(--muted-foreground)" },
  }[status] ?? { bg: "var(--accent)", color: "var(--muted-foreground)" }
  return (
    <span className="inline-flex items-center px-1.5 h-4 rounded-full text-[10px] font-medium capitalize"
      style={{ backgroundColor: s.bg, color: s.color, fontFamily: "var(--font-body)" }}>
      {status}
    </span>
  )
}

function QuoteStatusBadge({ status }: { status: string }) {
  const s = {
    accepted: { bg: "oklch(0.93 0.06 145)", color: "oklch(0.36 0.14 145)" },
    rejected: { bg: "oklch(0.95 0.06 25)",  color: "oklch(0.44 0.22 25)"  },
    sent:     { bg: "oklch(0.93 0.06 240)", color: "oklch(0.37 0.14 240)" },
    expired:  { bg: "oklch(0.95 0.07 45)",  color: "oklch(0.46 0.18 45)"  },
    draft:    { bg: "var(--accent)",         color: "var(--muted-foreground)" },
  }[status] ?? { bg: "var(--accent)", color: "var(--muted-foreground)" }
  return (
    <span className="inline-flex items-center px-1.5 h-4 rounded-full text-[10px] font-medium capitalize"
      style={{ backgroundColor: s.bg, color: s.color, fontFamily: "var(--font-body)" }}>
      {status}
    </span>
  )
}

function ContactRow({
  icon: Icon, label, sublabel, mono, action,
}: {
  icon: React.ElementType; label: string; sublabel?: string; mono?: boolean; action?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <Icon className="w-4 h-4 flex-shrink-0" style={{ color: "var(--muted-foreground)" }} />
        <div className="min-w-0">
          {sublabel && (
            <p className="text-[11px] uppercase tracking-wider mb-0.5" style={{ fontFamily: "var(--font-body)", color: "var(--muted-foreground)" }}>
              {sublabel}
            </p>
          )}
          <p className="text-sm truncate" style={{ fontFamily: mono ? "var(--font-mono)" : "var(--font-body)", color: "var(--foreground)" }}>
            {label}
          </p>
        </div>
      </div>
      {action}
    </div>
  )
}
