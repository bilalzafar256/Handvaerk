import { setRequestLocale, getTranslations } from "next-intl/server"
import { auth } from "@clerk/nextjs/server"
import { notFound, redirect } from "next/navigation"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getJobById } from "@/lib/db/queries/jobs"
import { getQuotesByJob } from "@/lib/db/queries/quotes"
import { getInvoicesByJob } from "@/lib/db/queries/invoices"
import { getEntriesByJob, getActiveEntry, getBillingStatusForJob } from "@/lib/db/queries/time-entries"
import { TimeLogPanel } from "@/components/time-tracking/time-log-panel"
import { formatDKK } from "@/lib/utils/currency"
import { Topbar } from "@/components/shared/topbar"
import { StatusChanger } from "@/components/jobs/status-changer"
import { DeleteJobButton } from "@/components/jobs/job-detail-actions"
import { PhotoUpload } from "@/components/jobs/photo-upload"
import { InlineNotes } from "@/components/jobs/inline-notes"
import { Link } from "@/i18n/navigation"
import {
  ChevronLeft, Pencil, User, Calendar, CalendarCheck,
  FileText, Receipt, Plus, ChevronRight, Phone, Mail,
} from "lucide-react"

export const dynamic = "force-dynamic"

type Props = { params: Promise<{ locale: string; id: string }> }

export async function generateMetadata({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "JobDetail" })
  return { title: t("pageTitle") }
}

const JOB_TYPE_KEYS: Record<string, "jobTypeService" | "jobTypeProject" | "jobTypeRecurring"> = {
  service:   "jobTypeService",
  project:   "jobTypeProject",
  recurring: "jobTypeRecurring",
}

