/**
 * Format a number as Danish kroner.
 * Always use this for all money display — never format money inline.
 */
export function formatDKK(amount: number | string | null | undefined): string {
  const num = typeof amount === "string" ? parseFloat(amount) : (amount ?? 0)
  if (isNaN(num)) return "0,00 kr."

  return new Intl.NumberFormat("da-DK", {
    style: "currency",
    currency: "DKK",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
}
