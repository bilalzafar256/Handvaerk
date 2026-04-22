import { setRequestLocale } from "next-intl/server"
import { Topbar } from "@/components/shared/topbar"
import { CalendarShell } from "@/components/calendar/calendar-shell"
import { getCalendarDataAction } from "@/lib/actions/calendar"

export const metadata = { title: "Calendar" }

function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function getDefaultRange() {
  const now = new Date()
  return {
    from: localDateStr(new Date(now.getFullYear(), now.getMonth(), 1)),
    to:   localDateStr(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  }
}

export default async function CalendarPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const { from, to } = getDefaultRange()
  const data = await getCalendarDataAction(from, to)

  return (
    <div className="flex flex-col min-h-0" style={{ height: "calc(100dvh - 3.5rem)" }}>
      <Topbar title="Calendar" />
      <div className="flex-1 min-h-0 overflow-hidden">
        <CalendarShell initialData={data} initialFrom={from} initialTo={to} />
      </div>
    </div>
  )
}
