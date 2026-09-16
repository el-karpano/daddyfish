import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { mapStyle } from '../mapStyle'
import {
  ArrowLeft, MapPin, Navigation, Pencil, Trash2, Calendar,
  Fish, MessageSquare, ChevronLeft, ChevronRight, Weight
} from 'lucide-react'

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
      new maplibregl.Marker({ color: '#20D879' })
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
      {/* Back header */}
      <div className="back-header">
        <button className="btn-icon" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <h1 className="back-header-title">{record.water_body_name}</h1>
      </div>

      {/* Owner info */}
      {record.owner && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: record.owner.color || 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#000', fontWeight: 700, fontSize: 14, flexShrink: 0,
          }}>
            {record.owner.first_name?.charAt(0)?.toUpperCase()}
          </div>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
            {record.owner.first_name}{record.owner.role === 'owner' ? ' 👑' : ''}
          </span>
        </div>
      )}

      {/* Photo gallery */}
      {photos.length > 0 && (
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <img className="detail-hero-img" src={photos[photoIdx]?.photo_url} alt="" />
          {photos.length > 1 && (
            <>
              <button
                onClick={() => setPhotoIdx(i => i > 0 ? i - 1 : photos.length - 1)}
                style={{
                  position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
                  width: 32, height: 32, borderRadius: '50%', background: 'rgba(0,0,0,0.5)',
                  backdropFilter: 'blur(4px)', border: 'none', color: '#fff', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setPhotoIdx(i => i < photos.length - 1 ? i + 1 : 0)}
                style={{
                  position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                  width: 32, height: 32, borderRadius: '50%', background: 'rgba(0,0,0,0.5)',
                  backdropFilter: 'blur(4px)', border: 'none', color: '#fff', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <ChevronRight size={18} />
              </button>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 8 }}>
                {photos.map((_: any, i: number) => (
                  <div key={i} style={{
                    width: i === photoIdx ? 20 : 6, height: 6, borderRadius: 3,
                    background: i === photoIdx ? 'var(--accent)' : 'rgba(255,255,255,0.2)',
                    transition: 'all 0.25s'
                  }} />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Date & meta */}
      <div className="card">
        <div className="detail-meta">
          <div className="detail-meta-item">
            <div className="detail-meta-label">
              <Calendar size={12} style={{ marginRight: 4, verticalAlign: -2 }} /> Дата
            </div>
            <div className="detail-meta-value">
              {new Date(record.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
          <div className="detail-meta-item">
            <div className="detail-meta-label">
              <Fish size={12} style={{ marginRight: 4, verticalAlign: -2 }} /> Рыб
            </div>
            <div className="detail-meta-value">{record.total_fish_count}</div>
          </div>
          {record.total_weight && (
            <div className="detail-meta-item">
              <div className="detail-meta-label">
                <Weight size={12} style={{ marginRight: 4, verticalAlign: -2 }} /> Вес
              </div>
              <div className="detail-meta-value">{record.total_weight} кг</div>
            </div>
          )}
        </div>
      </div>

      {/* Place */}
      <div className="place-card">
        <div className="place-card-header">
          <div className="place-card-icon">
            <MapPin size={18} />
          </div>
          <div className="place-card-name">{record.water_body_name}</div>
        </div>
        {record.place_description && (
          <div className="place-card-desc">{record.place_description}</div>
        )}
        <div ref={mapRef} className="map-container" style={{ height: 180 }} />
        <button className="btn btn-outline" style={{ marginTop: 12 }} onClick={() => {
          window.open(`https://www.google.com/maps/dir/?api=1&destination=${record.latitude},${record.longitude}`, '_blank')
        }}>
          <Navigation size={16} /> Построить маршрут
        </button>
      </div>

      {/* Catch list */}
      {catches.length > 0 && (
        <div className="card">
          <div className="detail-section-title">Улов</div>
          {catches.map((c: any) => (
            <div key={c.id} className="catch-list-item">
              <div className="catch-list-icon">
                <Fish size={18} />
              </div>
              <div className="catch-list-name">{c.fish_name}</div>
              <div className="catch-list-count">{c.quantity}</div>
              <div className="catch-list-weight">
                {c.biggest_weight ? `до ${c.biggest_weight} кг` : '—'}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Total catch */}
      {(record.total_fish_count > 0 || record.total_weight) && (
        <div className="total-catch-card">
          <div className="total-catch-item">
            <div className="total-catch-value">{record.total_fish_count}</div>
            <div className="total-catch-label">Рыб</div>
          </div>
          {record.total_weight && (
            <div className="total-catch-item">
              <div className="total-catch-value">{record.total_weight}</div>
              <div className="total-catch-label">Кг</div>
            </div>
          )}
        </div>
      )}

      {/* Comment */}
      {record.comment && (
        <div className="notes-block">
          <div className="notes-label">
            <MessageSquare size={12} style={{ marginRight: 6, verticalAlign: -2 }} /> Заметки
          </div>
          <div className="notes-text">{record.comment}</div>
        </div>
      )}

      {/* Action buttons */}
      <div className="btn-group">
        <button className="btn btn-secondary" onClick={() => navigate(`/edit/${record.id}`)}>
          <Pencil size={16} /> Редактировать
        </button>
        <button className="btn btn-danger" onClick={() => setShowConfirm(true)}>
          <Trash2 size={16} /> Удалить
        </button>
      </div>

      {/* Confirm dialog */}
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