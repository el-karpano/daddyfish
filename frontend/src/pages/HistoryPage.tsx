import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { Fish, Scale, Plus, Inbox } from 'lucide-react'

export default function HistoryPage() {
  const navigate = useNavigate()
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getRecords().then(setRecords).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="page">
        <div className="page-header">
          <h1 className="page-title">Мои рыбалки</h1>
          <p className="page-subtitle">Загрузка...</p>
        </div>
        {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 118, marginBottom: 12 }} />)}
      </div>
    )
  }

  if (records.length === 0) {
    return (
      <div className="page">
        <div className="page-header">
          <h1 className="page-title">Мои рыбалки</h1>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon">
            <Inbox size={32} />
          </div>
          <h3 className="empty-state-title">Первая рыбалка ещё впереди</h3>
          <p className="empty-state-text">Добавьте свой первый выезд и начните вести личный рыбацкий дневник.</p>
          <button className="btn btn-primary" style={{ maxWidth: 260 }} onClick={() => navigate('/add')}>
            <Plus size={18} strokeWidth={2.5} /> Добавить первую рыбалку
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Мои рыбалки</h1>
        <p className="page-subtitle">{records.length} {pluralize(records.length, 'запись', 'записи', 'записей')}</p>
      </div>

      {records.map((r, idx) => (
        <Link key={r.id} to={`/record/${r.id}`} style={{ textDecoration: 'none', display: 'block' }}>
          <div className="card record-card" style={{ animationDelay: `${idx * 0.05}s` }}>
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
  const date = new Date(d)
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

function pluralize(n: number, one: string, few: string, many: string) {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 19) return many
  if (mod10 === 1) return one
  if (mod10 >= 2 && mod10 <= 4) return few
  return many
}