import { useState, useEffect } from 'react'
import { api } from '../api'

export default function StatsPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getStatistics().then(setStats).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="page">
        <h2 className="page-title">📊 МОЯ СТАТИСТИКА</h2>
        <div className="stats-grid">
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 90 }} />)}
        </div>
      </div>
    )
  }

  if (!stats || stats.total_fishing_records === 0) {
    return (
      <div className="page">
        <h2 className="page-title">📊 МОЯ СТАТИСТИКА</h2>
        <div className="empty-state">
          <div className="empty-state-emoji">📊</div>
          <h3 className="empty-state-title">Пока нечего считать</h3>
          <p className="empty-state-text">Добавьте первую рыбалку, чтобы увидеть статистику.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <h2 className="page-title">📊 МОЯ СТАТИСТИКА</h2>

      <div className="stats-grid">
        <div className="card stat-card">
          <div className="stat-value">{stats.total_fishing_records}</div>
          <div className="stat-label">Рыбалок</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value">{stats.total_fish_caught}</div>
          <div className="stat-label">Рыб поймано</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value">{stats.total_weight ? `${stats.total_weight}` : '—'}</div>
          <div className="stat-label">Общий вес (кг)</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value">{stats.avg_fish_per_trip}</div>
          <div className="stat-label">Средний улов</div>
        </div>
      </div>

      {stats.top_trophies?.length > 0 && (
        <div className="card">
          <h3 style={{ fontSize: 16, marginBottom: 12 }}>🏆 ТОП-3 ТРОФЕЯ</h3>
          {stats.top_trophies.map((t: any, i: number) => (
            <div key={i} className="trophy-item">
              <div className={`trophy-rank trophy-rank-${i + 1}`}>{i + 1}</div>
              <div>
                <div style={{ fontWeight: 600 }}>{t.fish_name}</div>
                <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>{t.weight} кг</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {stats.most_productive_water_body && (
        <div className="card">
          <h3 style={{ fontSize: 16, marginBottom: 8 }}>📍 Самый результативный водоём</h3>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>{stats.most_productive_water_body.name}</div>
          <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>
            {stats.most_productive_water_body.trips} рыбалок · {stats.most_productive_water_body.fish} рыб
          </div>
        </div>
      )}

      {stats.most_caught_fish && (
        <div className="card">
          <h3 style={{ fontSize: 16, marginBottom: 8 }}>🐟 Самая результативная рыба</h3>
          <div style={{ fontSize: 18, fontWeight: 600 }}>
            {stats.most_caught_fish.name} — {stats.most_caught_fish.count} шт.
          </div>
        </div>
      )}
    </div>
  )
}
