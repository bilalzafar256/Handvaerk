"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "@/i18n/navigation"
import type { Job } from "@/lib/db/schema/jobs"
import type { Customer } from "@/lib/db/schema/customers"
import { Loader2 } from "lucide-react"

type JobWithCustomer = Job & { customer: Customer }

interface GeocodedJob {
  job: JobWithCustomer
  lat: number
  lon: number
  address: string
}

const STATUS_COLORS: Record<string, string> = {
  new:         "#0ea5e9",
  scheduled:   "#6366f1",
  in_progress: "#f59e0b",
  done:        "#a855f7",
  invoiced:    "#eab308",
  paid:        "#22c55e",
}

function jobAddress(job: JobWithCustomer): string {
  const site = [job.locationAddress, job.locationZip, job.locationCity].filter(Boolean).join(", ")
  if (site) return site
  return [job.customer.addressLine1, job.customer.addressZip, job.customer.addressCity]
    .filter(Boolean).join(", ")
}

async function geocode(address: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`,
      { headers: { "Accept-Language": "en" } }
    )
    const data = await r.json()
    if (!data[0]) return null
    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) }
  } catch {
    return null
  }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

interface JobMapViewProps {
  jobs: JobWithCustomer[]
  stripMode?: boolean
}

export function JobMapView({ jobs, stripMode }: JobMapViewProps) {
  const router = useRouter()
  const mapRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leafletMapRef = useRef<any>(null)
  const [progress, setProgress] = useState(0)
  const [total, setTotal] = useState(0)
  const [ready, setReady] = useState(false)
  const height = stripMode ? "100%" : "calc(100vh - 200px)"

  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return

    const jobsWithAddr = jobs.filter(j => jobAddress(j))
    setTotal(jobsWithAddr.length)

    // Lazy-load Leaflet (browser only)
    import("leaflet").then(async (L) => {
      if (!mapRef.current || leafletMapRef.current) return

      // Import Leaflet CSS dynamically
      if (!document.querySelector("#leaflet-css")) {
        const link = document.createElement("link")
        link.id = "leaflet-css"
        link.rel = "stylesheet"
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        document.head.appendChild(link)
        await sleep(100) // let CSS parse
      }

      const map = L.map(mapRef.current!, {
        center: [56.0, 10.0], // Denmark centre
        zoom: 7,
        zoomControl: true,
      })

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)

      leafletMapRef.current = map
      setReady(true)

      // Geocode and add markers sequentially (Nominatim: 1 req/sec)
      const geocoded: GeocodedJob[] = []
      for (let i = 0; i < jobsWithAddr.length; i++) {
        const job = jobsWithAddr[i]
        const addr = jobAddress(job)
        const coords = await geocode(addr)
        if (coords) {
          geocoded.push({ job, ...coords, address: addr })

          const color = STATUS_COLORS[job.status ?? "new"] ?? "#64748b"
          const icon = L.divIcon({
            html: `<div style="
              width:28px;height:28px;border-radius:50% 50% 50% 4px;
              background:${color};border:2.5px solid white;
              box-shadow:0 2px 8px rgba(0,0,0,0.3);
              transform:rotate(-45deg);
              display:flex;align-items:center;justify-content:center;
            "></div>`,
            className: "",
            iconSize: [28, 28],
            iconAnchor: [14, 28],
            popupAnchor: [0, -30],
          })

          const marker = L.marker([coords.lat, coords.lon], { icon }).addTo(map)
          marker.bindPopup(`
            <div style="font-family:system-ui,sans-serif;min-width:160px">
              <p style="font-weight:600;font-size:13px;margin:0 0 2px">${job.title}</p>
              <p style="font-size:11px;color:#64748b;margin:0 0 6px">${job.customer.name}</p>
              <p style="font-size:11px;color:#94a3b8;margin:0 0 8px">${addr}</p>
              <a href="/en/jobs/${job.id}" style="
                display:inline-block;font-size:11px;font-weight:600;
                background:#f59e0b;color:#fff;padding:4px 10px;border-radius:6px;
                text-decoration:none;
              ">Open job →</a>
            </div>
          `, { maxWidth: 220 })

          marker.on("popupopen", () => {
            // wire up the link via router after popup opens
            setTimeout(() => {
              const link = document.querySelector(`.leaflet-popup a[href="/en/jobs/${job.id}"]`) as HTMLAnchorElement | null
              if (link) {
                link.onclick = (e) => {
                  e.preventDefault()
                  router.push(`/jobs/${job.id}`)
                }
              }
            }, 50)
          })
        }

        setProgress(i + 1)
        if (i < jobsWithAddr.length - 1) await sleep(1100)
      }

      // Fit map to all markers
      if (geocoded.length > 0) {
        const bounds = L.latLngBounds(geocoded.map(g => [g.lat, g.lon]))
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 })
      }
    })

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove()
        leafletMapRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="relative w-full h-full">
      <div
        ref={mapRef}
        style={{ height: stripMode ? "100%" : "calc(100vh - 200px)", minHeight: stripMode ? 0 : 400 }}
        className="w-full"
      />

      {/* Progress overlay while geocoding */}
      {total > 0 && progress < total && (
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium shadow-lg z-[1000]"
          style={{ backgroundColor: "var(--card)", color: "var(--foreground)", fontFamily: "var(--font-body)", boxShadow: "var(--shadow-lg)" }}
        >
          <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: "var(--primary)" }} />
          Placing pins… {progress}/{total}
        </div>
      )}

      {/* No-address notice */}
      {ready && total === 0 && !stripMode && (
        <div
          className="absolute inset-0 flex items-center justify-center z-[1000] pointer-events-none"
        >
          <div
            className="px-4 py-3 rounded-xl text-sm text-center"
            style={{ backgroundColor: "var(--card)", color: "var(--muted-foreground)", fontFamily: "var(--font-body)", boxShadow: "var(--shadow-md)" }}
          >
            No jobs with addresses to show on the map.
          </div>
        </div>
      )}
    </div>
  )
}
