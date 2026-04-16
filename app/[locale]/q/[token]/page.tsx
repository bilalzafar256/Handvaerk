import { setRequestLocale } from "next-intl/server"
import { notFound } from "next/navigation"
import { getQuoteByToken } from "@/lib/db/queries/quotes"
import { PublicQuoteView } from "@/components/quotes/public-quote-view"

export const dynamic = "force-dynamic"

type Props = { params: Promise<{ locale: string; token: string }> }

export async function generateMetadata({ params }: Props) {
  const { token } = await params
  const quote = await getQuoteByToken(token)
  if (!quote) return { title: "Quote not found" }
  return { title: `Tilbud ${quote.quoteNumber} | Håndværk Pro` }
}

export default async function PublicQuotePage({ params }: Props) {
  const { locale, token } = await params
  setRequestLocale(locale)

  const quote = await getQuoteByToken(token)
  if (!quote) notFound()

  return <PublicQuoteView quote={quote} />
}
