"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Star } from "lucide-react"
import { updateGoogleReviewUrlAction } from "@/lib/actions/profile"

interface GoogleReviewSectionProps {
  googleReviewUrl?: string | null
}

const inputCls = `
  w-full h-11 px-3
  bg-[var(--background)] text-[var(--foreground)]
  border border-[var(--border)]
  rounded-lg
  placeholder:opacity-40
  focus:outline-none focus:ring-2 focus:ring-[var(--primary)]
  transition-colors duration-150 text-sm
`

export function GoogleReviewSection({ googleReviewUrl: initial }: GoogleReviewSectionProps) {
  const [url, setUrl] = useState(initial ?? "")
  const [isPending, startTransition] = useTransition()

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      try {
        await updateGoogleReviewUrlAction(url.trim())
        toast.success("Google review link saved")
      } catch {
        toast.error("Failed to save Google review link")
      }
    })
  }

  return (
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
          Customer reviews
        </p>
      </div>

      <div className="p-5">
        <div className="flex items-start gap-3 mb-4">
          <div
            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "var(--background-subtle)" }}
          >
            <Star className="w-4 h-4" style={{ color: "var(--primary)" }} />
          </div>
          <div>
            <p
              className="text-sm font-medium"
              style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}
            >
              Google review link
            </p>
            <p
              className="text-xs mt-0.5"
              style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)" }}
            >
              When added, customers receive this link in their paid invoice thank-you email.
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="flex gap-2 items-end">
          <div className="flex-1">
            <label
              className="block text-xs font-medium mb-1"
              style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}
            >
              Review URL
            </label>
            <input
              type="url"
              className={inputCls}
              placeholder="https://g.page/r/..."
              value={url}
              onChange={e => setUrl(e.target.value)}
              style={{ fontFamily: "var(--font-mono)" }}
            />
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="h-11 px-4 rounded-lg text-sm font-medium cursor-pointer disabled:opacity-60 transition-opacity flex-shrink-0"
            style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)", fontFamily: "var(--font-body)" }}
          >
            Save
          </button>
        </form>
      </div>
    </div>
  )
}
