"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { toast } from "sonner"
import { useState, useRef } from "react"
import { Mic, MicOff } from "lucide-react"
import { createJobAction, updateJobAction } from "@/lib/actions/jobs"
import type { Job } from "@/lib/db/schema/jobs"
import type { Customer } from "@/lib/db/schema/customers"

const schema = z.object({
  customerId:    z.string().uuid("Select a customer"),
  title:         z.string().min(1, "Title is required"),
  description:   z.string().optional(),
  jobType:       z.enum(["service", "project", "recurring"]),
  status:        z.enum(["new", "scheduled", "in_progress", "done", "invoiced", "paid"]),
  scheduledDate: z.string().optional(),
  endDate:       z.string().optional(),
  notes:         z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface JobFormProps {
  job?: Job
  customers: Pick<Customer, "id" | "name">[]
  defaultCustomerId?: string
}

export function JobForm({ job, customers, defaultCustomerId }: JobFormProps) {
  const t = useTranslations("JobForm")
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [listening, setListening] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      customerId:    job?.customerId ?? defaultCustomerId ?? "",
      title:         job?.title ?? "",
      description:   job?.description ?? "",
      jobType:       (job?.jobType as FormData["jobType"]) ?? "service",
      status:        (job?.status as FormData["status"]) ?? "new",
      scheduledDate: job?.scheduledDate ?? "",
      endDate:       job?.endDate ?? "",
      notes:         job?.notes ?? "",
    },
  })

  async function onSubmit(data: FormData) {
    setSaving(true)
    try {
      if (job) {
        await updateJobAction(job.id, data)
        toast.success(t("saveSuccess"))
        router.push(`/jobs/${job.id}`)
      } else {
        const { id } = await createJobAction(data)
        toast.success(t("saveSuccess"))
        router.push(`/jobs/${id}`)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : t("saveError")
      toast.error(message)
      setSaving(false)
    }
  }

  // F-302: Voice input for description
  function toggleVoice() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition

    if (!SR) {
      toast.error("Voice input not supported in this browser")
      return
    }

    if (listening) {
      recognitionRef.current?.stop()
      setListening(false)
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition: any = new SR()
    recognition.lang = "da-DK"
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onresult = (event: { results: { [k: number]: { [k: number]: { transcript: string } } } }) => {
      const transcript = event.results[0][0].transcript
      const current = getValues("description") ?? ""
      setValue("description", current ? `${current} ${transcript}` : transcript)
    }
    recognition.onend = () => setListening(false)
    recognition.onerror = () => {
      toast.error("Voice input error. Please try again.")
      setListening(false)
    }

    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
  }

  const inputClass = `
    w-full h-12 px-4
    bg-[var(--background)] text-[var(--foreground)]
    font-body text-base
    border border-[var(--border)]
    rounded-lg
    placeholder:opacity-50
    focus:outline-none focus:ring-2
    transition-colors duration-150
  `

  const labelClass = "block text-sm font-medium mb-1.5"

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 px-4 pb-8">
      {/* Customer picker */}
      <div>
        <label
          className={labelClass}
          style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}
        >
          {t("customerLabel")} <span style={{ color: "var(--error)" }}>*</span>
        </label>
        <select
          {...register("customerId")}
          className={inputClass}
          style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}
        >
          <option value="">{t("customerPlaceholder")}</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {errors.customerId && (
          <p className="mt-1 text-sm" style={{ color: "var(--error)", fontFamily: "var(--font-body)" }}>
            {errors.customerId.message}
          </p>
        )}
      </div>

      {/* Title */}
      <div>
        <label
          className={labelClass}
          style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}
        >
          {t("titleLabel")} <span style={{ color: "var(--error)" }}>*</span>
        </label>
        <input
          {...register("title")}
          placeholder={t("titlePlaceholder")}
          className={inputClass}
        />
        {errors.title && (
          <p className="mt-1 text-sm" style={{ color: "var(--error)", fontFamily: "var(--font-body)" }}>
            {errors.title.message}
          </p>
        )}
      </div>

      {/* Description + voice input (F-302) */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label
            className={labelClass + " !mb-0"}
            style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}
          >
            {t("descriptionLabel")}
          </label>
          <button
            type="button"
            onClick={toggleVoice}
            className="flex items-center gap-1.5 h-7 px-2.5 rounded-[--radius-sm] text-xs font-medium transition-colors duration-150 cursor-pointer"
            style={{
              backgroundColor: listening ? "var(--error-light)" : "var(--accent-light)",
              color: listening ? "var(--error)" : "var(--primary)",
              fontFamily: "var(--font-body)",
            }}
          >
            {listening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            {listening ? t("voiceStop") : t("voiceStart")}
          </button>
        </div>
        <textarea
          {...register("description")}
          rows={3}
          placeholder={t("descriptionPlaceholder")}
          className={`${inputClass} h-auto py-3 resize-none`}
          style={{
            outline: listening ? "2px solid var(--error)" : undefined,
          }}
        />
      </div>

      {/* Job type (F-310) */}
      <div>
        <label
          className={labelClass}
          style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}
        >
          {t("jobTypeLabel")}
        </label>
        <select
          {...register("jobType")}
          className={inputClass}
          style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}
        >
          <option value="service">{t("typeService")}</option>
          <option value="project">{t("typeProject")}</option>
          <option value="recurring">{t("typeRecurring")}</option>
        </select>
      </div>

      {/* Scheduled date + End date */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            className={labelClass}
            style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}
          >
            {t("scheduledDateLabel")}
          </label>
          <input
            {...register("scheduledDate")}
            type="date"
            className={inputClass}
          />
        </div>
        <div>
          <label
            className={labelClass}
            style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}
          >
            {t("endDateLabel")}
          </label>
          <input
            {...register("endDate")}
            type="date"
            className={inputClass}
          />
        </div>
      </div>

      {/* Notes (internal) */}
      <div>
        <label
          className={labelClass}
          style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}
        >
          {t("notesLabel")}
        </label>
        <textarea
          {...register("notes")}
          rows={3}
          placeholder={t("notesPlaceholder")}
          className={`${inputClass} h-auto py-3 resize-none`}
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={saving}
        className="w-full h-12 px-6 rounded-[--radius-md] font-medium text-base transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer"
        style={{
          backgroundColor: "var(--primary)",
          color: "var(--primary-foreground)",
          fontFamily: "var(--font-body)",
          boxShadow: "var(--shadow-accent)",
        }}
      >
        {saving ? t("saving") : job ? t("saveButton") : t("createButton")}
      </button>
    </form>
  )
}
