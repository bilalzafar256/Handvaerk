import { setRequestLocale, getTranslations } from "next-intl/server"
import { auth } from "@clerk/nextjs/server"
import { notFound, redirect } from "next/navigation"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getJobById } from "@/lib/db/queries/jobs"
import { getQuotesByJob } from "@/lib/db/queries/quotes"
import { getInvoicesByJob } from "@/lib/db/queries/invoices"
import { formatDKK } from "@/lib/utils/currency"
import { Topbar } from "@/components/shared/topbar"
import { StatusChanger } from "@/components/jobs/status-changer"
import { DeleteJobButton } from "@/components/jobs/job-detail-actions"
import { PhotoUpload } from "@/components/jobs/photo-upload"
import { Link } from "@/i18n/navigation"
import {
  ChevronLeft,
  Pencil,
  User,
  Calendar,
  CalendarCheck,
  FileText,
  Tag,
  Image,
  Receipt,
  Plus,
  ChevronRight,
} from "lucide-react"

export const dynamic = "force-dynamic"

type Props = { params: Promise<{ locale: string; id: string }> }

export async function generateMetadata({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "JobDetail" })
  return { title: t("pageTitle") }
}

const JOB_TYPE_LABELS: Record<string, string> = {
  service:   "Service",
  project:   "Project",
  recurring: "Recurring",
}

