import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { mapStyle } from '../mapStyle'

export default function MapPage() {
  const navigate = useNavigate()
  const mapRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [markers, setMarkers] = useState<any[]>([])

  useEffect(() => {
    api.getMapData().then(setMarkers).catch(() => {}).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (loading || !mapRef.current) return
    let map: any

    import('maplibre-gl').then(mod => {
      const maplibregl = mod
      map = new maplibregl.Map({
        container: mapRef.current!,
        style: mapStyle,
        center: markers.length > 0 ? [markers[0].longitude, markers[0].latitude] : [30.5, 55.5],
        zoom: markers.length > 0 ? 6 : 5,
      })

      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')

      markers.forEach(m => {
        const el = document.createElement('div')
        el.innerHTML = `<svg width="36" height="36" viewBox="0 0 36 36"><circle cx="18" cy="18" r="16" fill="#2ecc71" stroke="#1a3a3a" stroke-width="3"/><text x="18" y="22" text-anchor="middle" font-size="16">🐟</text></svg>`
        el.style.cursor = 'pointer'

        const topCatch = m.catch_items?.sort((a: any, b: any) => (b.biggest_weight || 0) - (a.biggest_weight || 0))[0]
        const popupHtml = `
          <div style="min-width:160px">
            <div style="font-weight:700;font-size:15px;margin-bottom:4px">🎣 ${m.water_body_name}</div>
            <div style="font-size:12px;color:#8ba0a0;margin-bottom:6px">${new Date(m.date).toLocaleDateString('ru-RU')}</div>
            <div style="font-size:13px">🐟 ${m.total_fish_count} рыб</div>
            ${topCatch ? `<div style="font-size:12px;color:#8ba0a0;margin-top:4px">🏆 ${topCatch.fish_name} ${topCatch.biggest_weight ? topCatch.biggest_weight + ' кг' : ''}</div>` : ''}
            <button onclick="window.__openRecord(${m.id})" style="margin-top:8px;width:100%;padding:8px;border-radius:8px;border:none;background:#2ecc71;color:#000;font-weight:600;font-size:13px;cursor:pointer">Открыть</button>
          </div>
        `

        const popup = new maplibregl.Popup({ offset: 20, closeButton: true })
          .setHTML(popupHtml)

        new maplibregl.Marker({ element: el })
          .setLngLat([m.longitude, m.latitude])
          .setPopup(popup)
          .addTo(map)
      })

      if (markers.length > 1) {
        const bounds = new maplibregl.LngLatBounds()
        markers.forEach(m => bounds.extend([m.longitude, m.latitude]))
        map.fitBounds(bounds, { padding: 50 })
      }
    })

    ;(window as any).__openRecord = (id: number) => navigate(`/record/${id}`)
    return () => { map?.remove(); delete (window as any).__openRecord }
  }, [loading, markers])

  if (loading) {
    return <div className="page"><h2 className="page-title">🗺 МОИ МЕСТА</h2><div className="skeleton" style={{ height: 400 }} /></div>
  }

  if (markers.length === 0) {
    return (
      <div className="page">
        <h2 className="page-title">🗺 МОИ МЕСТА</h2>
        <div className="empty-state">
          <div className="empty-state-emoji">🗺</div>
          <h3 className="empty-state-title">Пока нет отмеченных мест</h3>
          <p className="empty-state-text">Добавьте первую рыбалку, чтобы увидеть её на карте.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <h2 className="page-title">🗺 МОИ МЕСТА</h2>
      <div ref={mapRef} className="map-container-full" />
    </div>
  )
}
