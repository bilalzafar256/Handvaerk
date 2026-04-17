import type { Metadata } from "next"
import { ClerkProvider } from "@clerk/nextjs"
import { NextIntlClientProvider, hasLocale } from "next-intl"
import { getMessages, setRequestLocale } from "next-intl/server"
import { notFound } from "next/navigation"
import { Analytics } from "@vercel/analytics/next"
import { Bricolage_Grotesque, DM_Sans, JetBrains_Mono } from "next/font/google"
import { routing } from "@/i18n/routing"
import { Toaster } from "@/components/ui/sonner"
import { AnalyticsProvider } from "@/components/shared/analytics-provider"
import "@/app/globals.css"

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
})

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["300", "400", "500", "600"],
  display: "swap",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
  display: "swap",
})

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
      <html lang={locale} className={`dark ${bricolage.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}>
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
