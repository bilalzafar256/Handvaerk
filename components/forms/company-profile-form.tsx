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
  /** Render fields in a 2-column grid */
  twoColumn?: boolean
}

export function CompanyProfileForm({
  initialValues,
  redirectTo,
  compact = false,
  twoColumn = false,
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

  const inputClass = "w-full h-12 px-4 rounded-[--radius-sm] border transition-colors duration-150 focus:outline-none focus:ring-2"
  const inputStyle = (hasError = false) => ({
    fontFamily: "var(--font-body)",
    backgroundColor: "var(--surface)",
    color: "var(--text-primary)",
    borderColor: hasError ? "var(--error)" : "var(--border)",
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      {/* Row 1: Company Name + CVR */}
      <div className={twoColumn ? "grid grid-cols-2 gap-3" : "flex flex-col gap-5"}>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="companyName" className="text-sm font-medium" style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}>
            {t("companyNameLabel")}<span style={{ color: "var(--error)" }}> *</span>
          </label>
          <input
            id="companyName"
            {...register("companyName")}
            placeholder={t("companyNamePlaceholder")}
            className={inputClass}
            style={inputStyle(!!errors.companyName)}
          />
          {errors.companyName && (
            <p className="text-xs" style={{ color: "var(--error)", fontFamily: "var(--font-body)" }}>{t("companyNameRequired")}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="cvrNumber" className="text-sm font-medium" style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}>
            {t("cvrLabel")}
          </label>
          <input
            id="cvrNumber"
            {...register("cvrNumber")}
            placeholder={t("cvrPlaceholder")}
            inputMode="numeric"
            className={inputClass}
            style={{ ...inputStyle(), fontFamily: "var(--font-mono)" }}
          />
        </div>
      </div>

      {!compact && (
        <>
          {/* Address (full width) */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="addressLine1" className="text-sm font-medium" style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}>
              {t("addressLabel")}
            </label>
            <input
              id="addressLine1"
              {...register("addressLine1")}
              placeholder={t("addressPlaceholder")}
              className={inputClass}
              style={inputStyle()}
            />
          </div>

          {/* ZIP + City + Hourly rate in a grid */}
          <div className={twoColumn ? "grid grid-cols-3 gap-3" : "grid grid-cols-2 gap-3"}>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="addressZip" className="text-sm font-medium" style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}>
                {t("zipLabel")}
              </label>
              <input
                id="addressZip"
                {...register("addressZip")}
                placeholder={t("zipPlaceholder")}
                inputMode="numeric"
                className={inputClass}
                style={{ ...inputStyle(), fontFamily: "var(--font-mono)" }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="addressCity" className="text-sm font-medium" style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}>
                {t("cityLabel")}
              </label>
              <input
                id="addressCity"
                {...register("addressCity")}
                placeholder={t("cityPlaceholder")}
                className={inputClass}
                style={inputStyle()}
              />
            </div>
            {twoColumn && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="hourlyRate" className="text-sm font-medium" style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}>
                  {t("hourlyRateLabel")}
                </label>
                <div className="relative">
                  <input
                    id="hourlyRate"
                    {...register("hourlyRate")}
                    placeholder={t("hourlyRatePlaceholder")}
                    inputMode="decimal"
                    className={`${inputClass} pr-14`}
                    style={{ ...inputStyle(), fontFamily: "var(--font-mono)" }}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm" style={{ fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
                    kr.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Hourly rate — only shown in single-column mode */}
          {!twoColumn && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="hourlyRate" className="text-sm font-medium" style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}>
                {t("hourlyRateLabel")}
              </label>
              <div className="relative">
                <input
                  id="hourlyRate"
                  {...register("hourlyRate")}
                  placeholder={t("hourlyRatePlaceholder")}
                  inputMode="decimal"
                  className={`${inputClass} pr-14`}
                  style={{ ...inputStyle(), fontFamily: "var(--font-mono)" }}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm" style={{ fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
                  kr.
                </span>
              </div>
            </div>
          )}
        </>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-12 px-6 rounded-[--radius-md] font-medium text-base transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center"
        style={{
          fontFamily: "var(--font-body)",
          backgroundColor: "var(--amber-500)",
          color: "var(--accent-foreground-brand)",
          boxShadow: "var(--shadow-accent)",
        }}
      >
        {isSubmitting ? t("saving") : compact ? t("continueButton") : t("saveButton")}
      </button>
    </form>
  )
}
