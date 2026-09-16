import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { mapStyle, BARANOVICHI } from '../mapStyle'
import {
  Fish, Trophy, X, ChevronRight, Navigation, Anchor
} from 'lucide-react'

export default function MapPage() {
  const navigate = useNavigate()
  const mapRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [markers, setMarkers] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)

  useEffect(() => {
    api.getMapData().then(setMarkers).catch(() => {}).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (loading || !mapRef.current) return
    let map: any

    const initWithLocation = (center: [number, number], zoom: number) => {
      import('maplibre-gl').then(mod => {
        const maplibregl = mod
        map = new maplibregl.Map({
          container: mapRef.current!,
          style: mapStyle,
          center,
          zoom,
        })

        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')

        // Add locate button
        const locateBtn = document.createElement('button')
        locateBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h3m14 0h3M12 2v3m0 14v3"/><circle cx="12" cy="12" r="4"/></svg>`
        locateBtn.style.cssText = 'width:36px;height:36px;border-radius:8px;background:var(--bg-card-solid);border:1px solid var(--border);color:var(--text);cursor:pointer;display:flex;align-items:center;justify-content:center;margin-bottom:4px'
        locateBtn.title = 'Моё местоположение'
        locateBtn.addEventListener('click', () => {
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(pos => {
              map.flyTo({ center: [pos.coords.longitude, pos.coords.latitude], zoom: 12, duration: 1200 })
            })
          }
        })

        const ctrlContainer = document.querySelector('.maplibregl-ctrl-top-right .maplibregl-ctrl-group')
        if (ctrlContainer) {
          ctrlContainer.appendChild(locateBtn)
        }

        // Add fishing markers
        markers.forEach(m => {
          const el = document.createElement('div')
          el.innerHTML = `<svg width="40" height="40" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="17" fill="#20D879" opacity="0.15"/>
            <circle cx="20" cy="20" r="13" fill="#20D879" opacity="0.3"/>
            <circle cx="20" cy="20" r="9" fill="#20D879"/>
            <circle cx="20" cy="20" r="4" fill="#07110F"/>
          </svg>`
          el.style.cursor = 'pointer'
          el.style.filter = 'drop-shadow(0 2px 6px rgba(32,216,121,0.4))'

          const marker = new maplibregl.Marker({ element: el })
            .setLngLat([m.longitude, m.latitude])
            .addTo(map)

          marker.getElement().addEventListener('click', () => {
            setSelected(m)
          })
        })

        // Fit bounds if multiple markers
        if (markers.length > 1) {
          const bounds = new maplibregl.LngLatBounds()
          markers.forEach(m => bounds.extend([m.longitude, m.latitude]))
          map.fitBounds(bounds, { padding: 50 })
        }
      })
    }

    // Try geolocation first
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const userCenter: [number, number] = [pos.coords.longitude, pos.coords.latitude]
          if (markers.length > 0) {
            // If we have markers, still fit them but start closer to user
            initWithLocation(userCenter, 8)
          } else {
            initWithLocation(userCenter, 12)
          }
        },
        () => {
          // Geolocation denied — fallback
          initWithLocation(
            markers.length > 0 ? [markers[0].longitude, markers[0].latitude] : BARANOVICHI,
            markers.length > 0 ? 6 : 5
          )
        },
        { enableHighAccuracy: true, timeout: 5000 }
      )
    } else {
      initWithLocation(
        markers.length > 0 ? [markers[0].longitude, markers[0].latitude] : BARANOVICHI,
        markers.length > 0 ? 6 : 5
      )
    }

    return () => { map?.remove() }
  }, [loading, markers])

  if (loading) {
    return (
      <div className="page">
        <div className="page-header">
          <h1 className="page-title">Мои места</h1>
        </div>
        <div className="skeleton" style={{ height: 400 }} />
      </div>
    )
  }

  if (markers.length === 0) {
    return (
      <div className="page">
        <div className="page-header">
          <h1 className="page-title">Мои места</h1>
        </div>
        <div ref={mapRef} className="map-container-full" />

        {selected && (
          <MapPopupCard
            selected={selected}
            onClose={() => setSelected(null)}
            onOpen={() => navigate(`/record/${selected.id}`)}
          />
        )}
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Мои места</h1>
        <p className="page-subtitle">{markers.length} {markers.length === 1 ? 'место' : 'мест'}</p>
      </div>
      <div ref={mapRef} className="map-container-full" />

      {selected && (
        <MapPopupCard
          selected={selected}
          onClose={() => setSelected(null)}
          onOpen={() => navigate(`/record/${selected.id}`)}
        />
      )}
    </div>
  )
}

function MapPopupCard({ selected, onClose, onOpen }: { selected: any; onClose: () => void; onOpen: () => void }) {
  const topCatch = selected.catch_items?.sort((a: any, b: any) => (b.biggest_weight || 0) - (a.biggest_weight || 0))[0]

  return (
    <>
      <div className="overlay" style={{ zIndex: 119 }} onClick={onClose} />
      <div className="map-popup-card">
        <button className="map-popup-close" onClick={onClose}>
          <X size={16} />
        </button>
        <div className="map-popup-card-header">
          <div className="map-popup-card-icon">
            <Anchor size={20} />
          </div>
          <div>
            <div className="map-popup-card-title">{selected.water_body_name}</div>
            <div className="map-popup-card-sub">
              {new Date(selected.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
            <Fish size={16} style={{ color: 'var(--accent)' }} />
            <span style={{ fontWeight: 600 }}>{selected.total_fish_count}</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>рыб</span>
          </div>
          {topCatch && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
              <Trophy size={16} style={{ color: 'var(--gold)' }} />
              <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                {topCatch.fish_name}{topCatch.biggest_weight ? ` ${topCatch.biggest_weight} кг` : ''}
              </span>
            </div>
          )}
        </div>

        {selected.catch_items?.length > 0 && (
          <div style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 14 }}>
            Поймано: {selected.catch_items.map((c: any) => c.fish_name).join(' · ')}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={onOpen}>
            <ChevronRight size={16} /> Открыть
          </button>
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => {
            window.open(`https://www.google.com/maps/dir/?api=1&destination=${selected.latitude},${selected.longitude}`, '_blank')
          }}>
            <Navigation size={16} /> Маршрут
          </button>
        </div>
      </div>
    </>
  )
}