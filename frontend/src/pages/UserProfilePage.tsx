import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { api } from '../api'
import {
  ArrowLeft, Fish, Trophy, Trash2, ChevronRight
} from 'lucide-react'

export default function UserProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<any>(null)
  const [me, setMe] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showRemove, setShowRemove] = useState(false)
  const [removing, setRemoving] = useState(false)

  useEffect(() => {
    Promise.all([
      api.getUserProfile(Number(id)),
      api.getMe(),
    ]).then(([p, m]) => {
      setProfile(p)
      setMe(m)
    }).catch(() => navigate('/members')).finally(() => setLoading(false))
  }, [id])

  const handleRemove = async () => {
    setRemoving(true)
    try {
      await api.removeMember(Number(id))
      navigate('/members')
    } catch {} finally {
      setRemoving(false)
    }
  }

  if (loading || !profile) {
    return <div className="page"><div className="skeleton" style={{ height: 300 }} /></div>
  }

  const isOwner = me?.club?.role === 'owner'
  const isMe = me?.id === profile.id
  const stats = profile.stats || {}

  return (
    <div className="page">
      <div className="back-header">
        <button className="btn-icon" onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
        <h1 className="back-header-title">{profile.first_name}</h1>
      </div>

      {/* Profile hero */}
      <div className="profile-hero">
        <div className="profile-avatar" style={{ borderColor: profile.color }}>
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: 28, fontWeight: 700 }}>{profile.first_name?.charAt(0)?.toUpperCase()}</span>
          )}
        </div>
        <div className="profile-name">{profile.first_name} {profile.last_name}</div>
        <div style={{ fontSize: 13, color: profile.color, fontWeight: 600, marginTop: 4 }}>
          {profile.role === 'owner' ? '👑 Владелец клуба' : 'Участник'}
        </div>
      </div>

      {/* Stats */}
      <div className="profile-stat-row">
        <div className="profile-stat-item">
          <div className="profile-stat-value">{stats.total_fishing_records || 0}</div>
          <div className="profile-stat-label">Рыбалок</div>
        </div>
        <div className="profile-stat-item">
          <div className="profile-stat-value">{stats.total_fish_caught || 0}</div>
          <div className="profile-stat-label">Рыб</div>
        </div>
        <div className="profile-stat-item">
          <div className="profile-stat-value">{stats.total_weight ? Math.round(stats.total_weight) : '—'}</div>
          <div className="profile-stat-label">Кг</div>
        </div>
        <div className="profile-stat-item">
          <div className="profile-stat-value">{stats.places || 0}</div>
          <div className="profile-stat-label">Мест</div>
        </div>
      </div>

      {/* Best trophy */}
      {profile.best_trophy && (
        <div className="card">
          <div className="detail-section-title">
            <Trophy size={14} style={{ marginRight: 6, verticalAlign: -2, color: 'var(--gold)' }} /> Лучший трофей
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
            {profile.best_trophy.fish_name}
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            {profile.best_trophy.weight} кг
          </div>
        </div>
      )}

      {/* View records */}
      <Link to={`/history?user=${id}`} style={{ textDecoration: 'none' }}>
        <div className="card card-row">
          <div className="card-icon" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
            <Fish size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <div className="card-title">Посмотреть рыбалки</div>
            <div className="card-subtitle">{stats.total_fishing_records || 0} записей</div>
          </div>
          <ChevronRight size={18} style={{ color: 'var(--text-dim)' }} />
        </div>
      </Link>

      {/* Owner: remove button */}
      {isOwner && !isMe && (
        <button className="btn btn-danger" style={{ marginTop: 20 }} onClick={() => setShowRemove(true)}>
          <Trash2 size={16} /> Удалить из клуба
        </button>
      )}

      {/* Remove confirmation */}
      {showRemove && (
        <>
          <div className="overlay" onClick={() => setShowRemove(false)} />
          <div className="confirm-dialog">
            <h3>Удалить {profile.first_name}?</h3>
            <p>Все его рыбалки, фотографии, статистика и достижения будут удалены навсегда.</p>
            <div className="btn-group" style={{ flexDirection: 'row' }}>
              <button className="btn btn-secondary" onClick={() => setShowRemove(false)}>Отмена</button>
              <button className="btn btn-danger" onClick={handleRemove} disabled={removing}>
                {removing ? 'Удаление...' : 'Удалить'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}