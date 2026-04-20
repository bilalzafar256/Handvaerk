import { setRequestLocale } from "next-intl/server"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { Topbar } from "@/components/shared/topbar"
import { RecordTabs } from "@/components/ai/record-tabs"

export const dynamic = "force-dynamic"

type Props = { params: Promise<{ locale: string }> }

export default async function RecordJobPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  const { userId: clerkId } = await auth()
  if (!clerkId) redirect("/sign-in")

  return (
    <>
      <Topbar title="Record job" />
      <main className="pt-4 pb-24 md:pb-10 px-4 lg:px-6">
        <div className="max-w-md mx-auto">
          <div className="pt-8 pb-4 text-center space-y-1">
            <h1
              className="text-[22px] font-bold"
              style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}
            >
              Record job
            </h1>
            <p
              className="text-sm leading-relaxed"
              style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-body)" }}
            >
              Record or upload a conversation. AI extracts customer, job, and quote details in the background.
            </p>
          </div>
          <RecordTabs />
        </div>
      </main>
    </>
  )
}
