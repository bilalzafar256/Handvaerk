"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { toast } from "sonner"
import { useState } from "react"
import { createCustomerAction, updateCustomerAction } from "@/lib/actions/customers"
import type { Customer } from "@/lib/db/schema/customers"

const schema = z.object({
  name:         z.string().min(1, "Name is required"),
  phone:        z.string().optional(),
  email:        z.string().email("Invalid email").optional().or(z.literal("")),
  addressLine1: z.string().optional(),
  addressCity:  z.string().optional(),
  addressZip:   z.string().optional(),
  cvrNumber:    z.string().optional(),
  notes:        z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface CustomerFormProps {
  customer?: Customer
}

export function CustomerForm({ customer }: CustomerFormProps) {
  const t = useTranslations("CustomerForm")
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name:         customer?.name ?? "",
      phone:        customer?.phone ?? "",
      email:        customer?.email ?? "",
      addressLine1: customer?.addressLine1 ?? "",
      addressCity:  customer?.addressCity ?? "",
      addressZip:   customer?.addressZip ?? "",
      cvrNumber:    customer?.cvrNumber ?? "",
      notes:        customer?.notes ?? "",
    },
  })

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
    bg-[--surface] text-[--text-primary]
    font-body text-base
    border border-[--border]
    rounded-[--radius-sm]
    placeholder:text-[--text-tertiary]
    focus:outline-none focus:border-[--accent]
    focus:ring-2 focus:ring-[--accent]/20
    transition-colors duration-150
  `

  const labelClass = "block text-sm font-medium mb-1.5"

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 px-4 pb-8">
      {/* Name */}
      <div>
        <label
          className={labelClass}
          style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}
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
      </div>

      {/* Phone */}
      <div>
        <label
          className={labelClass}
          style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}
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

      {/* Email */}
      <div>
        <label
          className={labelClass}
          style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}
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
          style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}
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
            style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}
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
            style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}
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

      {/* CVR number (F-208) */}
      <div>
        <label
          className={labelClass}
          style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}
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

      {/* Notes (F-209) */}
      <div>
        <label
          className={labelClass}
          style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}
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
