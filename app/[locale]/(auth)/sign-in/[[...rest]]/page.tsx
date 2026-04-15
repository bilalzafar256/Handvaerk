import { SignIn } from "@clerk/nextjs"
import { setRequestLocale } from "next-intl/server"

export const dynamic = "force-dynamic"

type Props = { params: Promise<{ locale: string }> }

export default async function SignInPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  return <SignIn />
}
