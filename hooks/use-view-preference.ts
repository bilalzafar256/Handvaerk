"use client"

import { useUIStore } from "@/stores/ui-store"
import type { ViewMode } from "@/components/shared/view-toggle"

export function useViewPreference(key: string, defaultMode: ViewMode = "list") {
  const mode = useUIStore((s) => s.viewPreferences[key] ?? defaultMode)
  const setViewPreference = useUIStore((s) => s.setViewPreference)

  function change(next: ViewMode) {
    setViewPreference(key, next)
  }

  return [mode, change] as const
}
