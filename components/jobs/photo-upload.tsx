"use client"

import { useState, useRef } from "react"
import { upload } from "@vercel/blob/client"
import { addJobPhotoAction, deleteJobPhotoAction } from "@/lib/actions/jobs"
import { toast } from "sonner"
import { Camera, Trash2, Loader2 } from "lucide-react"
import type { JobPhoto } from "@/lib/db/schema/jobs"

interface PhotoUploadProps {
  jobId: string
  photos: JobPhoto[]
}

export function PhotoUpload({ jobId, photos: initialPhotos }: PhotoUploadProps) {
  const [photos, setPhotos] = useState<JobPhoto[]>(initialPhotos)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return

    setUploading(true)
    try {
      for (const file of files) {
        const blob = await upload(
          `jobs/${jobId}/${file.name}`,
          file,
          { access: "public", handleUploadUrl: "/api/upload/jobs" }
        )
        const { id } = await addJobPhotoAction(jobId, blob.url)
        setPhotos((prev) => [
          ...prev,
          { id, jobId, fileUrl: blob.url, caption: null, createdAt: new Date() },
        ])
      }
      toast.success("Photo uploaded")
    } catch {
      toast.error("Upload failed. Please try again.")
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  async function handleDelete(photoId: string) {
    try {
      await deleteJobPhotoAction(photoId, jobId)
      setPhotos((prev) => prev.filter((p) => p.id !== photoId))
    } catch {
      toast.error("Failed to delete photo")
    }
  }

  return (
    <div className="space-y-3">
      {/* Photo grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo) => (
            <div key={photo.id} className="relative group aspect-square">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.fileUrl}
                alt="Job photo"
                className="w-full h-full object-cover rounded-[--radius-sm]"
              />
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
        multiple
        onChange={handleFileChange}
        className="hidden"
        id={`photo-upload-${jobId}`}
      />
      <label
        htmlFor={`photo-upload-${jobId}`}
        className="flex items-center gap-2 h-11 px-4 rounded-[--radius-sm] border text-sm font-medium transition-colors duration-150 cursor-pointer w-fit bg-[var(--card)] hover:bg-[var(--accent)]"
        style={{
          borderColor: "var(--border)",
          color: "var(--text-secondary)",
          fontFamily: "var(--font-body)",
        }}
      >
        {uploading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Camera className="w-4 h-4" />
        )}
        {uploading ? "Uploading…" : "Add photos"}
      </label>
    </div>
  )
}
