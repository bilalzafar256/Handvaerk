"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { toast } from "sonner"
import { Trash2 } from "lucide-react"
import { deleteCustomerAction } from "@/lib/actions/customers"

export function DeleteCustomerButton({ customerId }: { customerId: string }) {
  const t = useTranslations("CustomerDetail")
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteCustomerAction(customerId)
      router.push("/customers")
    } catch {
      toast.error("Something went wrong.")
      setDeleting(false)
      setOpen(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 h-9 px-3 rounded-[--radius-sm] text-sm font-medium border transition-colors duration-150 hover:bg-[--error-light]"
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

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{ backgroundColor: "oklch(0.10 0.005 50 / 0.5)" }}
            onClick={() => setOpen(false)}
          />

          {/* Dialog */}
          <div
            className="relative w-full max-w-sm rounded-[--radius-lg] p-6 space-y-4"
            style={{
              backgroundColor: "var(--surface)",
              boxShadow: "var(--shadow-xl)",
            }}
          >
            <div>
              <p
                className="text-base font-semibold"
                style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
              >
                {t("deleteConfirm")}
              </p>
              <p
                className="mt-1 text-sm"
                style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}
              >
                {t("deleteDescription")}
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setOpen(false)}
                className="h-10 px-4 rounded-[--radius-sm] text-sm font-medium border transition-colors duration-150"
                style={{
                  borderColor: "var(--border)",
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-body)",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="h-10 px-4 rounded-[--radius-sm] text-sm font-medium transition-colors duration-150 disabled:opacity-50"
                style={{
                  backgroundColor: "var(--error)",
                  color: "white",
                  fontFamily: "var(--font-body)",
                }}
              >
                {deleting ? "Deleting…" : t("deleteConfirmButton")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
