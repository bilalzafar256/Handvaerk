import { setRequestLocale } from "next-intl/server"
import { Topbar } from "@/components/shared/topbar"
import { CalendarShell } from "@/components/calendar/calendar-shell"
import { getCalendarDataAction } from "@/lib/actions/calendar"

export const metadata = { title: "Calendar" }

function getDefaultRange() {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth(), 1)
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return {
    from: from.toISOString().split("T")[0],
    to: to.toISOString().split("T")[0],
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
    <div className="flex flex-col h-full min-h-0">
      <Topbar title="Calendar" />
      <div className="flex-1 min-h-0 overflow-hidden">
        <CalendarShell initialData={data} initialFrom={from} initialTo={to} />
      </div>
    </div>
  )
}
