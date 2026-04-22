"use client"

import { useState } from "react"
import { Camera, PenLine, Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { CustomerForm } from "@/components/forms/customer-form"
import type { ExtractedBusinessCard } from "@/lib/ai/operations/extract-business-card"

type State = "choice" | "scanning" | "form"

export function NewCustomerEntry() {
  const t = useTranslations("CustomerForm")
  const [state, setState] = useState<State>("choice")
  const [scanned, setScanned] = useState<ExtractedBusinessCard>({})

  async function handleScan(file: File) {
    setState("scanning")
    try {
      const imageBase64 = await fileToBase64(file)
      const res = await fetch("/api/business-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64, mimeType: file.type }),
      })
      if (!res.ok) throw new Error()
      const fields: ExtractedBusinessCard = await res.json()
      setScanned(fields)
    } catch {
      toast.error(t("scanError"))
      setScanned({})
    }
    setState("form")
  }

  if (state === "form") {
    return <CustomerForm initialValues={scanned} />
  }

  if (state === "scanning") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24">
        <Loader2
          className="w-8 h-8 animate-spin"
          style={{ color: "var(--primary)" }}
        />
        <p
          className="text-sm"
          style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}
        >
          {t("scanReading")}
        </p>
      </div>
    )
  }

  return (
    <div className="px-4 pt-4 space-y-3">
      <p
        className="text-sm pb-1"
        style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}
      >
        {t("entryPrompt")}
      </p>

      {/* Fill manually */}
      <button
        type="button"
        onClick={() => setState("form")}
        className="w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-colors active:scale-[0.99]"
        style={{
          backgroundColor: "var(--surface)",
          borderColor: "var(--border)",
          boxShadow: "var(--shadow-xs)",
        }}
      >
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: "var(--background-subtle)" }}
        >
          <PenLine className="w-5 h-5" style={{ color: "var(--text-secondary)" }} />
        </div>
        <div>
          <p
            className="font-medium text-sm"
            style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}
          >
            {t("entryManual")}
          </p>
          <p
            className="text-xs mt-0.5"
            style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)" }}
          >
            {t("entryManualSub")}
          </p>
        </div>
      </button>

      {/* Scan business card */}
      <label
        className="w-full flex items-center gap-4 p-4 rounded-xl border text-left cursor-pointer transition-colors active:scale-[0.99]"
        style={{
          backgroundColor: "var(--surface)",
          borderColor: "var(--primary)",
          boxShadow: "var(--shadow-xs)",
        }}
      >
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: "var(--accent-light)" }}
        >
          <Camera className="w-5 h-5" style={{ color: "var(--primary)" }} />
        </div>
        <div className="flex-1">
          <p
            className="font-medium text-sm"
            style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}
          >
            {t("entryScan")}
          </p>
          <p
            className="text-xs mt-0.5"
            style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)" }}
          >
            {t("entryScanSub")}
          </p>
        </div>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleScan(file)
          }}
        />
      </label>
    </div>
  )
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(",")[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
