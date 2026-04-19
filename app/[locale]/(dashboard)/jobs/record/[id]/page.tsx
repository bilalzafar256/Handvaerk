import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { setRequestLocale } from "next-intl/server"
import { getAiRecordingById } from "@/lib/db/queries/ai-recordings"
import { getCustomersByUser } from "@/lib/db/queries/customers"
import { Topbar } from "@/components/shared/topbar"
import { RecordingStatusView } from "@/components/ai/recording-status-view"
import { JobRecordingFlow } from "@/components/ai/job-recording-flow"
import type { ExtractedJobRecord } from "@/lib/ai"

export const dynamic = "force-dynamic"

type Props = { params: Promise<{ locale: string; id: string }> }

export default async function RecordingStatusPage({ params }: Props) {
  const { locale, id } = await params
  setRequestLocale(locale)

  const { userId: clerkId } = await auth()
  if (!clerkId) redirect("/sign-in")

  const user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) })
  if (!user) redirect("/sign-in")

  const recording = await getAiRecordingById(id, user.id)
  if (!recording) redirect("/overview")

  // Ready — show review form pre-filled from extracted data
  if (recording.status === "ready" && recording.extractedData) {
    const customers = await getCustomersByUser(user.id)
    return (
      <>
        <Topbar title="Review & confirm" />
        <main className="pt-4 pb-24 md:pb-10 px-4 lg:px-6">
          <JobRecordingFlow
            customers={customers}
            initialData={recording.extractedData as unknown as ExtractedJobRecord}
          />
        </main>
      </>
    )
  }

  // Pending / processing / failed — show status UI with polling
  return (
    <>
      <Topbar title="Processing recording" />
      <main className="pt-4 pb-24 md:pb-10 px-4 lg:px-6">
        <RecordingStatusView
          recordingId={id}
          status={recording.status}
          currentStep={recording.currentStep ?? null}
          errorStep={recording.errorStep ?? null}
          errorMessage={recording.errorMessage ?? null}
        />
      </main>
    </>
  )
}
