"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useLocale } from "next-intl"

const STORAGE_KEY = "cookie_consent"

export function CookieConsent() {
  const [visible, setVisible] = useState(false)
  const locale = useLocale()

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) setVisible(true)
  }, [])

  function accept() {
    localStorage.setItem(STORAGE_KEY, "accepted")
    setVisible(false)
  }

  function decline() {
    localStorage.setItem(STORAGE_KEY, "declined")
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 rounded-xl border p-4 shadow-lg"
      style={{
        backgroundColor: "var(--surface)",
        borderColor: "var(--border)",
        boxShadow: "var(--shadow-lg)",
      }}
    >
      <p
        className="text-sm font-medium mb-1"
        style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}
      >
        We use analytics cookies
      </p>
      <p
        className="text-xs mb-3"
        style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}
      >
        We use PostHog to improve the product. No advertising. No selling of data.{" "}
        <Link
          href={`/${locale}/privacy`}
          className="underline"
          style={{ color: "var(--primary)" }}
        >
          Privacy policy
        </Link>
      </p>
      <div className="flex gap-2">
        <button
          onClick={accept}
          className="flex-1 h-9 rounded-lg text-sm font-medium"
          style={{
            backgroundColor: "var(--primary)",
            color: "var(--primary-foreground)",
            fontFamily: "var(--font-body)",
          }}
        >
          Accept
        </button>
        <button
          onClick={decline}
          className="flex-1 h-9 rounded-lg text-sm font-medium"
          style={{
            backgroundColor: "var(--background-subtle)",
            color: "var(--text-primary)",
            fontFamily: "var(--font-body)",
          }}
        >
          Decline
        </button>
      </div>
    </div>
  )
}
