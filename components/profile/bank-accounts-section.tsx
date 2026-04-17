"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Star, Trash2, Plus } from "lucide-react"
import { useTranslations } from "next-intl"
import {
  addBankAccountAction,
  setBankAccountDefaultAction,
  deleteBankAccountAction,
} from "@/lib/actions/bank-accounts"
import { updateMobilepayAction } from "@/lib/actions/profile"
import type { BankAccount } from "@/lib/db/schema/bank-accounts"

interface BankAccountsSectionProps {
  accounts: BankAccount[]
  mobilepayNumber?: string | null
}

const inputCls = `
  w-full h-11 px-3
  bg-[var(--background)] text-[var(--foreground)]
  border border-[var(--border)]
  rounded-lg
  placeholder:opacity-40
  focus:outline-none focus:ring-2 focus:ring-[var(--primary)]
  transition-colors duration-150 text-sm
`

export function BankAccountsSection({ accounts: initialAccounts, mobilepayNumber: initialMobilepay }: BankAccountsSectionProps) {
  const t = useTranslations("Profile")
  const [accounts, setAccounts] = useState<BankAccount[]>(initialAccounts)
  const [showAddForm, setShowAddForm] = useState(false)
  const [bankName, setBankName] = useState("")
  const [regNumber, setRegNumber] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [mobilepay, setMobilepay] = useState(initialMobilepay ?? "")
  const [isPending, startTransition] = useTransition()

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!regNumber.trim() || !accountNumber.trim()) {
      toast.error("Reg. number and account number are required")
      return
    }

    startTransition(async () => {
      try {
        const result = await addBankAccountAction({
          bankName: bankName.trim() || undefined,
          regNumber: regNumber.trim(),
          accountNumber: accountNumber.trim(),
        })
        // Optimistic update
        const newAccount: BankAccount = {
          id: result.id,
          userId: "",
          bankName: bankName.trim() || null,
          regNumber: regNumber.trim(),
          accountNumber: accountNumber.trim(),
          isDefault: accounts.length === 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        setAccounts(prev => [...prev, newAccount])
        setBankName("")
        setRegNumber("")
        setAccountNumber("")
        setShowAddForm(false)
        toast.success("Bank account added")
      } catch {
        toast.error("Failed to add bank account")
      }
    })
  }

  function handleSetDefault(id: string) {
    startTransition(async () => {
      try {
        await setBankAccountDefaultAction(id)
        setAccounts(prev => prev.map(a => ({ ...a, isDefault: a.id === id })))
        toast.success("Default account updated")
      } catch {
        toast.error("Failed to update default")
      }
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      try {
        await deleteBankAccountAction(id)
        setAccounts(prev => prev.filter(a => a.id !== id))
        toast.success("Bank account removed")
      } catch {
        toast.error("Failed to delete bank account")
      }
    })
  }

  function handleSaveMobilepay(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      try {
        await updateMobilepayAction(mobilepay.trim())
        toast.success("MobilePay number saved")
      } catch {
        toast.error("Failed to save MobilePay number")
      }
    })
  }

  return (
    <div
      className="mx-4 mt-4 rounded-[--radius-lg] border overflow-hidden"
      style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-sm)" }}
    >
      {/* Section header */}
      <div
        className="px-5 py-3 border-b"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--background-subtle)" }}
      >
        <p
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ fontFamily: "var(--font-body)", color: "var(--text-tertiary)" }}
        >
          {t("bankDetails")}
        </p>
      </div>

      <div className="p-5 space-y-6">

        {/* Bank accounts subsection */}
        <div>
          <p
            className="text-sm font-medium mb-3"
            style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}
          >
            {t("bankAccounts")}
          </p>

          {accounts.length === 0 && !showAddForm && (
            <p
              className="text-sm mb-3"
              style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}
            >
              {t("noBankAccounts")}
            </p>
          )}

          {/* Account list */}
          <div className="space-y-2 mb-3">
            {accounts.map(account => (
              <div
                key={account.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg border"
                style={{ borderColor: "var(--border)", backgroundColor: "var(--background)" }}
              >
                <div className="flex-1 min-w-0">
                  {account.bankName && (
                    <p
                      className="text-sm font-medium truncate"
                      style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)" }}
                    >
                      {account.bankName}
                    </p>
                  )}
                  <p
                    className="text-sm"
                    style={{ fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}
                  >
                    Reg. {account.regNumber} | Konto {account.accountNumber}
                  </p>
                </div>

                {/* Star (default) button */}
                <button
                  type="button"
                  onClick={() => !account.isDefault && handleSetDefault(account.id)}
                  disabled={isPending || !!account.isDefault}
                  className="flex-shrink-0 p-1.5 rounded-md transition-colors cursor-pointer disabled:cursor-default"
                  style={{ color: account.isDefault ? "var(--primary)" : "var(--text-tertiary)" }}
                  title={t("setDefault")}
                >
                  <Star
                    className="w-4 h-4"
                    fill={account.isDefault ? "var(--primary)" : "none"}
                    strokeWidth={account.isDefault ? 0 : 2}
                  />
                </button>

                {/* Delete button */}
                <button
                  type="button"
                  onClick={() => handleDelete(account.id)}
                  disabled={isPending}
                  className="flex-shrink-0 p-1.5 rounded-md transition-colors hover:bg-[var(--error-subtle,#fee2e2)] cursor-pointer"
                  style={{ color: "var(--error)" }}
                  title={t("deleteAccount")}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Inline add form */}
          {showAddForm ? (
            <form onSubmit={handleAdd} className="space-y-3 p-3 rounded-lg border" style={{ borderColor: "var(--border)", backgroundColor: "var(--background)" }}>
              <div>
                <label
                  className="block text-xs font-medium mb-1"
                  style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}
                >
                  {t("bankName")}
                </label>
                <input
                  type="text"
                  className={inputCls}
                  placeholder={t("bankNamePlaceholder")}
                  value={bankName}
                  onChange={e => setBankName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    className="block text-xs font-medium mb-1"
                    style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}
                  >
                    {t("regNumber")} <span style={{ color: "var(--error)" }}>*</span>
                  </label>
                  <input
                    type="text"
                    className={inputCls}
                    placeholder={t("regNumberPlaceholder")}
                    value={regNumber}
                    onChange={e => setRegNumber(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label
                    className="block text-xs font-medium mb-1"
                    style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}
                  >
                    {t("accountNumber")} <span style={{ color: "var(--error)" }}>*</span>
                  </label>
                  <input
                    type="text"
                    className={inputCls}
                    placeholder={t("accountNumberPlaceholder")}
                    value={accountNumber}
                    onChange={e => setAccountNumber(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="h-9 px-4 rounded-lg text-sm font-medium cursor-pointer disabled:opacity-60 transition-opacity"
                  style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)", fontFamily: "var(--font-body)" }}
                >
                  {t("add")}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowAddForm(false); setBankName(""); setRegNumber(""); setAccountNumber("") }}
                  className="h-9 px-4 rounded-lg text-sm font-medium cursor-pointer transition-colors hover:bg-[var(--accent)]"
                  style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}
                >
                  {t("cancel")}
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-medium cursor-pointer transition-colors hover:bg-[var(--accent)]"
              style={{ color: "var(--primary)", fontFamily: "var(--font-body)" }}
            >
              <Plus className="w-4 h-4" />
              {t("addBankAccount")}
            </button>
          )}
        </div>

        {/* Divider */}
        <div style={{ height: 1, backgroundColor: "var(--border)" }} />

        {/* MobilePay subsection */}
        <div>
          <p
            className="text-sm font-medium mb-3"
            style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}
          >
            {t("mobilepay")}
          </p>
          <form onSubmit={handleSaveMobilepay} className="flex gap-2 items-end">
            <div className="flex-1">
              <label
                className="block text-xs font-medium mb-1"
                style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}
              >
                {t("mobilepayNumber")}
              </label>
              <input
                type="text"
                className={inputCls}
                placeholder={t("mobilepayPlaceholder")}
                value={mobilepay}
                onChange={e => setMobilepay(e.target.value)}
                style={{ fontFamily: "var(--font-mono)" }}
              />
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="h-11 px-4 rounded-lg text-sm font-medium cursor-pointer disabled:opacity-60 transition-opacity flex-shrink-0"
              style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)", fontFamily: "var(--font-body)" }}
            >
              {t("saveMobilepay")}
            </button>
          </form>
        </div>

      </div>
    </div>
  )
}
