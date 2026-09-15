import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'

export default function ProfilePage() {
  const [stats, setStats] = useState<any>(null)
  const [userId, setUserId] = useState<number | null>(null)

  useEffect(() => {
    api.getMe().then(r => setUserId(r.telegram_user_id)).catch(() => {})
    api.getStatistics().then(setStats).catch(() => {})
  }, [])

  return (
    <div className="page">
      <h2 className="page-title">👤 ПРОФИЛЬ</h2>

      <div className="card" style={{ textAlign: 'center', padding: 24 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🎣</div>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Рыбак</div>
        {userId && <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>ID: {userId}</div>}
      </div>

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
          <Link to="/stats" style={{ textDecoration: 'none' }}>
            <div className="card" style={{ textAlign: 'center', padding: '16px 12px' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent)' }}>{stats.total_fishing_records}</div>
              <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>Рыбалок</div>
            </div>
          </Link>
          <Link to="/stats" style={{ textDecoration: 'none' }}>
            <div className="card" style={{ textAlign: 'center', padding: '16px 12px' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent)' }}>{stats.total_fish_caught}</div>
              <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>Рыб</div>
            </div>
          </Link>
        </div>
      )}

      <div className="btn-group">
        <Link to="/stats" style={{ textDecoration: 'none' }}><button className="btn btn-secondary">📊 Статистика</button></Link>
        <Link to="/achievements" style={{ textDecoration: 'none' }}><button className="btn btn-secondary">🏆 Достижения</button></Link>
      </div>

      <div className="profile-section" style={{ marginTop: 32 }}>
        <div className="profile-heart">❤️</div>
        <div className="profile-text">Сделано специально для тебя</div>
        <div className="profile-text" style={{ marginTop: 4, fontSize: 13 }}>Твоя личная история рыбалок.</div>
      </div>
    </div>
  )
}
