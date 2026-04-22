import { useState, useEffect } from "react"

export interface CvrResult {
  name: string
  cvr: string
  address: string
  zip: string
  city: string
  companyType: string
}

export function useCvrSearch(query: string) {
  const [result, setResult] = useState<CvrResult | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (query.trim().length < 2) {
      setResult(null)
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/cvr?q=${encodeURIComponent(query.trim())}`)
        const data = await res.json()
        setResult(data)
      } catch {
        setResult(null)
      } finally {
        setLoading(false)
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [query])

  return { result, loading }
}
