import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  return (
    <div className="min-h-screen bg-background">
      {/* Bottom nav and sidebar added in Phase 1 */}
      <main className="pb-20">{children}</main>
    </div>
  )
}
