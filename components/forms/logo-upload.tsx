"use client"

import { upload } from "@vercel/blob/client"
import { useRef, useState } from "react"
import Image from "next/image"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { toast } from "sonner"

interface LogoUploadProps {
  currentLogoUrl?: string | null
}

export function LogoUpload({ currentLogoUrl }: LogoUploadProps) {
  const t = useTranslations("LogoUpload")
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentLogoUrl ?? null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const blob = await upload(`logos/${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
      })
      setPreviewUrl(blob.url)
      router.refresh()
      toast.success(t("uploadSuccess"))
    } catch {
      toast.error(t("uploadError"))
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div
        className="w-16 h-16 rounded-[--radius-md] border-2 border-dashed flex items-center justify-center overflow-hidden flex-shrink-0"
        style={{ borderColor: "var(--border-strong)", backgroundColor: "var(--background-subtle)" }}
      >
        {previewUrl ? (
          <Image
            src={previewUrl}
            alt="Company logo"
            width={64}
            height={64}
            className="w-full h-full object-contain"
          />
        ) : (
          <svg
            className="w-6 h-6"
            style={{ color: "var(--text-tertiary)" }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
          </svg>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="h-9 px-4 rounded-[--radius-sm] text-sm font-medium transition-all duration-150 border disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            fontFamily: "var(--font-body)",
            backgroundColor: "var(--surface)",
            color: "var(--text-primary)",
            borderColor: "var(--border-strong)",
          }}
        >
          {uploading ? t("uploading") : previewUrl ? t("changeButton") : t("uploadButton")}
        </button>
        <p
          className="text-xs"
          style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)" }}
        >
          {t("hint")}
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}
