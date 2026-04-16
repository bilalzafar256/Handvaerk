"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { ViewMode } from "@/components/shared/view-toggle"

type ModalType = "createJob" | "createCustomer" | "createInvoice" | null

interface UIState {
  // Modal
  activeModal: ModalType
  openModal: (modal: ModalType) => void
  closeModal: () => void

  // Sidebar (desktop)
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void

  // View preferences (persisted)
  viewPreferences: Record<string, ViewMode>
  setViewPreference: (key: string, mode: ViewMode) => void
  getViewPreference: (key: string, defaultMode?: ViewMode) => ViewMode
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      activeModal: null,
      openModal: (modal) => set({ activeModal: modal }),
      closeModal: () => set({ activeModal: null }),

      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      viewPreferences: {},
      setViewPreference: (key, mode) =>
        set((state) => ({
          viewPreferences: { ...state.viewPreferences, [key]: mode },
        })),
      getViewPreference: (key, defaultMode = "list") => {
        return get().viewPreferences[key] ?? defaultMode
      },
    }),
    {
      name: "handvaerk-ui",
      // Only persist view preferences and sidebar state; modals are ephemeral
      partialize: (state) => ({
        viewPreferences: state.viewPreferences,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
)
