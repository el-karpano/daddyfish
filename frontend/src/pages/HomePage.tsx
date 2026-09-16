import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { api } from '../api'
import {
  Plus, MapPin, BarChart3, Trophy, Fish, Calendar,
  ChevronRight, Users, Scale
} from 'lucide-react'

export default function HomePage() {
  const navigate = useNavigate()
  const [me, setMe] = useState<any>(null)
  const [recentRecords, setRecentRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.getMe(),
      api.getRecords(),
    ]).then(([meData, records]) => {
      setMe(meData)
      setRecentRecords(records.slice(0, 5))
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const club = me?.club
  const myRecords = recentRecords.filter(r => r.owner?.id === me?.id)
  const myFishCount = myRecords.reduce((s: number, r: any) => s + (r.total_fish_count || 0), 0)
  const myWeight = myRecords.reduce((s: number, r: any) => s + (r.total_weight || 0), 0)
  const myPlaces = new Set(myRecords.map((r: any) => r.water_body_name)).size

  if (loading) {
    return (
      <div className="page">
        <div className="skeleton" style={{ height: 260, marginBottom: 20 }} />
        <div className="home-stats-row">
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 70 }} />)}
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      {/* Hero banner */}
      <div className="hero-banner">
        <img
          className="hero-banner-img"
          src="https://images.unsplash.com/photo-1504472478235-9bc48ba4d60f?w=800&q=80&auto=format"
          alt=""
          loading="eager"
        />
        <div className="hero-banner-overlay">
          <div className="hero-banner-title">
            Каждая рыбалка —<br />отдельная история
          </div>
          <div className="hero-banner-sub">
            {club ? `${club.name} · ${club.member_count || '?'} участников` : 'Мой рыбацкий дневник'}
          </div>
        </div>
      </div>

      {/* My stats row */}
      {myRecords.length > 0 && (
        <div className="home-stats-row">
          <div className="home-stat-item">
            <div className="home-stat-value">{myRecords.length}</div>
            <div className="home-stat-label">Рыбалок</div>
          </div>
          <div className="home-stat-item">
            <div className="home-stat-value">{myFishCount}</div>
            <div className="home-stat-label">Рыб</div>
          </div>
          <div className="home-stat-item">
            <div className="home-stat-value">{Math.round(myWeight * 10) / 10}</div>
            <div className="home-stat-label">Кг</div>
          </div>
          <div className="home-stat-item">
            <div className="home-stat-value">{myPlaces}</div>
            <div className="home-stat-label">Мест</div>
          </div>
        </div>
      )}

      {/* Recent records from all members */}
      {recentRecords.length > 0 && (
        <>
          <div className="section-title">Последние рыбалки</div>
          {recentRecords.map((r, idx) => (
            <Link key={r.id} to={`/record/${r.id}`} style={{ textDecoration: 'none', display: 'block' }}>
              <div className="card" style={{ animationDelay: `${idx * 0.04}s`, marginBottom: 10 }}>
                {r.owner && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: r.owner.color || 'var(--accent)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#000', fontWeight: 700, fontSize: 13, flexShrink: 0,
                    }}>
                      {r.owner.first_name?.charAt(0)?.toUpperCase()}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                      {r.owner.first_name}{r.owner.role === 'owner' ? ' 👑' : ''}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-dim)', marginLeft: 'auto' }}>
                      {new Date(r.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 12 }}>
                  {r.photos?.[0]?.photo_url && (
                    <div style={{ width: 56, height: 56, borderRadius: 12, overflow: 'hidden', flexShrink: 0 }}>
                      <img src={r.photos[0].photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{r.water_body_name}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', gap: 12 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Fish size={14} style={{ color: 'var(--accent)' }} /> {r.total_fish_count}
                      </span>
                      {r.total_weight && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Scale size={14} style={{ color: 'var(--text-dim)' }} /> {r.total_weight} кг
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </>
      )}

      {/* Quick actions */}
      <div className="quick-actions" style={{ marginTop: recentRecords.length > 0 ? 8 : 0 }}>
        <div className="card quick-action-card" onClick={() => navigate('/add')} style={{ cursor: 'pointer' }}>
          <div className="quick-action-icon" style={{ background: 'var(--accent)', color: '#000' }}>
            <Plus size={22} strokeWidth={2.5} />
          </div>
          <div className="quick-action-label">Добавить рыбалку</div>
        </div>
        <Link to="/map" style={{ textDecoration: 'none' }}>
          <div className="card quick-action-card">
            <div className="quick-action-icon" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
              <MapPin size={22} />
            </div>
            <div className="quick-action-label">Мои места</div>
          </div>
        </Link>
      </div>

      {/* Menu */}
      <div className="section-title">Разделы</div>
      <Link to="/feed" style={{ textDecoration: 'none' }}>
        <div className="card card-row" style={{ marginBottom: 10 }}>
          <div className="card-icon" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
            <Users size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <div className="card-title">Лента клуба</div>
            <div className="card-subtitle">Рыбалки всех участников</div>
          </div>
          <ChevronRight size={18} style={{ color: 'var(--text-dim)' }} />
        </div>
      </Link>
      <Link to="/history" style={{ textDecoration: 'none' }}>
        <div className="card card-row" style={{ marginBottom: 10 }}>
          <div className="card-icon" style={{ background: 'rgba(41,128,185,0.15)', color: '#5DADE2' }}>
            <Calendar size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <div className="card-title">Мои рыбалки</div>
            <div className="card-subtitle">Личная история</div>
          </div>
          <ChevronRight size={18} style={{ color: 'var(--text-dim)' }} />
        </div>
      </Link>
      <Link to="/stats" style={{ textDecoration: 'none' }}>
        <div className="card card-row" style={{ marginBottom: 10 }}>
          <div className="card-icon" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
            <BarChart3 size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <div className="card-title">Статистика</div>
            <div className="card-subtitle">Анализ уловов</div>
          </div>
          <ChevronRight size={18} style={{ color: 'var(--text-dim)' }} />
        </div>
      </Link>
      <Link to="/achievements" style={{ textDecoration: 'none' }}>
        <div className="card card-row">
          <div className="card-icon" style={{ background: 'var(--gold-dim)', color: 'var(--gold)' }}>
            <Trophy size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <div className="card-title">Достижения</div>
            <div className="card-subtitle">Награды и рекорды</div>
          </div>
          <ChevronRight size={18} style={{ color: 'var(--text-dim)' }} />
        </div>
      </Link>

      {recentRecords.length === 0 && (
        <div className="card" style={{ textAlign: 'center', marginTop: 16 }}>
          <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.4 }}>
            <Fish size={32} style={{ color: 'var(--accent)' }} />
          </div>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Первая рыбалка ещё впереди.<br />Добавьте свой первый выезд!
          </p>
        </div>
      )}
    </div>
  )
}