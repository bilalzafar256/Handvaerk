export type Tier = "free" | "solo" | "hold"

export const TIER_LIMITS = {
  free: {
    activeJobs: 3,
  },
  solo: {
    activeJobs: Infinity,
  },
  hold: {
    activeJobs: Infinity,
  },
} as const

export function canCreateJob(tier: Tier, activeJobCount: number): boolean {
  return activeJobCount < TIER_LIMITS[tier].activeJobs
}
