"use client"

import { useState, useEffect } from "react"
import type { ViewMode } from "@/components/shared/view-toggle"

export function useViewPreference(key: string, defaultMode: ViewMode = "list") {
  const [mode, setMode] = useState<ViewMode>(defaultMode)

  useEffect(() => {
    const stored = localStorage.getItem(`view:${key}`)
    if (stored === "list" || stored === "card" || stored === "table") {
      setMode(stored)
    }
  }, [key])

  function change(next: ViewMode) {
    setMode(next)
    localStorage.setItem(`view:${key}`, next)
  }

  return [mode, change] as const
}
