"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, AlertTriangle, Mic } from "lucide-react"
import { Link } from "@/i18n/navigation"

const STEP_LABELS: Record<string, string> = {
  "mark-processing":          "Starting...",
  "ai-extract:fetch-blob":    "Loading audio...",
  "ai-extract:groq-transcribe": "Transcribing audio...",
  "ai-extract:groq-extract":  "Extracting job details...",
  "save-result":              "Saving results...",
  "cleanup-blob":             "Finishing up...",
  "done":                     "Complete",
}

interface Props {
  recordingId: string
  status: string
  currentStep: string | null
  errorStep: string | null
  errorMessage: string | null
}

export function RecordingStatusView({ recordingId, status, currentStep, errorStep, errorMessage }: Props) {
  const router = useRouter()

  // Poll every 3s while processing
  useEffect(() => {
    if (status !== "pending" && status !== "processing") return
    const id = setInterval(() => router.refresh(), 3000)
    return () => clearInterval(id)
  }, [status, router])

  if (status === "failed") {
    return (
      <div className="max-w-md mx-auto flex flex-col items-center gap-5 pt-12 text-center">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: "oklch(0.97 0.02 20)" }}
        >
          <AlertTriangle className="w-7 h-7" style={{ color: "var(--destructive)" }} />
        </div>
        <div className="space-y-1">
          <p className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>
            Processing failed
          </p>
          {errorStep && (
            <p className="text-xs font-medium" style={{ fontFamily: "var(--font-mono)", color: "var(--muted-foreground)" }}>
              Failed at: {errorStep}
            </p>
          )}
          {errorMessage && (
            <p className="text-sm mt-1 max-w-[280px] mx-auto" style={{ fontFamily: "var(--font-body)", color: "var(--muted-foreground)" }}>
              {errorMessage}
            </p>
          )}
        </div>
        <Link
          href="/jobs/record"
          className="flex items-center gap-2 h-11 px-6 rounded-xl text-sm font-semibold transition-all active:scale-[0.97]"
          style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)", fontFamily: "var(--font-body)" }}
        >
          <Mic className="w-4 h-4" /> Re-record
        </Link>
      </div>
    )
  }

  // Pending or processing
  const stepLabel = currentStep ? (STEP_LABELS[currentStep] ?? currentStep) : "Queued..."

  return (
    <div className="max-w-md mx-auto flex flex-col items-center gap-6 pt-12 text-center">
      <Loader2 className="w-10 h-10 animate-spin" style={{ color: "var(--primary)" }} />
      <div className="space-y-1">
        <p className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>
          Processing your recording
        </p>
        <p className="text-sm" style={{ fontFamily: "var(--font-body)", color: "var(--muted-foreground)" }}>
          {stepLabel}
        </p>
        {currentStep && (
          <p className="text-[11px] mt-1" style={{ fontFamily: "var(--font-mono)", color: "var(--muted-foreground)", opacity: 0.6 }}>
            {currentStep}
          </p>
        )}
      </div>
      <p className="text-xs max-w-[240px]" style={{ fontFamily: "var(--font-body)", color: "var(--muted-foreground)" }}>
        You can navigate away — this page will update automatically when ready.
      </p>
      <Link
        href="/overview"
        className="text-sm font-medium"
        style={{ color: "var(--primary)", fontFamily: "var(--font-body)" }}
      >
        Go to dashboard
      </Link>
    </div>
  )
}
