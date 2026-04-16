"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { toast } from "sonner"
import { updateProfile, type ProfileFormData } from "@/lib/actions/profile"

const profileSchema = z.object({
  companyName: z.string().min(1),
  cvrNumber: z.string().optional(),
  addressLine1: z.string().optional(),
  addressCity: z.string().optional(),
  addressZip: z.string().optional(),
  hourlyRate: z.string().optional(),
})

interface CompanyProfileFormProps {
  initialValues?: Partial<ProfileFormData>
  /** If set, router.push(redirectTo) on success */
  redirectTo?: string
  /** Only show core fields (name + CVR) for onboarding */
  compact?: boolean
}

export function CompanyProfileForm({
  initialValues,
  redirectTo,
  compact = false,
}: CompanyProfileFormProps) {
  const t = useTranslations("ProfileForm")
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      companyName: initialValues?.companyName ?? "",
      cvrNumber: initialValues?.cvrNumber ?? "",
      addressLine1: initialValues?.addressLine1 ?? "",
      addressCity: initialValues?.addressCity ?? "",
      addressZip: initialValues?.addressZip ?? "",
      hourlyRate: initialValues?.hourlyRate?.toString() ?? "",
    },
  })

  async function onSubmit(data: ProfileFormData) {
    try {
      await updateProfile(data)
      toast.success(t("saveSuccess"))
      if (redirectTo) {
        router.push(redirectTo)
      } else {
        router.refresh()
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("saveError"))
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      {/* Company Name */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="companyName"
          className="text-sm font-medium"
          style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}
        >
          {t("companyNameLabel")}
          <span style={{ color: "var(--error)" }}> *</span>
        </label>
        <input
          id="companyName"
          {...register("companyName")}
          placeholder={t("companyNamePlaceholder")}
          className="w-full h-12 px-4 rounded-[--radius-sm] border transition-colors duration-150 focus:outline-none focus:ring-2"
          style={{
            fontFamily: "var(--font-body)",
            backgroundColor: "var(--surface)",
            color: "var(--text-primary)",
            borderColor: errors.companyName ? "var(--error)" : "var(--border)",
          }}
        />
        {errors.companyName && (
          <p className="text-xs" style={{ color: "var(--error)", fontFamily: "var(--font-body)" }}>
            {t("companyNameRequired")}
          </p>
        )}
      </div>

      {/* CVR Number */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="cvrNumber"
          className="text-sm font-medium"
          style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}
        >
          {t("cvrLabel")}
        </label>
        <input
          id="cvrNumber"
          {...register("cvrNumber")}
          placeholder={t("cvrPlaceholder")}
          inputMode="numeric"
          className="w-full h-12 px-4 rounded-[--radius-sm] border transition-colors duration-150 focus:outline-none focus:ring-2"
          style={{
            fontFamily: "var(--font-mono)",
            backgroundColor: "var(--surface)",
            color: "var(--text-primary)",
            borderColor: "var(--border)",
          }}
        />
      </div>

      {!compact && (
        <>
          {/* Address */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="addressLine1"
              className="text-sm font-medium"
              style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}
            >
              {t("addressLabel")}
            </label>
            <input
              id="addressLine1"
              {...register("addressLine1")}
              placeholder={t("addressPlaceholder")}
              className="w-full h-12 px-4 rounded-[--radius-sm] border transition-colors duration-150 focus:outline-none focus:ring-2"
              style={{
                fontFamily: "var(--font-body)",
                backgroundColor: "var(--surface)",
                color: "var(--text-primary)",
                borderColor: "var(--border)",
              }}
            />
          </div>

          {/* City + ZIP */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="addressZip"
                className="text-sm font-medium"
                style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}
              >
                {t("zipLabel")}
              </label>
              <input
                id="addressZip"
                {...register("addressZip")}
                placeholder={t("zipPlaceholder")}
                inputMode="numeric"
                className="w-full h-12 px-4 rounded-[--radius-sm] border transition-colors duration-150 focus:outline-none focus:ring-2"
                style={{
                  fontFamily: "var(--font-mono)",
                  backgroundColor: "var(--surface)",
                  color: "var(--text-primary)",
                  borderColor: "var(--border)",
                }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="addressCity"
                className="text-sm font-medium"
                style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}
              >
                {t("cityLabel")}
              </label>
              <input
                id="addressCity"
                {...register("addressCity")}
                placeholder={t("cityPlaceholder")}
                className="w-full h-12 px-4 rounded-[--radius-sm] border transition-colors duration-150 focus:outline-none focus:ring-2"
                style={{
                  fontFamily: "var(--font-body)",
                  backgroundColor: "var(--surface)",
                  color: "var(--text-primary)",
                  borderColor: "var(--border)",
                }}
              />
            </div>
          </div>

          {/* Hourly Rate */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="hourlyRate"
              className="text-sm font-medium"
              style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}
            >
              {t("hourlyRateLabel")}
            </label>
            <div className="relative">
              <input
                id="hourlyRate"
                {...register("hourlyRate")}
                placeholder={t("hourlyRatePlaceholder")}
                inputMode="decimal"
                className="w-full h-12 pl-4 pr-14 rounded-[--radius-sm] border transition-colors duration-150 focus:outline-none focus:ring-2"
                style={{
                  fontFamily: "var(--font-mono)",
                  backgroundColor: "var(--surface)",
                  color: "var(--text-primary)",
                  borderColor: "var(--border)",
                }}
              />
              <span
                className="absolute right-4 top-1/2 -translate-y-1/2 text-sm"
                style={{ fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}
              >
                kr.
              </span>
            </div>
          </div>
        </>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-12 px-6 rounded-[--radius-md] font-medium text-base transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        style={{
          fontFamily: "var(--font-body)",
          backgroundColor: "var(--accent)",
          color: "var(--accent-foreground)",
          boxShadow: "var(--shadow-accent)",
        }}
      >
        {isSubmitting ? t("saving") : compact ? t("continueButton") : t("saveButton")}
      </button>
    </form>
  )
}
