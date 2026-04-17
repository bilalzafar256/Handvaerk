"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Trash2, Loader2 } from "lucide-react"
import { deleteJobAction } from "@/lib/actions/jobs"

export function DeleteJobButton({ jobId }: { jobId: string }) {
  const t = useTranslations("JobDetail")
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <p className="text-sm" style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}>
          {t("deleteConfirm")}
        </p>
        <button
          onClick={async () => {
            setDeleting(true)
            try {
              await deleteJobAction(jobId)
            } catch {
              toast.error("Failed to delete job")
              setDeleting(false)
              setConfirming(false)
            }
          }}
          disabled={deleting}
          className="h-9 px-3 rounded-[--radius-sm] text-sm font-medium transition-colors duration-150 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          style={{
            backgroundColor: "var(--error-light)",
            color: "var(--error)",
            fontFamily: "var(--font-body)",
          }}
        >
          {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          {t("deleteConfirmButton")}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="h-9 px-3 rounded-[--radius-sm] text-sm font-medium transition-colors duration-150 cursor-pointer"
          style={{
            color: "var(--text-secondary)",
            fontFamily: "var(--font-body)",
          }}
        >
          {t("cancelButton")}
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="flex items-center gap-1.5 h-9 px-3 rounded-[--radius-sm] text-sm font-medium border transition-colors duration-150 cursor-pointer hover:bg-[--error-light]"
      style={{
        borderColor: "var(--border)",
        color: "var(--error)",
        fontFamily: "var(--font-body)",
        backgroundColor: "var(--surface)",
      }}
    >
      <Trash2 className="w-4 h-4" />
      {t("deleteButton")}
    </button>
  )
}
