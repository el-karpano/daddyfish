import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import {
  ArrowLeft, BarChart3, MapPin, Trophy, TrendingUp
} from 'lucide-react'

export default function StatsPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getStatistics().then(setStats).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="page">
        <div className="back-header">
          <button className="btn-icon" onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
          <h1 className="back-header-title">Статистика</h1>
        </div>
        <div className="stats-grid">
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 100 }} />)}
        </div>
      </div>
    )
  }

  if (!stats || stats.total_fishing_records === 0) {
    return (
      <div className="page">
        <div className="back-header">
          <button className="btn-icon" onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
          <h1 className="back-header-title">Статистика</h1>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon">
            <BarChart3 size={32} />
          </div>
          <h3 className="empty-state-title">Пока нечего считать</h3>
          <p className="empty-state-text">Добавьте первую рыбалку, чтобы увидеть статистику.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="back-header">
        <button className="btn-icon" onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
        <h1 className="back-header-title">Статистика</h1>
      </div>

      <div className="stats-grid">
        <div className="card stat-card">
          <div className="stat-value">{stats.total_fishing_records}</div>
          <div className="stat-label">Рыбалок</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value">{stats.total_fish_caught}</div>
          <div className="stat-label">Рыб</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value">{stats.total_weight ? `${stats.total_weight}` : '—'}</div>
          <div className="stat-label">Кг</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value">{stats.avg_fish_per_trip}</div>
          <div className="stat-label">Средний улов</div>
        </div>
      </div>

      {stats.top_trophies?.length > 0 && (
        <div className="card">
          <div className="detail-section-title">
            <Trophy size={14} style={{ marginRight: 6, verticalAlign: -2, color: 'var(--gold)' }} /> Топ-3 трофея
          </div>
          {stats.top_trophies.map((t: any, i: number) => (
            <div key={i} className="trophy-item">
              <div className={`trophy-rank trophy-rank-${i + 1}`}>{i + 1}</div>
              <div>
                <div className="trophy-name">{t.fish_name}</div>
                <div className="trophy-weight">{t.weight} кг</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {stats.most_productive_water_body && (
        <div className="card">
          <div className="detail-section-title">
            <MapPin size={14} style={{ marginRight: 6, verticalAlign: -2 }} /> Самый результативный водоём
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, color: 'var(--text)' }}>
            {stats.most_productive_water_body.name}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            {stats.most_productive_water_body.trips} рыбалок · {stats.most_productive_water_body.fish} рыб
          </div>
        </div>
      )}

      {stats.most_caught_fish && (
        <div className="card">
          <div className="detail-section-title">
            <TrendingUp size={14} style={{ marginRight: 6, verticalAlign: -2 }} /> Самая результативная рыба
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
            {stats.most_caught_fish.name}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{stats.most_caught_fish.count} шт.</div>
        </div>
      )}
    </div>
  )
}