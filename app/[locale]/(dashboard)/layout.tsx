import { auth } from "@clerk/nextjs/server"
import { getLocale } from "next-intl/server"
import { redirect } from "@/i18n/navigation"
import { getDbUser } from "@/lib/auth"
import { Sidebar } from "@/components/shared/sidebar"
import { DashboardShell } from "@/components/shared/dashboard-shell"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()
  const locale = await getLocale()

  if (!userId) {
    redirect({ href: "/sign-in", locale })
  }

  const user = await getDbUser()
  if (!user?.companyName) {
    redirect({ href: "/profile/setup", locale })
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
      <Sidebar tier={user?.tier ?? "free"} />
      <DashboardShell>{children}</DashboardShell>
    </div>
  )
}
