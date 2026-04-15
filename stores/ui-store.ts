"use client"

import { create } from "zustand"

type ModalType = "createJob" | "createCustomer" | "createInvoice" | null

interface UIState {
  // Modal
  activeModal: ModalType
  openModal: (modal: ModalType) => void
  closeModal: () => void

  // Sidebar (desktop)
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  activeModal: null,
  openModal: (modal) => set({ activeModal: modal }),
  closeModal: () => set({ activeModal: null }),

  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}))
