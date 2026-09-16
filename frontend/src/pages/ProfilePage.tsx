import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import {
  BarChart3, Trophy, ChevronRight, MapPin, Fish, Star,
  Heart, Anchor, Users
} from 'lucide-react'

export default function ProfilePage() {
  const [me, setMe] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.getMe(),
      api.getStatistics(),
      api.getRecords(undefined),
    ]).then(([meData, statsData, allRecords]) => {
      setMe(meData)
      setStats(statsData)
      // Filter to my records
      setRecords(allRecords.filter((r: any) => r.owner?.id === meData.id))
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const club = me?.club
  const isOwner = club?.role === 'owner'

  // Records (my)
  const placeCount = new Set(records.map((r: any) => r.water_body_name)).size
  const bestTrophy = stats?.top_trophies?.[0] || null
  const bestTrip = records.length > 0
    ? records.reduce((best: any, r: any) => (r.total_fish_count > (best?.total_fish_count || 0) ? r : best), null)
    : null
  const placeVisits: Record<string, number> = {}
  records.forEach((r: any) => { placeVisits[r.water_body_name] = (placeVisits[r.water_body_name] || 0) + 1 })
  const mostVisited = Object.entries(placeVisits).sort((a, b) => b[1] - a[1])[0] || null
  const fishTotals: Record<string, number> = {}
  records.forEach((r: any) => {
    (r.catch_items || []).forEach((c: any) => { fishTotals[c.fish_name] = (fishTotals[c.fish_name] || 0) + c.quantity })
  })
  const bestFish = Object.entries(fishTotals).sort((a, b) => b[1] - a[1])[0] || null

  if (loading) {
    return <div className="page"><div className="skeleton" style={{ height: 300 }} /></div>
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Профиль</h1>
      </div>

      {/* Profile hero */}
      <div className="profile-hero">
        <div className="profile-avatar" style={{ borderColor: me?.color || 'var(--accent)' }}>
          {me?.first_name?.charAt(0)?.toUpperCase() || <Anchor size={28} />}
        </div>
        <div className="profile-name">{me?.first_name || 'Рыбак'} {me?.last_name || ''}</div>
        <div style={{ fontSize: 13, color: me?.color || 'var(--accent)', fontWeight: 600, marginTop: 4 }}>
          {isOwner ? '👑 Владелец клуба' : 'Участник'}
        </div>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="profile-stat-row">
          <div className="profile-stat-item">
            <div className="profile-stat-value">{stats.total_fishing_records}</div>
            <div className="profile-stat-label">Рыбалок</div>
          </div>
          <div className="profile-stat-item">
            <div className="profile-stat-value">{stats.total_fish_caught}</div>
            <div className="profile-stat-label">Рыб</div>
          </div>
          <div className="profile-stat-item">
            <div className="profile-stat-value">{stats.total_weight ? Math.round(stats.total_weight) : '—'}</div>
            <div className="profile-stat-label">Кг</div>
          </div>
          <div className="profile-stat-item">
            <div className="profile-stat-value">{placeCount}</div>
            <div className="profile-stat-label">Мест</div>
          </div>
        </div>
      )}

      {/* My Records */}
      <div className="section-title">Мои рекорды</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--gold-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
            <Trophy size={16} style={{ color: 'var(--gold)' }} />
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4, fontWeight: 600 }}>Самая большая рыба</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{bestTrophy ? bestTrophy.fish_name : '—'}</div>
          {bestTrophy && <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{bestTrophy.weight} кг</div>}
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
            <Star size={16} style={{ color: 'var(--accent)' }} />
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4, fontWeight: 600 }}>Лучшая рыбалка</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{bestTrip ? `${bestTrip.total_fish_count} рыб` : '—'}</div>
          {bestTrip && <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{bestTrip.water_body_name}</div>}
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(41,128,185,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
            <MapPin size={16} style={{ color: '#5DADE2' }} />
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4, fontWeight: 600 }}>Излюбленное место</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{mostVisited ? mostVisited[0] : '—'}</div>
          {mostVisited && <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{mostVisited[1]} рыбалок</div>}
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
            <Fish size={16} style={{ color: 'var(--accent)' }} />
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4, fontWeight: 600 }}>Самая частая рыба</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{bestFish ? bestFish[0] : '—'}</div>
          {bestFish && <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{bestFish[1]} шт.</div>}
        </div>
      </div>

      {/* Menu */}
      <div className="section-title">Ещё</div>
      <Link to="/members" style={{ textDecoration: 'none' }}>
        <div className="card card-row" style={{ marginBottom: 10 }}>
          <div className="card-icon" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
            <Users size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <div className="card-title">Участники</div>
            <div className="card-subtitle">{club?.member_count || '?'} человек в клубе</div>
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
            <div className="card-subtitle">Моя и клуба</div>
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
            <div className="card-subtitle">Награды и прогресс</div>
          </div>
          <ChevronRight size={18} style={{ color: 'var(--text-dim)' }} />
        </div>
      </Link>

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: 40, paddingBottom: 20 }}>
        <Heart size={20} style={{ color: 'var(--text-dim)', opacity: 0.4, marginBottom: 8 }} />
        <div className="profile-text">Сделано специально для вас</div>
        <div className="profile-text" style={{ marginTop: 4, fontSize: 12 }}>Ваша общая история рыбалок</div>
      </div>
    </div>
  )
}