import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'

export default function HistoryPage() {
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getRecords().then(setRecords).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="page">
        <h2 className="page-title">🎣 МОИ РЫБАЛКИ</h2>
        {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 100, marginBottom: 12 }} />)}
      </div>
    )
  }

  if (records.length === 0) {
    return (
      <div className="page">
        <h2 className="page-title">🎣 МОИ РЫБАЛКИ</h2>
        <div className="empty-state">
          <div className="empty-state-emoji">🎣</div>
          <h3 className="empty-state-title">Первая рыбалка ещё впереди</h3>
          <p className="empty-state-text">Добавьте свой первый выезд и начните вести личный рыбацкий дневник.</p>
          <Link to="/add" className="btn btn-primary" style={{ maxWidth: 260, textDecoration: 'none' }}>
            🎣 Добавить первую рыбалку
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <h2 className="page-title">🎣 МОИ РЫБАЛКИ</h2>
      {records.map(r => (
        <Link key={r.id} to={`/record/${r.id}`} style={{ textDecoration: 'none' }}>
          <div className="card record-card">
            {r.photos?.[0]?.photo_url ? (
              <img className="record-thumb" src={r.photos[0].photo_url} alt="" />
            ) : (
              <div className="record-thumb-placeholder">🐟</div>
            )}
            <div className="record-info">
              <div className="record-date">{formatDate(r.date)}</div>
              <div className="record-name">{r.water_body_name}</div>
              <div className="record-stats">
                <span>🐟 {r.total_fish_count}</span>
                {r.total_weight && <span>⚖️ {r.total_weight} кг</span>}
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

function formatDate(d: string) {
  const date = new Date(d)
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}
