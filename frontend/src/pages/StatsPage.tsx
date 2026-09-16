import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { ArrowLeft, BarChart3, MapPin, Trophy, TrendingUp, Users, User } from 'lucide-react'

export default function StatsPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'my' | 'club'>('my')
  const [stats, setStats] = useState<any>(null)
  const [clubStats, setClubStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    if (mode === 'my') {
      api.getStatistics().then(setStats).catch(() => {}).finally(() => setLoading(false))
    } else {
      api.getClubStatistics().then(setClubStats).catch(() => {}).finally(() => setLoading(false))
    }
  }, [mode])

  const currentStats = mode === 'my' ? stats : clubStats

  return (
    <div className="page">
      <div className="back-header">
        <button className="btn-icon" onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
        <h1 className="back-header-title">Статистика</h1>
      </div>

      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button
          className={`btn ${mode === 'my' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ flex: 1 }}
          onClick={() => setMode('my')}
        >
          <User size={16} /> Моя
        </button>
        <button
          className={`btn ${mode === 'club' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ flex: 1 }}
          onClick={() => setMode('club')}
        >
          <Users size={16} /> Клуба
        </button>
      </div>

      {loading ? (
        <div className="stats-grid">
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 100 }} />)}
        </div>
      ) : !currentStats || currentStats.total_fishing_records === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><BarChart3 size={32} /></div>
          <h3 className="empty-state-title">Пока нечего считать</h3>
          <p className="empty-state-text">
            {mode === 'my' ? 'Добавьте первую рыбалку.' : 'Данные появятся, когда участники добавят рыбалки.'}
          </p>
        </div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="card stat-card">
              <div className="stat-value">{currentStats.total_fishing_records}</div>
              <div className="stat-label">Рыбалок</div>
            </div>
            <div className="card stat-card">
              <div className="stat-value">{currentStats.total_fish_caught}</div>
              <div className="stat-label">Рыб</div>
            </div>
            <div className="card stat-card">
              <div className="stat-value">{currentStats.total_weight ? `${currentStats.total_weight}` : '—'}</div>
              <div className="stat-label">Кг</div>
            </div>
            <div className="card stat-card">
              <div className="stat-value">
                {mode === 'club' && currentStats.member_count ? currentStats.member_count : currentStats.avg_fish_per_trip}
              </div>
              <div className="stat-label">
                {mode === 'club' ? 'Участников' : 'Средний улов'}
              </div>
            </div>
          </div>

          {currentStats.top_trophies?.length > 0 && (
            <div className="card">
              <div className="detail-section-title">
                <Trophy size={14} style={{ marginRight: 6, verticalAlign: -2, color: 'var(--gold)' }} /> Топ-3 трофея
              </div>
              {currentStats.top_trophies.map((t: any, i: number) => (
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

          {currentStats.most_productive_water_body && (
            <div className="card">
              <div className="detail-section-title">
                <MapPin size={14} style={{ marginRight: 6, verticalAlign: -2 }} /> Самый результативный водоём
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
                {currentStats.most_productive_water_body.name}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                {currentStats.most_productive_water_body.trips} рыбалок · {currentStats.most_productive_water_body.fish} рыб
              </div>
            </div>
          )}

          {currentStats.most_caught_fish && (
            <div className="card">
              <div className="detail-section-title">
                <TrendingUp size={14} style={{ marginRight: 6, verticalAlign: -2 }} /> Самая частая рыба
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
                {currentStats.most_caught_fish.name}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{currentStats.most_caught_fish.count} шт.</div>
            </div>
          )}
        </>
      )}
    </div>
  )
}