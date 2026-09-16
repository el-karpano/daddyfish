import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { api } from '../api'
import {
  Plus, MapPin, BarChart3, Trophy, Fish, Calendar,
  ChevronRight, Anchor
} from 'lucide-react'

export default function HomePage() {
  const navigate = useNavigate()
  const [recordCount, setRecordCount] = useState<number | null>(null)
  const [totalFish, setTotalFish] = useState(0)
  const [totalWeight, setTotalWeight] = useState(0)
  const [placeCount, setPlaceCount] = useState(0)
  const [lastRecord, setLastRecord] = useState<any>(null)
  const [firstVisit, setFirstVisit] = useState(false)

  useEffect(() => {
    api.getRecords().then(records => {
      setRecordCount(records.length)
      const fish = records.reduce((s: number, r: any) => s + (r.total_fish_count || 0), 0)
      const weight = records.reduce((s: number, r: any) => s + (r.total_weight || 0), 0)
      const places = new Set(records.map((r: any) => r.water_body_name)).size
      setTotalFish(fish)
      setTotalWeight(Math.round(weight * 10) / 10)
      setPlaceCount(places)
      if (records.length > 0) {
        setLastRecord(records[0])
      }
      if (records.length === 0 && !localStorage.getItem('welcomed')) {
        setFirstVisit(true)
      }
    }).catch(() => setRecordCount(0))
  }, [])

  const dismissWelcome = () => {
    localStorage.setItem('welcomed', '1')
    setFirstVisit(false)
  }

  if (firstVisit) {
    return (
      <div className="page" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="empty-state">
          <div className="empty-state-icon">
            <Anchor size={32} />
          </div>
          <h2 className="empty-state-title">Добро пожаловать</h2>
          <p className="empty-state-text">
            Здесь будут храниться твои лучшие места, уловы, фотографии и рекорды.
          </p>
          <button className="btn btn-primary" onClick={dismissWelcome} style={{ maxWidth: 240 }}>
            Начать
          </button>
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
          <div className="hero-banner-sub">Мои места, уловы и воспоминания</div>
        </div>
      </div>

      {/* Stats row */}
      {recordCount !== null && recordCount > 0 && (
        <div className="home-stats-row">
          <div className="home-stat-item">
            <div className="home-stat-value">{recordCount}</div>
            <div className="home-stat-label">Рыбалок</div>
          </div>
          <div className="home-stat-item">
            <div className="home-stat-value">{totalFish}</div>
            <div className="home-stat-label">Рыб</div>
          </div>
          <div className="home-stat-item">
            <div className="home-stat-value">{totalWeight}</div>
            <div className="home-stat-label">Кг</div>
          </div>
          <div className="home-stat-item">
            <div className="home-stat-value">{placeCount}</div>
            <div className="home-stat-label">Мест</div>
          </div>
        </div>
      )}

      {/* Last record */}
      {lastRecord && (
        <Link to={`/record/${lastRecord.id}`} style={{ textDecoration: 'none', display: 'block' }}>
          <div className="last-record-card">
            {lastRecord.photos?.[0]?.photo_url ? (
              <img className="last-record-bg" src={lastRecord.photos[0].photo_url} alt="" />
            ) : (
              <div className="last-record-placeholder">
                <Fish size={48} style={{ opacity: 0.15, color: 'var(--accent)' }} />
              </div>
            )}
            <div className="last-record-overlay">
              <div className="last-record-label">Последняя рыбалка</div>
              <div className="last-record-name">{lastRecord.water_body_name}</div>
              <div className="last-record-meta">
                <span>{new Date(lastRecord.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}</span>
                <span>{lastRecord.total_fish_count} рыб</span>
                {lastRecord.total_weight && <span>{lastRecord.total_weight} кг</span>}
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* Quick actions */}
      <div className="quick-actions">
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

      {/* Menu cards */}
      <div className="section-title">Разделы</div>
      <Link to="/stats" style={{ textDecoration: 'none' }}>
        <div className="card card-row" style={{ marginBottom: 10 }}>
          <div className="card-icon" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
            <BarChart3 size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <div className="card-title">Статистика</div>
            <div className="card-subtitle">Анализ уловов и мест</div>
          </div>
          <ChevronRight size={18} style={{ color: 'var(--text-dim)' }} />
        </div>
      </Link>
      <Link to="/achievements" style={{ textDecoration: 'none' }}>
        <div className="card card-row" style={{ marginBottom: 10 }}>
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
      <Link to="/history" style={{ textDecoration: 'none' }}>
        <div className="card card-row">
          <div className="card-icon" style={{ background: 'rgba(41,128,185,0.15)', color: '#5DADE2' }}>
            <Calendar size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <div className="card-title">История</div>
            <div className="card-subtitle">Все записи</div>
          </div>
          <ChevronRight size={18} style={{ color: 'var(--text-dim)' }} />
        </div>
      </Link>

      {recordCount === 0 && (
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