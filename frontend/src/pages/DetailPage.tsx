import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { mapStyle } from '../mapStyle'

export default function DetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [record, setRecord] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showConfirm, setShowConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [photoIdx, setPhotoIdx] = useState(0)
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    api.getRecord(Number(id)).then(setRecord).catch(() => navigate('/history')).finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!record || !mapRef.current) return
    let map: any
    import('maplibre-gl').then(mod => {
      const maplibregl = mod
      map = new maplibregl.Map({
        container: mapRef.current!,
        style: mapStyle,
        center: [record.longitude, record.latitude],
        zoom: 10,
        interactive: false,
      })
      new maplibregl.Marker({ color: '#2ecc71' })
        .setLngLat([record.longitude, record.latitude])
        .addTo(map)
    })
    return () => { map?.remove() }
  }, [record])

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await api.deleteRecord(Number(id))
      navigate('/history')
    } catch {} finally {
      setDeleting(false)
    }
  }

  if (loading || !record) {
    return <div className="page"><div className="skeleton" style={{ height: 300 }} /></div>
  }

  const photos = record.photos || []
  const catches = record.catch_items || []

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button className="btn-icon" onClick={() => navigate(-1)}>←</button>
        <h2 className="page-title" style={{ marginBottom: 0, flex: 1 }}>{record.water_body_name}</h2>
      </div>

      {photos.length > 0 && (
        <div>
          <img className="detail-hero" src={photos[photoIdx]?.photo_url} alt="" />
          {photos.length > 1 && (
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 16 }}>
              {photos.map((_: any, i: number) => (
                <button key={i} onClick={() => setPhotoIdx(i)} style={{
                  width: i === photoIdx ? 24 : 8, height: 8, borderRadius: 4,
                  background: i === photoIdx ? 'var(--accent)' : 'rgba(255,255,255,0.2)',
                  border: 'none', cursor: 'pointer', transition: 'all 0.2s'
                }} />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="card">
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>📅 Дата</div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>
              {new Date(record.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>🐟 Рыб</div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{record.total_fish_count}</div>
          </div>
          {record.total_weight && (
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>⚖️ Вес</div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{record.total_weight} кг</div>
            </div>
          )}
        </div>
      </div>

      {record.place_description && (
        <div className="card">
          <div className="detail-section-title">📍 Описание места</div>
          <p style={{ fontSize: 14, lineHeight: 1.5 }}>{record.place_description}</p>
        </div>
      )}

      <div ref={mapRef} className="map-container" style={{ height: 200 }} />

      <button className="btn btn-secondary" style={{ marginBottom: 12 }} onClick={() => {
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${record.latitude},${record.longitude}`, '_blank')
      }}>
        🧭 Открыть маршрут
      </button>

      {catches.length > 0 && (
        <div className="card">
          <div className="detail-section-title">🐟 Улов</div>
          <table className="catch-table">
            <thead>
              <tr><th>Рыба</th><th>Кол-во</th><th>Самая крупная</th></tr>
            </thead>
            <tbody>
              {catches.map((c: any) => (
                <tr key={c.id}>
                  <td>{c.fish_name}</td>
                  <td>{c.quantity}</td>
                  <td>{c.biggest_weight ? `${c.biggest_weight} кг` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {record.comment && (
        <div className="card">
          <div className="detail-section-title">📝 Комментарий</div>
          <p style={{ fontSize: 14, lineHeight: 1.5 }}>{record.comment}</p>
        </div>
      )}

      <div className="btn-group">
        <button className="btn btn-secondary" onClick={() => navigate(`/edit/${record.id}`)}>✏️ Редактировать</button>
        <button className="btn btn-danger" onClick={() => setShowConfirm(true)}>🗑 Удалить</button>
      </div>

      {showConfirm && (
        <>
          <div className="overlay" onClick={() => setShowConfirm(false)} />
          <div className="confirm-dialog">
            <h3>Удалить рыбалку?</h3>
            <p>Это действие нельзя отменить.</p>
            <div className="btn-group">
              <button className="btn btn-secondary" onClick={() => setShowConfirm(false)}>Отмена</button>
              <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Удаление...' : 'Удалить'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
