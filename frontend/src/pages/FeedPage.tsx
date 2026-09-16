import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { Fish, Scale, Users } from 'lucide-react'

export default function FeedPage() {
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getRecords().then(setRecords).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="page">
        <div className="page-header">
          <h1 className="page-title">Лента</h1>
          <p className="page-subtitle">Загрузка...</p>
        </div>
        {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 140, marginBottom: 12 }} />)}
      </div>
    )
  }

  if (records.length === 0) {
    return (
      <div className="page">
        <div className="page-header">
          <h1 className="page-title">Лента</h1>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon"><Users size={32} /></div>
          <h3 className="empty-state-title">Пока нет рыбалок</h3>
          <p className="empty-state-text">Рыбалки всех участников клуба появятся здесь.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Лента</h1>
        <p className="page-subtitle">{records.length} {records.length === 1 ? 'запись' : 'записей'}</p>
      </div>

      {records.map((r, idx) => (
        <Link key={r.id} to={`/record/${r.id}`} style={{ textDecoration: 'none', display: 'block' }}>
          <div className="card record-card" style={{ animationDelay: `${idx * 0.04}s` }}>
            {r.photos?.[0]?.photo_url ? (
              <div className="record-card-photo">
                <img src={r.photos[0].photo_url} alt="" />
              </div>
            ) : (
              <div className="record-card-photo-placeholder">
                <Fish size={28} style={{ color: 'var(--accent)', opacity: 0.4 }} />
              </div>
            )}
            <div className="record-info">
              {r.owner && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: r.owner.color || 'var(--accent)',
                  }} />
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>
                    {r.owner.first_name}{r.owner.role === 'owner' ? ' 👑' : ''}
                  </span>
                </div>
              )}
              <div className="record-date">{formatDate(r.date)}</div>
              <div className="record-name">{r.water_body_name}</div>
              <div className="record-stats">
                <span className="record-stat">
                  <Fish size={14} style={{ color: 'var(--accent)' }} />
                  {r.total_fish_count}
                </span>
                {r.total_weight && (
                  <span className="record-stat">
                    <Scale size={14} style={{ color: 'var(--text-dim)' }} />
                    {r.total_weight} кг
                  </span>
                )}
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}