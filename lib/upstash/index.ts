import { Redis } from "@upstash/redis"
import { Ratelimit } from "@upstash/ratelimit"

export const redis = Redis.fromEnv()

// General: 20 requests per 10 seconds per user
export const rateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "10 s"),
  analytics: true,
  prefix: "haandvaerk:ratelimit",
})

// Strict: 5 per minute — for auth/sensitive mutations
export const strictRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "60 s"),
  analytics: true,
  prefix: "haandvaerk:ratelimit:strict",
})

// AI: 10 per minute — for AI-powered features
export const aiRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "60 s"),
  analytics: true,
  prefix: "haandvaerk:ratelimit:ai",
})
