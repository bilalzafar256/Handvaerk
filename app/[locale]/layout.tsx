import type { Metadata } from "next"
import { ClerkProvider } from "@clerk/nextjs"
import { NextIntlClientProvider, hasLocale } from "next-intl"
import { getMessages, setRequestLocale } from "next-intl/server"
import { notFound } from "next/navigation"
import { Analytics } from "@vercel/analytics/next"
import { routing } from "@/i18n/routing"
import { Toaster } from "@/components/ui/sonner"
import { AnalyticsProvider } from "@/components/shared/analytics-provider"
import "@/app/globals.css"

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export const metadata: Metadata = {
  title: { template: "%s | Håndværk Pro", default: "Håndværk Pro" },
  description: "Job management for Danish tradespeople",
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params

  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  setRequestLocale(locale)

  const messages = await getMessages()

  return (
    <ClerkProvider>
      <html lang={locale}>
        <body>
          <NextIntlClientProvider messages={messages}>
            <AnalyticsProvider>
              {children}
            </AnalyticsProvider>
            <Toaster position="top-center" />
            <Analytics />
          </NextIntlClientProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
