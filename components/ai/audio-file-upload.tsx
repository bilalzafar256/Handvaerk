"use client"

import { useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Upload, FileAudio, X, Loader2, CheckCircle2 } from "lucide-react"
import { submitRecordingAction } from "@/lib/actions/ai-job-recording"
import { toast } from "sonner"

type UploadState = "idle" | "selected" | "uploading" | "done" | "error"

const ACCEPTED = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/webm", "audio/ogg", "audio/mp4", "audio/x-m4a", "audio/m4a", "audio/aiff", "audio/x-aiff", "audio/aif"]
const ACCEPTED_EXT = ".mp3,.wav,.webm,.ogg,.mp4,.m4a,.aiff,.aif"
const MAX_BYTES = 25 * 1024 * 1024 // 25 MB

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function AudioFileUpload() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<UploadState>("idle")
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)

  const validate = (f: File): string | null => {
    if (f.size > MAX_BYTES) return `File too large (max 25 MB, got ${formatBytes(f.size)})`
    const ok = ACCEPTED.some(t => f.type === t) || ACCEPTED_EXT.split(",").some(ext => f.name.toLowerCase().endsWith(ext.slice(1)))
    if (!ok) return "Unsupported format. Use MP3, WAV, M4A, AIFF, WebM, or OGG."
    return null
  }

  const pick = useCallback((f: File) => {
    const err = validate(f)
    if (err) { toast.error(err); return }
    setFile(f)
    setState("selected")
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) pick(f)
  }, [pick])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) pick(f)
  }

  const handleSubmit = async () => {
    if (!file) return
    setState("uploading")
    try {
      const mimeType = file.type || "audio/mpeg"
      const formData = new FormData()
      formData.append("audio", file, file.name)
      formData.append("mimeType", mimeType)
      const result = await submitRecordingAction(formData)
      if (!result.success) throw new Error(result.error)
      setState("done")
      setTimeout(() => router.push(`/jobs/record/${result.recordingId}`), 600)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed")
      setState("error")
    }
  }

  const reset = () => {
    setFile(null)
    setState("idle")
    if (inputRef.current) inputRef.current.value = ""
  }

  if (state === "uploading") {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <Loader2 className="w-10 h-10 animate-spin" style={{ color: "var(--primary)" }} />
        <p className="text-sm" style={{ fontFamily: "var(--font-body)", color: "var(--muted-foreground)" }}>
          Uploading {file?.name}...
        </p>
      </div>
    )
  }

  if (state === "done") {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <CheckCircle2 className="w-10 h-10" style={{ color: "var(--primary)" }} />
        <p className="text-sm font-medium" style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}>
          File submitted
        </p>
        <p className="text-xs text-center" style={{ fontFamily: "var(--font-body)", color: "var(--muted-foreground)" }}>
          AI is processing it in the background...
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 py-6">
      {/* Drop zone */}
      <div
        onClick={() => state !== "selected" && inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className="rounded-2xl border-2 border-dashed flex flex-col items-center gap-3 px-6 py-10 transition-colors duration-150 cursor-pointer"
        style={{
          borderColor: dragging ? "var(--primary)" : "var(--border)",
          backgroundColor: dragging ? "oklch(0.97 0.02 250 / 0.5)" : "var(--muted)",
        }}
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: "var(--accent-light, var(--border))" }}
        >
          <Upload className="w-5 h-5" style={{ color: "var(--primary)" }} />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}>
            Drop audio file here
          </p>
          <p className="text-xs mt-0.5" style={{ fontFamily: "var(--font-body)", color: "var(--muted-foreground)" }}>
            or tap to browse · MP3, WAV, M4A, AIFF, WebM, OGG · max 25 MB
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_EXT}
          className="hidden"
          onChange={handleInputChange}
        />
      </div>

      {/* Selected file card */}
      {state === "selected" && file && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl border"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}
        >
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "oklch(0.91 0.05 250)" }}
          >
            <FileAudio className="w-4 h-4" style={{ color: "oklch(0.35 0.14 250)" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}>
              {file.name}
            </p>
            <p className="text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--muted-foreground)" }}>
              {formatBytes(file.size)}
            </p>
          </div>
          <button
            onClick={reset}
            className="w-7 h-7 flex items-center justify-center rounded-md transition-colors flex-shrink-0"
            style={{ color: "var(--muted-foreground)" }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = "var(--foreground)"}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = "var(--muted-foreground)"}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Submit */}
      <button
        onClick={state === "selected" ? handleSubmit : () => inputRef.current?.click()}
        className="flex items-center justify-center gap-2 h-12 px-8 rounded-xl text-sm font-semibold transition-all duration-150 active:scale-[0.97]"
        style={{
          backgroundColor: "var(--primary)",
          color: "var(--primary-foreground)",
          fontFamily: "var(--font-body)",
        }}
      >
        {state === "selected" ? (
          <><Upload className="w-4 h-4" /> Process file</>
        ) : (
          <><Upload className="w-4 h-4" /> Choose file</>
        )}
      </button>

      <p
        className="text-xs text-center leading-relaxed"
        style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-body)" }}
      >
        {state === "error"
          ? "Upload failed — please try again."
          : "AI extracts customer, job, and quote details from the conversation."}
      </p>
    </div>
  )
}