export default async function JobDetailPage({ params }: Props) {
  const { locale, id } = await params
  setRequestLocale(locale)

  const t = await getTranslations("JobDetail")

  const { userId: clerkId } = await auth()
  if (!clerkId) redirect("/sign-in")

  const user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) })
  if (!user) redirect("/sign-in")

  const [job, jobQuotes, jobInvoices] = await Promise.all([
    getJobById(id, user.id),
    getQuotesByJob(id, user.id),
    getInvoicesByJob(id, user.id),
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
            <DeleteJobButton jobId={id} />
          </div>
        }
      />

      <div className="pt-14 px-4 pb-10">
        {/* Back link */}
        <div className="pt-4 pb-2">
          <Link
            href="/jobs"
            className="inline-flex items-center gap-1 text-sm transition-colors duration-150"
            style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}
          >
            <ChevronLeft className="w-4 h-4" />
            {t("backToJobs")}
          </Link>
        </div>

        {/* Title + job type */}
        <div className="py-4">
          <p
            className="text-xl font-bold"
            style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
          >
            {job.title}
          </p>
          <p
            className="text-sm mt-0.5"
            style={{ fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}
          >
            #{job.jobNumber} · {JOB_TYPE_LABELS[job.jobType ?? "service"]}
          </p>
        </div>

        {/* Status changer (F-304) */}
        <div
          className="rounded-[--radius-md] border p-4 mb-4"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
        >
          <StatusChanger
            jobId={job.id}
            currentStatus={job.status as Parameters<typeof StatusChanger>[0]["currentStatus"]}
          />
        </div>

        {/* Customer */}
        <Section title={t("customerSection")}>
          <InfoRow
            icon={User}
            label={job.customer.name}
            href={`/customers/${job.customer.id}`}
          />
        </Section>

        {/* Description */}
        {job.description && (
          <Section title={t("descriptionSection")}>
            <div className="flex gap-3">
              <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "var(--text-tertiary)" }} />
              <p
                className="text-sm whitespace-pre-wrap"
                style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}
              >
                {job.description}
              </p>
            </div>
          </Section>
        )}

        {/* Dates */}
        {(job.scheduledDate || job.endDate || job.completedDate) && (
          <Section title={t("datesSection")}>
            {job.scheduledDate && (
              <InfoRow
                icon={Calendar}
                label={new Date(job.scheduledDate).toLocaleDateString("en-DK", {
                  weekday: "long", day: "numeric", month: "long", year: "numeric",
                })}
                sublabel={t("scheduledDateLabel")}
              />
            )}
            {job.endDate && (
              <InfoRow
                icon={Calendar}
                label={new Date(job.endDate).toLocaleDateString("en-DK", {
                  weekday: "long", day: "numeric", month: "long", year: "numeric",
                })}
                sublabel={t("endDateLabel")}
              />
            )}
            {job.completedDate && (
              <InfoRow
                icon={CalendarCheck}
                label={new Date(job.completedDate).toLocaleDateString("en-DK", {
                  weekday: "long", day: "numeric", month: "long", year: "numeric",
                })}
                sublabel={t("completedDateLabel")}
              />
            )}
          </Section>
        )}

        {/* Job type */}
        <Section title={t("detailsSection")}>
          <InfoRow
            icon={Tag}
            label={JOB_TYPE_LABELS[job.jobType ?? "service"]}
            sublabel={t("jobTypeLabel")}
          />
        </Section>

        {/* Notes (F-305) */}
        {job.notes && (
          <Section title={t("notesSection")}>
            <div className="flex gap-3">
              <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "var(--text-tertiary)" }} />
              <p
                className="text-sm whitespace-pre-wrap"
                style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}
              >
                {job.notes}
              </p>
            </div>
          </Section>
        )}

        {/* Photos (F-306) */}
        <Section title={t("photosSection")} icon={Image}>
          <PhotoUpload jobId={job.id} photos={job.photos} />
        </Section>

        {/* Quotes */}
        <div
          className="mt-4 rounded-[--radius-md] border overflow-hidden"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div
            className="px-4 py-2 border-b flex items-center justify-between"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--background-subtle)" }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)" }}>
              Quotes {jobQuotes.length > 0 && `(${jobQuotes.length})`}
            </p>
            <Link
              href={`/quotes/new?jobId=${job.id}&customerId=${job.customer.id}`}
              className="flex items-center gap-1 text-xs font-medium h-7 px-2 rounded-[--radius-sm] transition-colors duration-150"
              style={{ backgroundColor: "var(--accent-light)", color: "var(--primary)", fontFamily: "var(--font-body)" }}
            >
              <Plus className="w-3.5 h-3.5" />
              New quote
            </Link>
          </div>
          <div className="px-4 py-3">
            {jobQuotes.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}>No quotes yet</p>
            ) : (
              <ul className="space-y-2">
                {jobQuotes.map(q => {
                  const subtotal = q.items.reduce((s: number, item) => {
                    const qty = parseFloat(item.quantity ?? "1")
                    const price = parseFloat(item.unitPrice ?? "0")
                    const markup = 1 + parseFloat(item.markupPercent ?? "0") / 100
                    return s + qty * price * markup
                  }, 0)
                  return (
                    <li key={q.id}>
                      <Link
                        href={`/quotes/${q.id}`}
                        className="flex items-center gap-3 py-2 transition-colors duration-150 hover:opacity-80"
                      >
                        <FileText className="w-4 h-4 flex-shrink-0" style={{ color: "var(--primary)" }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium" style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>{q.quoteNumber}</p>
                          <p className="text-xs" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>{q.status}</p>
                        </div>
                        <span className="text-xs font-semibold" style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
                          {formatDKK(subtotal)}
                        </span>
                        <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-tertiary)" }} />
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Invoices */}
        <div
          className="mt-4 rounded-[--radius-md] border overflow-hidden"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div
            className="px-4 py-2 border-b flex items-center justify-between"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--background-subtle)" }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)" }}>
              Invoices {jobInvoices.length > 0 && `(${jobInvoices.length})`}
            </p>
            <Link
              href={`/invoices/new?jobId=${job.id}&customerId=${job.customer.id}`}
              className="flex items-center gap-1 text-xs font-medium h-7 px-2 rounded-[--radius-sm] transition-colors duration-150"
              style={{ backgroundColor: "var(--accent-light)", color: "var(--primary)", fontFamily: "var(--font-body)" }}
            >
              <Plus className="w-3.5 h-3.5" />
              New invoice
            </Link>
          </div>
          <div className="px-4 py-3">
            {jobInvoices.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}>No invoices yet</p>
            ) : (
              <ul className="space-y-2">
                {jobInvoices.map(inv => (
                  <li key={inv.id}>
                    <Link
                      href={`/invoices/${inv.id}`}
                      className="flex items-center gap-3 py-2 transition-colors duration-150 hover:opacity-80"
                    >
                      <Receipt className="w-4 h-4 flex-shrink-0" style={{ color: "var(--primary)" }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium" style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>{inv.invoiceNumber}</p>
                        <p className="text-xs" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>{inv.status}</p>
                      </div>
                      <span className="text-xs font-semibold" style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
                        {formatDKK(parseFloat(inv.totalInclVat ?? "0"))}
                      </span>
                      <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-tertiary)" }} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

function Section({
  title,
  children,
  icon: _Icon,
}: {
  title: string
  children: React.ReactNode
  icon?: React.ElementType
}) {
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
  href,
}: {
  icon: React.ElementType
  label: string
  sublabel?: string
  href?: string
}) {
  const content = (
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
          style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}
        >
          {label}
        </p>
      </div>
    </div>
  )

  if (href) {
    return (
      <Link
        href={href}
        className="flex items-center gap-3 transition-colors duration-150 hover:opacity-80"
      >
        {content}
        <ChevronLeft className="w-4 h-4 rotate-180 flex-shrink-0 ml-auto" style={{ color: "var(--text-tertiary)" }} />
      </Link>
    )
  }

  return <div>{content}</div>
}