export default async function JobDetailPage({ params }: Props) {
  const { locale, id } = await params
  setRequestLocale(locale)
  const t = await getTranslations("JobDetail")

  const { userId: clerkId } = await auth()
  if (!clerkId) redirect("/sign-in")

  const user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) })
  if (!user) redirect("/sign-in")

  const [job, jobQuotes, jobInvoices, timeEntries, activeEntry, billingStatus] = await Promise.all([
    getJobById(id, user.id),
    getQuotesByJob(id, user.id),
    getInvoicesByJob(id, user.id),
    getEntriesByJob(id, user.id),
    getActiveEntry(user.id),
    getBillingStatusForJob(id, user.id),
  ])
  if (!job) notFound()

  return (
    <>
      <Topbar
        title={`#${job.jobNumber}`}
        action={
          <div className="flex items-center gap-2">
            <Link
              href={`/jobs/${id}/edit`}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-sm font-medium border bg-[var(--background)] hover:bg-[var(--accent)] transition-colors"
              style={{ borderColor: "var(--border)", color: "var(--foreground)", fontFamily: "var(--font-body)" }}
            >
              <Pencil className="w-3.5 h-3.5" />
              {t("editButton")}
            </Link>
            <DeleteJobButton jobId={id} />
          </div>
        }
      />

      <div className="pt-2 pb-8 overflow-x-hidden">
        <div className="px-4 lg:px-6">
          {/* Back */}
          <div className="pt-3 pb-2">
            <Link
              href="/jobs"
              className="inline-flex items-center gap-1 text-sm transition-opacity hover:opacity-70"
              style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-body)" }}
            >
              <ChevronLeft className="w-4 h-4" />
              {t("backToJobs")}
            </Link>
          </div>

          {/* Job header */}
          <div className="pb-3 border-b" style={{ borderColor: "var(--border)" }}>
            <h1 className="text-xl font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>
              {job.title}
            </h1>
            <p className="text-sm mt-0.5" style={{ fontFamily: "var(--font-mono)", color: "var(--muted-foreground)" }}>
              #{job.jobNumber} · {t(JOB_TYPE_KEYS[job.jobType ?? "service"])}
            </p>
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4 pt-4">

            {/* ── Left column: content ── */}
            <div className="space-y-4 min-w-0">

              {/* Description */}
              {job.description && (
                <Card title={t("descriptionSection")} accent="blue">
                  <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}>
                    {job.description}
                  </p>
                </Card>
              )}

              {/* Dates */}
              {(job.scheduledDate || job.endDate || job.completedDate) && (
                <Card title={t("datesSection")} accent="amber">
                  <div className="space-y-3">
                    {job.scheduledDate && (
                      <DateRow icon={Calendar} label={t("scheduledDateLabel")}
                        value={new Date(job.scheduledDate).toLocaleDateString("da-DK", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                      />
                    )}
                    {job.endDate && (
                      <DateRow icon={Calendar} label={t("endDateLabel")}
                        value={new Date(job.endDate).toLocaleDateString("da-DK", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                      />
                    )}
                    {job.completedDate && (
                      <DateRow icon={CalendarCheck} label={t("completedDateLabel")}
                        value={new Date(job.completedDate).toLocaleDateString("da-DK", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                      />
                    )}
                  </div>
                </Card>
              )}

              {/* Notes — inline editable */}
              <Card title={t("notesSection")} accent="purple">
                <InlineNotes jobId={job.id} initialNotes={job.notes} />
              </Card>

              {/* Photos */}
              <Card title={t("photosSection")} accent="green">
                <PhotoUpload jobId={job.id} photos={job.photos} />
              </Card>

              {/* Time tracking */}
              <TimeLogPanel
                jobId={job.id}
                entries={timeEntries}
                activeEntry={activeEntry ?? null}
                isThisJobActive={activeEntry?.jobId === job.id}
                quotes={jobQuotes}
                invoices={jobInvoices}
                billingStatus={billingStatus}
                hourlyRate={user.hourlyRate}
              />
            </div>

            {/* ── Right column: command panel ── */}
            <div className="space-y-3 lg:sticky lg:top-16 self-start">

              {/* Status stepper */}
              <div className="rounded-xl border p-4" style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}>
                <StatusChanger
                  jobId={job.id}
                  currentStatus={job.status as Parameters<typeof StatusChanger>[0]["currentStatus"]}
                />
              </div>

              {/* Quick actions */}
              <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}>
                <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider border-b" style={{ color: "var(--muted-foreground)", borderColor: "var(--border)", fontFamily: "var(--font-body)" }}>
                  {t("quickActions")}
                </p>
                <div className="p-2 flex flex-col gap-1">
                  <Link
                    href={`/quotes/new?jobId=${job.id}&customerId=${job.customer.id}`}
                    className="flex items-center gap-2.5 h-9 px-3 rounded-lg text-sm font-medium hover:bg-[var(--accent)] transition-colors"
                    style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}
                  >
                    <FileText className="w-4 h-4 flex-shrink-0" style={{ color: "var(--muted-foreground)" }} />
                    {t("newQuote")}
                    <Plus className="w-3.5 h-3.5 ml-auto" style={{ color: "var(--muted-foreground)" }} />
                  </Link>
                  <Link
                    href={`/invoices/new?jobId=${job.id}&customerId=${job.customer.id}`}
                    className="flex items-center gap-2.5 h-9 px-3 rounded-lg text-sm font-medium hover:bg-[var(--accent)] transition-colors"
                    style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}
                  >
                    <Receipt className="w-4 h-4 flex-shrink-0" style={{ color: "var(--muted-foreground)" }} />
                    {t("newInvoice")}
                    <Plus className="w-3.5 h-3.5 ml-auto" style={{ color: "var(--muted-foreground)" }} />
                  </Link>
                </div>
              </div>

              {/* Customer card */}
              <Link
                href={`/customers/${job.customer.id}`}
                className="flex items-center gap-3 rounded-xl border p-3 bg-[var(--card)] hover:bg-[var(--accent)] transition-colors group"
                style={{ borderColor: "var(--border)" }}
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-[15px] font-bold"
                  style={{ backgroundColor: "var(--amber-500)", color: "oklch(0.10 0.005 52)", fontFamily: "var(--font-display)" }}>
                  {job.customer.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}>
                    {job.customer.name}
                  </p>
                  {job.customer.phone && (
                    <p className="text-xs truncate" style={{ fontFamily: "var(--font-body)", color: "var(--muted-foreground)" }}>
                      {job.customer.phone}
                    </p>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: "var(--muted-foreground)" }} />
              </Link>

              {/* Quotes */}
              <RelatedDocs
                title={`${t("quotesSection")}${jobQuotes.length > 0 ? ` (${jobQuotes.length})` : ""}`}
                newHref={`/quotes/new?jobId=${job.id}&customerId=${job.customer.id}`}
                newLabel={t("newQuote")}
                empty={t("noQuotes")}
                items={jobQuotes.map(q => {
                  const subtotal = q.items.reduce((s: number, item) => {
                    const qty = parseFloat(item.quantity ?? "1")
                    const price = parseFloat(item.unitPrice ?? "0")
                    const markup = 1 + parseFloat(item.markupPercent ?? "0") / 100
                    return s + qty * price * markup
                  }, 0)
                  return { id: q.id, href: `/quotes/${q.id}`, number: q.quoteNumber, status: q.status ?? "draft", amount: subtotal }
                })}
                icon={FileText}
              />

              {/* Invoices */}
              <RelatedDocs
                title={`${t("invoicesSection")}${jobInvoices.length > 0 ? ` (${jobInvoices.length})` : ""}`}
                newHref={`/invoices/new?jobId=${job.id}&customerId=${job.customer.id}`}
                newLabel={t("newInvoice")}
                empty={t("noInvoices")}
                items={jobInvoices.map(inv => ({
                  id: inv.id,
                  href: `/invoices/${inv.id}`,
                  number: inv.invoiceNumber,
                  status: inv.status ?? "draft",
                  amount: parseFloat(inv.totalInclVat ?? "0"),
                }))}
                icon={Receipt}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

/* ── Sub-components ── */

const CARD_ACCENTS: Record<string, string> = {
  blue:   "oklch(0.55 0.15 240)",
  amber:  "var(--amber-500)",
  purple: "oklch(0.55 0.12 290)",
  green:  "oklch(0.52 0.14 145)",
}

function Card({ title, children, accent = "blue" }: { title: string; children: React.ReactNode; accent?: keyof typeof CARD_ACCENTS }) {
  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
      <div className="px-4 py-2.5 border-b flex items-center gap-2.5" style={{ borderColor: "var(--border)", backgroundColor: "var(--muted)" }}>
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: CARD_ACCENTS[accent] }} />
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}>
          {title}
        </p>
      </div>
      <div className="px-4 py-3" style={{ backgroundColor: "var(--card)" }}>{children}</div>
    </div>
  )
}

function DateRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "var(--muted-foreground)" }} />
      <div>
        <p className="text-[11px] uppercase tracking-wider mb-0.5" style={{ fontFamily: "var(--font-body)", color: "var(--muted-foreground)" }}>{label}</p>
        <p className="text-sm" style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}>{value}</p>
      </div>
    </div>
  )
}

function RelatedDocs({
  title, newHref, newLabel, empty, items, icon: DocIcon,
}: {
  title: string
  newHref: string
  newLabel: string
  empty: string
  items: Array<{ id: string; href: string; number: string; status: string; amount: number }>
  icon: React.ElementType
}) {
  return (
    <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}>
      <div className="px-3 py-2 border-b flex items-center justify-between" style={{ borderColor: "var(--border)", backgroundColor: "var(--muted)" }}>
        <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ fontFamily: "var(--font-body)", color: "var(--muted-foreground)" }}>
          {title}
        </p>
        <Link
          href={newHref}
          className="flex items-center gap-1 text-[11px] font-medium px-2 h-6 rounded-md transition-colors bg-[var(--accent-light)] hover:bg-[var(--amber-200)]"
          style={{ color: "var(--primary)", fontFamily: "var(--font-body)" }}
        >
          <Plus className="w-3 h-3" />
          {newLabel}
        </Link>
      </div>
      <div className="divide-y" style={{ ["--tw-divide-color" as string]: "var(--border)" }}>
        {items.length === 0 ? (
          <p className="px-3 py-3 text-sm" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-body)" }}>{empty}</p>
        ) : (
          items.map(item => (
            <Link
              key={item.id}
              href={item.href}
              className="flex items-center gap-2 px-3 py-2.5 hover:bg-[var(--accent)] transition-colors"
              style={{ fontFamily: "var(--font-body)" }}
            >
              <DocIcon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--primary)" }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium" style={{ fontFamily: "var(--font-mono)", color: "var(--foreground)" }}>{item.number}</p>
                <p className="text-xs capitalize" style={{ color: "var(--muted-foreground)" }}>{item.status}</p>
              </div>
              <span className="text-xs font-semibold flex-shrink-0" style={{ fontFamily: "var(--font-mono)", color: "var(--foreground)" }}>
                {formatDKK(item.amount)}
              </span>
              <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--muted-foreground)" }} />
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
