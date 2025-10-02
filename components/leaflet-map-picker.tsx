'use client'

import { useEffect, useRef } from 'react'

export function LeafletMapPicker({
  lat,
  lng,
  onChange,
  height = 300,
}: { lat?: string | number; lng?: string | number; onChange: (lat: number, lng: number) => void; height?: number }) {
  const mapRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)

  // Cargar Leaflet por CDN (CSS/JS) solo una vez
  const ensureLeafletLoaded = async () => {
    const win = window as any
    if (win.L) return
    // CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY='
      link.crossOrigin = ''
      document.head.appendChild(link)
    }
    // JS
    await new Promise<void>((resolve, reject) => {
      if (win.L) return resolve()
      const scriptId = 'leaflet-js'
      const existing = document.getElementById(scriptId) as HTMLScriptElement | null
      if (existing) {
        existing.addEventListener('load', () => resolve(), { once: true })
        existing.addEventListener('error', () => reject(new Error('Leaflet load error')), { once: true })
        if ((existing as any)._loaded) return resolve()
        return
      }
      const script = document.createElement('script')
      script.id = scriptId
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo='
      script.crossOrigin = ''
      script.async = true
      ;(script as any)._loaded = false
      script.onload = () => { (script as any)._loaded = true; resolve() }
      script.onerror = () => reject(new Error('Leaflet load error'))
      document.body.appendChild(script)
    })
  }

  // Inicializar mapa una vez
  useEffect(() => {
    let destroyed = false
    const init = async () => {
      if (!mapRef.current) return
      await ensureLeafletLoaded()
      if (destroyed) return
      const win = window as any
      const L = win.L
      const startLat = typeof lat === 'string' ? parseFloat(lat) : typeof lat === 'number' ? lat : -11.985608
      const startLng = typeof lng === 'string' ? parseFloat(lng) : typeof lng === 'number' ? lng : -77.07203
      const map = L.map(mapRef.current).setView([startLat, startLng], 13)
      mapInstanceRef.current = map
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map)
      // Marcador inicial si hay coords
      if (!isNaN(startLat) && !isNaN(startLng)) {
        markerRef.current = L.marker([startLat, startLng], { draggable: true }).addTo(map)
        markerRef.current.on('dragend', (e: any) => {
          const pos = e.target.getLatLng()
          onChange(pos.lat, pos.lng)
        })
      }
      // Click para seleccionar
      map.on('click', (e: any) => {
        const { lat: clat, lng: clng } = e.latlng
        if (!markerRef.current) {
          markerRef.current = L.marker([clat, clng], { draggable: true }).addTo(map)
          markerRef.current.on('dragend', (ev: any) => {
            const pos = ev.target.getLatLng()
            onChange(pos.lat, pos.lng)
          })
        } else {
          markerRef.current.setLatLng([clat, clng])
        }
        onChange(clat, clng)
      })
    }
    void init()
    return () => {
      destroyed = true
      try {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove()
          mapInstanceRef.current = null
        }
      } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Cuando cambian props lat/lng, actualizar marcador y centrar
  useEffect(() => {
    const L = (window as any).L
    const map = mapInstanceRef.current
    if (!L || !map) return
    const nlat = typeof lat === 'string' ? parseFloat(lat) : (lat as number)
    const nlng = typeof lng === 'string' ? parseFloat(lng) : (lng as number)
    if (isNaN(nlat) || isNaN(nlng)) return
    if (!markerRef.current) {
      markerRef.current = L.marker([nlat, nlng], { draggable: true }).addTo(map)
      markerRef.current.on('dragend', (e: any) => {
        const pos = e.target.getLatLng()
        onChange(pos.lat, pos.lng)
      })
    } else {
      markerRef.current.setLatLng([nlat, nlng])
    }
    map.setView([nlat, nlng], Math.max(map.getZoom?.() ?? 13, 13))
  }, [lat, lng, onChange])

  return (
    <div className="w-full" style={{ height }}>
      <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
    </div>
  )
}
