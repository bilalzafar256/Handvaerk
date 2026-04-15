"use client"

import type { Tier } from "@/lib/utils/tier"

interface TierGateProps {
  requiredTier: Tier
  userTier: Tier
  children: React.ReactNode
  fallback?: React.ReactNode
}

const TIER_RANK: Record<Tier, number> = { free: 0, solo: 1, hold: 2 }

/**
 * Renders children only if userTier meets the requiredTier.
 * Otherwise renders fallback (or an upgrade prompt).
 */
export function TierGate({
  requiredTier,
  userTier,
  children,
  fallback,
}: TierGateProps) {
  const hasAccess = TIER_RANK[userTier] >= TIER_RANK[requiredTier]

  if (hasAccess) return <>{children}</>

  return (
    <>
      {fallback ?? (
        <div className="rounded-lg border border-dashed border-border p-6 text-center">
          <p className="text-sm text-muted-foreground">
            This feature requires a higher plan.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Upgrade coming soon — stay tuned.
          </p>
        </div>
      )}
    </>
  )
}
