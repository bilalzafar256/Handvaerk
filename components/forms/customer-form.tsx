"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { toast } from "sonner"
import { useState, useRef } from "react"
import { createCustomerAction, updateCustomerAction } from "@/lib/actions/customers"
import type { Customer } from "@/lib/db/schema/customers"
import { useCvrSearch } from "@/hooks/use-cvr-search"

const schema = z.object({
  name:             z.string().min(1, "Name is required"),
  contactPerson:    z.string().optional(),
  phone:            z.string().optional(),
  secondPhone:      z.string().optional(),
  email:            z.string().email("Invalid email").optional().or(z.literal("")),
  addressLine1:     z.string().optional(),
  addressCity:      z.string().optional(),
  addressZip:       z.string().optional(),
  country:          z.string().optional(),
  cvrNumber:        z.string().optional(),
  eanNumber:        z.string().optional(),
  notes:            z.string().optional(),
  paymentTermsDays: z.number().int().min(1).optional(),
  preferredLanguage: z.enum(["da", "en"]).optional(),
  vatExempt:        z.boolean().optional(),
})

type FormData = z.infer<typeof schema>

interface CustomerFormProps {
  customer?: Customer
  initialValues?: Partial<{
    name: string
    contactPerson: string
    phone: string
    secondPhone: string
    email: string
    addressLine1: string
    addressCity: string
    addressZip: string
    country: string
    cvrNumber: string
    eanNumber: string
    notes: string
    paymentTermsDays: number
    preferredLanguage: "da" | "en"
    vatExempt: boolean
  }>
}

const PUBLIC_KEYWORDS = [
  "kommune", "kommunen", "kommunal",
  "region", "regionen",
  "sygehus", "hospital",
  "folkeskole", "skolen", "gymnasium", "gymnasiet",
  "professionshøjskole", "erhvervsskole", "erhvervsakademi",
  "universitet", "universitetet",
  "ministerium", "ministerie",
  "styrelse", "direktorat",
  "politi", "politiet",
  "rådhus", "forvaltning",
]

function detectEntityType(name: string, companyType?: string): "public" | "business" | "unknown" {
  const lname = name.toLowerCase()
  const ltype = (companyType ?? "").toLowerCase()
  if (
    PUBLIC_KEYWORDS.some(k => lname.includes(k)) ||
    ["komm", "region", "staten", "stat"].some(t => ltype.includes(t))
  ) return "public"
  if (
    ["a/s", "aps", "i/s", "k/s", "ivs", "p/s"].some(t => ltype.includes(t)) ||
    ltype.includes("selskab") || ltype.includes("virksomhed")
  ) return "business"
  return "unknown"
}

