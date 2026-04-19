"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Mic, Square, Loader2, CheckCircle2 } from "lucide-react"
import { submitRecordingAction } from "@/lib/actions/ai-job-recording"
import { toast } from "sonner"

type RecorderState = "idle" | "recording" | "uploading" | "done" | "error"

const MAX_SECONDS = 180

export function VoiceRecorder() {
  const router = useRouter()
  const [state, setState] = useState<RecorderState>("idle")
  const [elapsed, setElapsed] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop()
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop()
      }
    }
  }, [])

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder
      chunksRef.current = []
      setElapsed(0)

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        setState("uploading")

        try {
          const mimeType = recorder.mimeType || "audio/webm"
          const ext = mimeType.includes("ogg") ? "ogg" : mimeType.includes("mp4") ? "mp4" : "webm"
          const audioBlob = new Blob(chunksRef.current, { type: mimeType })

          // Send to Server Action — it uploads to Vercel Blob and fires Inngest
          const formData = new FormData()
          formData.append("audio", audioBlob, `recording.${ext}`)
          formData.append("mimeType", mimeType)
          const result = await submitRecordingAction(formData)
          if (!result.success) throw new Error(result.error)

          setState("done")
          // Navigate to status page — user will see result when ready
          setTimeout(() => router.push(`/jobs/record/${result.recordingId}`), 800)
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Upload failed")
          setState("error")
        }
      }

      recorder.start(250)
      setState("recording")

      timerRef.current = setInterval(() => {
        setElapsed((prev) => {
          const next = prev + 1
          if (next >= MAX_SECONDS) stopRecording()
          return next
        })
      }, 1000)
    } catch {
      toast.error("Microphone access denied. Please allow microphone access and try again.")
    }
  }

  const minutes = Math.floor(elapsed / 60)
  const seconds = elapsed % 60
  const timeStr = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
  const progress = Math.min(elapsed / MAX_SECONDS, 1)
  const circumference = 2 * Math.PI * 52

  if (state === "uploading") {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <Loader2 className="w-10 h-10 animate-spin" style={{ color: "var(--primary)" }} />
        <p className="text-sm" style={{ fontFamily: "var(--font-body)", color: "var(--muted-foreground)" }}>
          Uploading recording...
        </p>
      </div>
    )
  }

  if (state === "done") {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <CheckCircle2 className="w-10 h-10" style={{ color: "var(--primary)" }} />
        <p className="text-sm font-medium" style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}>
          Recording submitted
        </p>
        <p className="text-xs text-center" style={{ fontFamily: "var(--font-body)", color: "var(--muted-foreground)" }}>
          AI is processing it in the background...
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      {/* Progress ring */}
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60" cy="60" r="52" fill="none" strokeWidth="5"
            style={{ stroke: "var(--border)" }}
          />
          {state === "recording" && (
            <circle
              cx="60" cy="60" r="52" fill="none" strokeWidth="5"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress)}
              strokeLinecap="round"
              style={{ stroke: "var(--primary)", transition: "stroke-dashoffset 1s linear" }}
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
          {state === "recording" ? (
            <>
              <span
                className="text-2xl font-bold tabular-nums"
                style={{ fontFamily: "var(--font-mono)", color: "var(--foreground)" }}
              >
                {timeStr}
              </span>
              <span className="text-[11px] uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>
                recording
              </span>
            </>
          ) : (
            <Mic
              className="w-9 h-9"
              style={{ color: state === "error" ? "var(--destructive)" : "var(--primary)" }}
            />
          )}
        </div>
      </div>

      {/* Waveform animation */}
      {state === "recording" && (
        <div className="flex items-center gap-[3px] h-8">
          {Array.from({ length: 14 }).map((_, i) => (
            <div
              key={i}
              className="w-1 rounded-full animate-pulse"
              style={{
                backgroundColor: "var(--primary)",
                height: `${6 + ((i * 11 + 3) % 22)}px`,
                animationDelay: `${i * 70}ms`,
                animationDuration: `${500 + (i % 3) * 150}ms`,
                opacity: 0.7 + (i % 3) * 0.1,
              }}
            />
          ))}
        </div>
      )}

      <button
        onClick={state === "recording" ? stopRecording : startRecording}
        className="flex items-center gap-2 h-12 px-8 rounded-xl text-sm font-semibold transition-all duration-150 active:scale-[0.97]"
        style={{
          backgroundColor: state === "recording" ? "var(--destructive)" : "var(--primary)",
          color: "var(--primary-foreground)",
          fontFamily: "var(--font-body)",
        }}
      >
        {state === "recording" ? (
          <><Square className="w-4 h-4 fill-current" /> Stop recording</>
        ) : (
          <><Mic className="w-4 h-4" /> {state === "error" ? "Try again" : "Start recording"}</>
        )}
      </button>

      <p
        className="text-xs text-center max-w-[260px] leading-relaxed"
        style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-body)" }}
      >
        {state === "recording"
          ? "Auto-stops at 3:00. Navigate away anytime — AI processes in the background."
          : "Tap to start. Speak naturally — AI handles English and Danish."}
      </p>
    </div>
  )
}
