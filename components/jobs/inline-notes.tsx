"use client"

import { useState, useRef, useCallback } from "react"
import { updateJobNotesAction } from "@/lib/actions/jobs"
import { toast } from "sonner"
import { useTranslations } from "next-intl"

interface InlineNotesProps {
  jobId: string
  initialNotes: string | null
}

export function InlineNotes({ jobId, initialNotes }: InlineNotesProps) {
  const t = useTranslations("JobDetail")
  const [notes, setNotes] = useState(initialNotes ?? "")
  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const ref = useRef<HTMLTextAreaElement>(null)

  const handleClick = useCallback(() => {
    setEditing(true)
    setTimeout(() => ref.current?.focus(), 0)
  }, [])

  const handleBlur = useCallback(async () => {
    setEditing(false)
    if (notes === (initialNotes ?? "")) return
    setSaving(true)
    try {
      await updateJobNotesAction(jobId, notes || null)
      setSaved(true)
      setTimeout(() => setSaved(false), 1800)
    } catch {
      toast.error(t("notesError"))
    } finally {
      setSaving(false)
    }
  }, [notes, initialNotes, jobId, t])

  return (
    <div className="relative" onClick={!editing ? handleClick : undefined}>
      {editing ? (
        <textarea
          ref={ref}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={handleBlur}
          rows={4}
          className="w-full rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2"
          style={{
            fontFamily: "var(--font-body)",
            color: "var(--foreground)",
            backgroundColor: "var(--accent)",
            border: "1px solid var(--border)",
            ["--tw-ring-color" as string]: "oklch(0.720 0.195 58 / 20%)",
            lineHeight: 1.6,
          }}
          placeholder={t("notesPlaceholder")}
        />
      ) : (
        <div
          className="min-h-[80px] p-3 rounded-lg cursor-text text-sm"
          style={{
            fontFamily: "var(--font-body)",
            color: notes ? "var(--foreground)" : "var(--muted-foreground)",
            backgroundColor: "var(--accent)",
            border: "1px solid var(--border)",
            lineHeight: 1.6,
            whiteSpace: "pre-wrap",
          }}
        >
          {notes || t("notesEmpty")}
        </div>
      )}

      {/* Save flash */}
      <span
        className="absolute bottom-2 right-3 text-xs transition-opacity duration-300"
        style={{
          fontFamily: "var(--font-body)",
          color: "var(--muted-foreground)",
          opacity: saved ? 1 : saving ? 0.6 : 0,
        }}
      >
        {saving ? t("notesSaving") : t("notesSaved")}
      </span>
    </div>
  )
}
