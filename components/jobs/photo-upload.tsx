"use client"

import { useState, useRef } from "react"
import { upload } from "@vercel/blob/client"
import { addJobPhotoAction, deleteJobPhotoAction } from "@/lib/actions/jobs"
import { toast } from "sonner"
import { Camera, Trash2, Loader2, X } from "lucide-react"
import type { JobPhoto } from "@/lib/db/schema/jobs"

type Tag = "before" | "during" | "after" | "document"
type Filter = "all" | Tag

const TAGS: { value: Tag; label: string }[] = [
  { value: "before",   label: "Before" },
  { value: "during",   label: "During" },
  { value: "after",    label: "After" },
  { value: "document", label: "Document" },
]

const TAG_STYLES: Record<Tag, { bg: string; text: string }> = {
  before:   { bg: "oklch(0.94 0.05 240 / 0.6)", text: "oklch(0.40 0.12 240)" },
  during:   { bg: "var(--accent-light)",          text: "var(--amber-700)" },
  after:    { bg: "var(--success-light)",          text: "var(--success)" },
  document: { bg: "var(--muted)",                  text: "var(--muted-foreground)" },
}

interface PendingFile {
  file: File
  objectUrl: string
  tag: Tag | null
}

interface PhotoUploadProps {
  jobId: string
  photos: JobPhoto[]
}

export function PhotoUpload({ jobId, photos: initialPhotos }: PhotoUploadProps) {
  const [photos, setPhotos] = useState<JobPhoto[]>(initialPhotos)
  const [pending, setPending] = useState<PendingFile | null>(null)
  const [uploading, setUploading] = useState(false)
  const [filter, setFilter] = useState<Filter>("all")
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const objectUrl = URL.createObjectURL(file)
    setPending({ file, objectUrl, tag: null })
    if (inputRef.current) inputRef.current.value = ""
  }

  async function uploadWithTag(tag: Tag | null) {
    if (!pending) return
    setUploading(true)
    try {
      const blob = await upload(
        `jobs/${jobId}/${pending.file.name}`,
        pending.file,
        { access: "public", handleUploadUrl: "/api/upload/jobs" }
      )
      const { id } = await addJobPhotoAction(jobId, blob.url, tag)
      setPhotos(prev => [
        ...prev,
        { id, jobId, fileUrl: blob.url, caption: null, tag, createdAt: new Date() },
      ])
      toast.success("Photo uploaded")
    } catch {
      toast.error("Upload failed. Please try again.")
    } finally {
      URL.revokeObjectURL(pending.objectUrl)
      setPending(null)
      setUploading(false)
    }
  }

  async function handleDelete(photoId: string) {
    try {
      await deleteJobPhotoAction(photoId, jobId)
      setPhotos(prev => prev.filter(p => p.id !== photoId))
    } catch {
      toast.error("Failed to delete photo")
    }
  }

  const filtered = filter === "all" ? photos : photos.filter(p => p.tag === filter)
  const filtersWithCounts = TAGS.map(t => ({
    ...t,
    count: photos.filter(p => p.tag === t.value).length,
  }))

  return (
    <div className="space-y-3">
      {/* Tag-selection overlay for pending file */}
      {pending && (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)", backgroundColor: "var(--background-subtle)" }}>
          <div className="flex gap-3 p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={pending.objectUrl} alt="Preview" className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium mb-2" style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}>
                Tag this photo
              </p>
              <div className="flex flex-wrap gap-1.5">
                {TAGS.map(tag => (
                  <button
                    key={tag.value}
                    type="button"
                    disabled={uploading}
                    onClick={() => uploadWithTag(tag.value)}
                    className="h-7 px-2.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer disabled:opacity-50"
                    style={{
                      backgroundColor: TAG_STYLES[tag.value].bg,
                      color: TAG_STYLES[tag.value].text,
                      borderColor: "transparent",
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : tag.label}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => uploadWithTag(null)}
                  className="h-7 px-2.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer disabled:opacity-50"
                  style={{ borderColor: "var(--border)", color: "var(--muted-foreground)", fontFamily: "var(--font-body)" }}
                >
                  {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Skip"}
                </button>
              </div>
            </div>
            {!uploading && (
              <button
                type="button"
                onClick={() => { URL.revokeObjectURL(pending.objectUrl); setPending(null) }}
                className="w-6 h-6 flex items-center justify-center rounded-full self-start flex-shrink-0 cursor-pointer"
                style={{ backgroundColor: "var(--border)", color: "var(--muted-foreground)" }}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Filter chips */}
      {photos.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className="h-6 px-2.5 rounded-full text-[11px] font-medium transition-colors cursor-pointer"
            style={{
              backgroundColor: filter === "all" ? "var(--primary)" : "var(--muted)",
              color: filter === "all" ? "var(--primary-foreground)" : "var(--muted-foreground)",
              fontFamily: "var(--font-body)",
            }}
          >
            All ({photos.length})
          </button>
          {filtersWithCounts.filter(t => t.count > 0).map(tag => (
            <button
              key={tag.value}
              type="button"
              onClick={() => setFilter(tag.value)}
              className="h-6 px-2.5 rounded-full text-[11px] font-medium transition-colors cursor-pointer"
              style={{
                backgroundColor: filter === tag.value ? TAG_STYLES[tag.value].bg : "var(--muted)",
                color: filter === tag.value ? TAG_STYLES[tag.value].text : "var(--muted-foreground)",
                fontFamily: "var(--font-body)",
              }}
            >
              {tag.label} ({tag.count})
            </button>
          ))}
        </div>
      )}

      {/* Photo grid */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {filtered.map(photo => (
            <div key={photo.id} className="relative group aspect-square">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.fileUrl}
                alt="Job photo"
                className="w-full h-full object-cover rounded-[--radius-sm]"
              />
              {photo.tag && (
                <span
                  className="absolute bottom-1 left-1 text-[9px] font-semibold px-1.5 py-0.5 rounded capitalize"
                  style={{
                    backgroundColor: TAG_STYLES[photo.tag as Tag]?.bg ?? "var(--muted)",
                    color: TAG_STYLES[photo.tag as Tag]?.text ?? "var(--muted-foreground)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  {photo.tag}
                </span>
              )}
              <button
                onClick={() => handleDelete(photo.id)}
                className="absolute top-1 right-1 w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 cursor-pointer"
                style={{ backgroundColor: "oklch(0.10 0.005 50 / 0.7)" }}
                aria-label="Delete photo"
              >
                <Trash2 className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        onChange={handleFileChange}
        className="hidden"
        id={`photo-upload-${jobId}`}
      />
      <label
        htmlFor={`photo-upload-${jobId}`}
        className="flex items-center gap-2 h-11 px-4 rounded-[--radius-sm] border text-sm font-medium transition-colors duration-150 cursor-pointer w-fit bg-[var(--card)] hover:bg-[var(--accent)]"
        style={{ borderColor: "var(--border)", color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}
      >
        <Camera className="w-4 h-4" />
        Add photo
      </label>
    </div>
  )
}
