"use client"

import { useEffect, useRef, useState } from "react"
import { ExternalLink, Loader2 } from "lucide-react"

interface JobLocationMapProps {
  address: string
  mapsUrl: string
  height?: number
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

export function JobLocationMap({ address, mapsUrl, height = 200 }: JobLocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leafletMapRef = useRef<any>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return

    import("leaflet").then(async (L) => {
      if (!mapRef.current || leafletMapRef.current) return

      // Inject Leaflet CSS once
      if (!document.querySelector("#leaflet-css")) {
        const link = document.createElement("link")
        link.id = "leaflet-css"
        link.rel = "stylesheet"
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        document.head.appendChild(link)
        await new Promise(r => setTimeout(r, 80))
      }

      const coords = await geocode(address)
      if (!coords || !mapRef.current) { setLoading(false); setFailed(true); return }

      const map = L.map(mapRef.current, {
        center: [coords.lat, coords.lon],
        zoom: 15,
        zoomControl: true,
        scrollWheelZoom: false,
      })

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)

      const icon = L.divIcon({
        html: `<div style="
          width:32px;height:32px;
          border-radius:50% 50% 50% 4px;
          background:var(--amber-500,#f59e0b);
          border:3px solid white;
          box-shadow:0 3px 12px rgba(0,0,0,0.35);
          transform:rotate(-45deg);
        "></div>`,
        className: "",
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      })

      L.marker([coords.lat, coords.lon], { icon }).addTo(map)
      leafletMapRef.current = map
      setLoading(false)
    })

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove()
        leafletMapRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (failed) return null

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
      {/* Map */}
      <div className="relative" style={{ height }}>
        {loading && (
          <div
            className="absolute inset-0 flex items-center justify-center z-10 animate-pulse"
            style={{ backgroundColor: "var(--background-subtle)" }}
          >
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: "var(--muted-foreground)" }} />
          </div>
        )}
        <div ref={mapRef} className="w-full h-full" />
      </div>

      {/* Address + Open in Maps */}
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-3 py-2.5 transition-colors"
        style={{ backgroundColor: "var(--card)" }}
        onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "var(--accent)"}
        onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "var(--card)"}
      >
        <span
          className="flex-1 text-xs truncate min-w-0"
          style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}
        >
          {address}
        </span>
        <span
          className="flex items-center gap-1 text-[11px] font-medium flex-shrink-0"
          style={{ color: "var(--primary)", fontFamily: "var(--font-body)" }}
        >
          Open in Maps
          <ExternalLink className="w-3 h-3" />
        </span>
      </a>
    </div>
  )
}