export function CustomerForm({ customer, initialValues }: CustomerFormProps) {
  const t = useTranslations("CustomerForm")
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [showEanPrompt, setShowEanPrompt] = useState(() => {
    const name = customer?.name ?? initialValues?.name ?? ""
    const hasEan = !!(customer?.eanNumber ?? initialValues?.eanNumber)
    return !hasEan && detectEntityType(name) === "public"
  })
  const eanRef = useRef<HTMLInputElement | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name:             customer?.name ?? initialValues?.name ?? "",
      contactPerson:    customer?.contactPerson ?? initialValues?.contactPerson ?? "",
      phone:            customer?.phone ?? initialValues?.phone ?? "",
      secondPhone:      customer?.secondPhone ?? initialValues?.secondPhone ?? "",
      email:            customer?.email ?? initialValues?.email ?? "",
      addressLine1:     customer?.addressLine1 ?? initialValues?.addressLine1 ?? "",
      addressCity:      customer?.addressCity ?? initialValues?.addressCity ?? "",
      addressZip:       customer?.addressZip ?? initialValues?.addressZip ?? "",
      country:          customer?.country ?? initialValues?.country ?? "DK",
      cvrNumber:        customer?.cvrNumber ?? initialValues?.cvrNumber ?? "",
      eanNumber:        customer?.eanNumber ?? initialValues?.eanNumber ?? "",
      notes:            customer?.notes ?? initialValues?.notes ?? "",
      paymentTermsDays: customer?.paymentTermsDays ?? initialValues?.paymentTermsDays ?? 14,
      preferredLanguage: (customer?.preferredLanguage ?? initialValues?.preferredLanguage ?? "da") as "da" | "en",
      vatExempt:        customer?.vatExempt ?? initialValues?.vatExempt ?? false,
    },
  })

  const nameValue = watch("name") ?? ""
  const { result: cvrResult } = useCvrSearch(nameValue)
  const showCvrSuggestion = !!cvrResult && nameValue !== cvrResult.name

  async function onSubmit(data: FormData) {
    setSaving(true)
    try {
      if (customer) {
        await updateCustomerAction(customer.id, data)
        toast.success(t("saveSuccess"))
        router.push(`/customers/${customer.id}`)
      } else {
        const { id } = await createCustomerAction(data)
        toast.success(t("saveSuccess"))
        router.push(`/customers/${id}`)
      }
    } catch {
      toast.error(t("saveError"))
      setSaving(false)
    }
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
      {/* Name */}
      <div>
        <label
          className={labelClass}
          style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}
        >
          {t("nameLabel")} <span style={{ color: "var(--error)" }}>*</span>
        </label>
        <input
          {...register("name")}
          placeholder={t("namePlaceholder")}
          className={inputClass}
        />
        {errors.name && (
          <p className="mt-1 text-sm" style={{ color: "var(--error)", fontFamily: "var(--font-body)" }}>
            {errors.name.message}
          </p>
        )}
        {showCvrSuggestion && (() => {
          const entityType = detectEntityType(cvrResult!.name, cvrResult!.companyType)
          return (
            <div className="mt-2 rounded-lg border overflow-hidden" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center gap-2 px-3 py-2.5" style={{ backgroundColor: "var(--accent)" }}>
                {entityType === "public" && (
                  <span className="inline-flex items-center px-1.5 h-5 rounded-full text-[11px] font-medium border flex-shrink-0"
                    style={{ backgroundColor: "oklch(0.92 0.07 155)", color: "oklch(0.36 0.14 155)", borderColor: "oklch(0.80 0.09 155)", fontFamily: "var(--font-body)" }}>
                    Public sector
                  </span>
                )}
                {entityType === "business" && (
                  <span className="inline-flex items-center px-1.5 h-5 rounded-full text-[11px] font-medium border flex-shrink-0"
                    style={{ backgroundColor: "oklch(0.93 0.05 290)", color: "oklch(0.40 0.14 290)", borderColor: "oklch(0.82 0.08 290)", fontFamily: "var(--font-body)" }}>
                    Business
                  </span>
                )}
                <div className="flex-1 min-w-0 text-sm truncate" style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}>
                  {cvrResult!.name}
                  <span className="mx-1.5 opacity-40">·</span>
                  <span style={{ fontFamily: "var(--font-mono)", color: "var(--muted-foreground)" }}>CVR {cvrResult!.cvr}</span>
                  <span className="mx-1.5 opacity-40">·</span>
                  <span style={{ color: "var(--muted-foreground)" }}>{cvrResult!.city}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setValue("name", cvrResult!.name)
                    setValue("cvrNumber", cvrResult!.cvr)
                    setValue("addressLine1", cvrResult!.address)
                    setValue("addressZip", cvrResult!.zip)
                    setValue("addressCity", cvrResult!.city)
                    if (entityType === "public") {
                      setShowEanPrompt(true)
                      setTimeout(() => eanRef.current?.focus(), 100)
                    }
                  }}
                  className="shrink-0 px-2.5 py-1 rounded-md text-xs font-medium"
                  style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)", fontFamily: "var(--font-body)" }}
                >
                  {t("cvrFill")}
                </button>
              </div>
              {entityType === "public" && (
                <div className="px-3 py-2 text-xs border-t flex items-center gap-1.5"
                  style={{ backgroundColor: "oklch(0.96 0.03 155)", borderColor: "oklch(0.88 0.05 155)", color: "oklch(0.36 0.14 155)", fontFamily: "var(--font-body)" }}>
                  <span>EAN number required for digital e-invoicing to this entity</span>
                </div>
              )}
            </div>
          )
        })()}
      </div>

      {/* Contact person */}
      <div>
        <label
          className={labelClass}
          style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}
        >
          {t("contactPersonLabel")}
        </label>
        <input
          {...register("contactPerson")}
          placeholder={t("contactPersonPlaceholder")}
          className={inputClass}
        />
      </div>

      {/* Phone */}
      <div>
        <label
          className={labelClass}
          style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}
        >
          {t("phoneLabel")}
        </label>
        <input
          {...register("phone")}
          type="tel"
          placeholder={t("phonePlaceholder")}
          className={inputClass}
        />
      </div>

      {/* Second phone */}
      <div>
        <label
          className={labelClass}
          style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}
        >
          {t("secondPhoneLabel")}
        </label>
        <input
          {...register("secondPhone")}
          type="tel"
          placeholder={t("secondPhonePlaceholder")}
          className={inputClass}
        />
      </div>

      {/* Email */}
      <div>
        <label
          className={labelClass}
          style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}
        >
          {t("emailLabel")}
        </label>
        <input
          {...register("email")}
          type="email"
          placeholder={t("emailPlaceholder")}
          className={inputClass}
        />
        {errors.email && (
          <p className="mt-1 text-sm" style={{ color: "var(--error)", fontFamily: "var(--font-body)" }}>
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Address */}
      <div>
        <label
          className={labelClass}
          style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}
        >
          {t("addressLabel")}
        </label>
        <input
          {...register("addressLine1")}
          placeholder={t("addressPlaceholder")}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            className={labelClass}
            style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}
          >
            {t("zipLabel")}
          </label>
          <input
            {...register("addressZip")}
            placeholder={t("zipPlaceholder")}
            className={inputClass}
          />
        </div>
        <div>
          <label
            className={labelClass}
            style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}
          >
            {t("cityLabel")}
          </label>
          <input
            {...register("addressCity")}
            placeholder={t("cityPlaceholder")}
            className={inputClass}
          />
        </div>
      </div>

      {/* Country */}
      <div>
        <label
          className={labelClass}
          style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}
        >
          {t("countryLabel")}
        </label>
        <input
          {...register("country")}
          placeholder={t("countryPlaceholder")}
          className={inputClass}
        />
      </div>

      {/* CVR number (F-208) */}
      <div>
        <label
          className={labelClass}
          style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}
        >
          {t("cvrLabel")}
        </label>
        <input
          {...register("cvrNumber")}
          placeholder={t("cvrPlaceholder")}
          className={inputClass}
          style={{ fontFamily: "var(--font-mono)" }}
        />
      </div>

      {/* EAN number */}
      <div>
        <label
          className={labelClass}
          style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}
        >
          {t("eanLabel")}
        </label>
        {showEanPrompt && (
          <div className="mb-2 flex items-center gap-2 rounded-lg border px-3 py-2"
            style={{ backgroundColor: "oklch(0.96 0.03 155)", borderColor: "oklch(0.80 0.09 155)" }}>
            <span className="text-xs font-medium" style={{ color: "oklch(0.36 0.14 155)", fontFamily: "var(--font-body)" }}>
              Public sector — add EAN for e-invoicing
            </span>
          </div>
        )}
        <input
          {...register("eanNumber")}
          ref={(el) => {
            register("eanNumber").ref(el)
            eanRef.current = el
          }}
          placeholder={t("eanPlaceholder")}
          className={inputClass}
          style={{
            fontFamily: "var(--font-mono)",
            ...(showEanPrompt ? { borderColor: "oklch(0.80 0.09 155)", boxShadow: "0 0 0 3px oklch(0.92 0.07 155 / 40%)" } : {}),
          }}
        />
      </div>

      {/* Billing settings */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            className={labelClass}
            style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}
          >
            {t("paymentTermsLabel")}
          </label>
          <select
            {...register("paymentTermsDays", { valueAsNumber: true })}
            className={inputClass}
            style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}
          >
            <option value={8}>Net 8</option>
            <option value={14}>Net 14</option>
            <option value={30}>Net 30</option>
            <option value={45}>Net 45</option>
          </select>
        </div>
        <div>
          <label
            className={labelClass}
            style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}
          >
            {t("preferredLanguageLabel")}
          </label>
          <select
            {...register("preferredLanguage")}
            className={inputClass}
            style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}
          >
            <option value="da">Danish</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>

      {/* VAT exempt */}
      <div className="flex items-center justify-between rounded-lg border px-4 h-12"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--background)" }}>
        <label
          className="text-sm font-medium cursor-pointer"
          style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}
        >
          {t("vatExemptLabel")}
        </label>
        <input
          {...register("vatExempt")}
          type="checkbox"
          className="w-4 h-4 rounded cursor-pointer"
          style={{ accentColor: "var(--primary)" }}
        />
      </div>

      {/* Notes (F-209) */}
      <div>
        <label
          className={labelClass}
          style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}
        >
          {t("notesLabel")}
        </label>
        <textarea
          {...register("notes")}
          rows={4}
          placeholder={t("notesPlaceholder")}
          className={`${inputClass} h-auto py-3 resize-none`}
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={saving}
        className="w-full h-12 px-6 rounded-[--radius-md] font-medium text-base transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        style={{
          backgroundColor: "var(--primary)",
          color: "var(--primary-foreground)",
          fontFamily: "var(--font-body)",
          boxShadow: "var(--shadow-accent)",
        }}
      >
        {saving ? t("saving") : customer ? t("saveButton") : t("createButton")}
      </button>
    </form>
  )
}
