"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Trash2, Download, AlertTriangle } from "lucide-react"
import { exportUserDataAction, initiateAccountDeletionAction } from "@/lib/actions/account"

const inputCls = `
  w-full h-11 px-3
  bg-[var(--background)] text-[var(--foreground)]
  border border-[var(--border)]
  rounded-lg
  placeholder:opacity-40
  focus:outline-none focus:ring-2 focus:ring-[var(--destructive)]
  transition-colors duration-150 text-sm
`

export function AccountDangerZone() {
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [confirmEmail, setConfirmEmail] = useState("")
  const [isPendingExport, startExportTransition] = useTransition()
  const [isPendingDelete, startDeleteTransition] = useTransition()

  function handleExport() {
    startExportTransition(async () => {
      try {
        const json = await exportUserDataAction()
        const blob = new Blob([json], { type: "application/json" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `handvaerk-pro-data-${new Date().toISOString().split("T")[0]}.json`
        a.click()
        URL.revokeObjectURL(url)
        toast.success("Data exported successfully")
      } catch {
        toast.error("Failed to export data. Try again.")
      }
    })
  }

  function handleDelete() {
    startDeleteTransition(async () => {
      try {
        await initiateAccountDeletionAction(confirmEmail)
        toast.success("Account deleted. You will be signed out shortly.")
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to delete account."
        toast.error(message)
      }
    })
  }

  return (
    <>
      {/* Danger zone card */}
      <div
        className="mx-4 mt-4 rounded-[--radius-lg] border overflow-hidden"
        style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-sm)" }}
      >
        <div
          className="px-5 py-3 border-b"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--background-subtle)" }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)" }}
          >
            Data & account
          </p>
        </div>

        <div className="p-5 space-y-3">
          {/* Export data */}
          <button
            onClick={handleExport}
            disabled={isPendingExport}
            className="w-full flex items-center gap-3 h-11 px-4 rounded-lg text-sm font-medium border disabled:opacity-60 transition-opacity text-left"
            style={{
              backgroundColor: "var(--background-subtle)",
              borderColor: "var(--border)",
              color: "var(--text-primary)",
              fontFamily: "var(--font-body)",
            }}
          >
            <Download className="w-4 h-4 shrink-0" style={{ color: "var(--text-secondary)" }} />
            <span>{isPendingExport ? "Preparing export…" : "Export my data (JSON)"}</span>
          </button>

          {/* Delete account */}
          <button
            onClick={() => setShowDeleteModal(true)}
            className="w-full flex items-center gap-3 h-11 px-4 rounded-lg text-sm font-medium border transition-opacity text-left"
            style={{
              backgroundColor: "var(--background-subtle)",
              borderColor: "var(--border)",
              color: "var(--destructive)",
              fontFamily: "var(--font-body)",
            }}
          >
            <Trash2 className="w-4 h-4 shrink-0" />
            <span>Delete my account</span>
          </button>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-[--radius-lg] border p-6 space-y-4"
            style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: "color-mix(in srgb, var(--destructive) 12%, transparent)" }}
              >
                <AlertTriangle className="w-4.5 h-4.5" style={{ color: "var(--destructive)" }} />
              </div>
              <div>
                <p
                  className="text-base font-semibold"
                  style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
                >
                  Delete your account?
                </p>
                <p
                  className="text-xs mt-1"
                  style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}
                >
                  Your account will be deactivated immediately. All data is permanently deleted after
                  30 days. This cannot be undone.
                </p>
              </div>
            </div>

            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}
              >
                Type your email address to confirm
              </label>
              <input
                type="email"
                className={inputCls}
                placeholder="your@email.com"
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                autoComplete="off"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 h-10 rounded-lg text-sm font-medium border"
                style={{
                  backgroundColor: "var(--background-subtle)",
                  borderColor: "var(--border)",
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-body)",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isPendingDelete || !confirmEmail.trim()}
                className="flex-1 h-10 rounded-lg text-sm font-medium disabled:opacity-40 transition-opacity"
                style={{
                  backgroundColor: "var(--destructive)",
                  color: "var(--destructive-foreground)",
                  fontFamily: "var(--font-body)",
                }}
              >
                {isPendingDelete ? "Deleting…" : "Delete account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
