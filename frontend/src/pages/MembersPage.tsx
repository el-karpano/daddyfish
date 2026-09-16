import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../api'
import {
  ArrowLeft, UserPlus, Copy, Share2
} from 'lucide-react'

export default function MembersPage() {
  const navigate = useNavigate()
  const [members, setMembers] = useState<any[]>([])
  const [club, setClub] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [showInvite, setShowInvite] = useState(false)
  const [showRemove, setShowRemove] = useState<any>(null)
  const [removing, setRemoving] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    api.getClub().then(c => {
      setClub(c)
      setMembers(c.members || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const isOwner = club?.role === 'owner'

  const handleInvite = async () => {
    try {
      const resp = await api.createInvite()
      setInviteLink(resp.link)
      setShowInvite(true)
    } catch {}
  }

  const handleCopy = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleShare = () => {
    if (inviteLink && (window as any).Telegram?.WebApp?.openTelegramLink) {
      (window as any).Telegram.WebApp.openTelegramLink(
        `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent('Присоединяйся к нашему рыбацкому клубу!')}`
      )
    }
  }

  const handleRemove = async () => {
    if (!showRemove) return
    setRemoving(true)
    try {
      await api.removeMember(showRemove.id)
      setMembers(members.filter(m => m.id !== showRemove.id))
      setShowRemove(null)
    } catch {} finally {
      setRemoving(false)
    }
  }

  if (loading) {
    return (
      <div className="page">
        <div className="back-header">
          <button className="btn-icon" onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
          <h1 className="back-header-title">Участники</h1>
        </div>
        {[1,2].map(i => <div key={i} className="skeleton" style={{ height: 70, marginBottom: 10 }} />)}
      </div>
    )
  }

  return (
    <div className="page">
      <div className="back-header">
        <button className="btn-icon" onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
        <h1 className="back-header-title">Рыбацкий клуб</h1>
      </div>

      <p className="page-subtitle" style={{ marginBottom: 20 }}>{members.length} участников</p>

      {isOwner && (
        <button className="btn btn-outline" onClick={handleInvite} style={{ marginBottom: 20 }}>
          <UserPlus size={18} /> Пригласить друга
        </button>
      )}

      {members.map((m) => (
        <Link key={m.id} to={`/user/${m.id}`} style={{ textDecoration: 'none' }}>
          <div className="card card-row" style={{ marginBottom: 10 }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              background: m.color || 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#000', fontWeight: 700, fontSize: 18, flexShrink: 0,
            }}>
              {m.first_name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div style={{ flex: 1 }}>
              <div className="card-title">
                {m.first_name}{m.role === 'owner' ? ' 👑' : ''}
              </div>
              <div className="card-subtitle">
                {m.role === 'owner' ? 'Владелец клуба' : 'Участник'}
                {m.record_count !== undefined && ` · ${m.record_count} рыбалок`}
              </div>
            </div>
            <div style={{
              width: 10, height: 10, borderRadius: '50%',
              background: m.color || 'var(--accent)', flexShrink: 0,
            }} />
          </div>
        </Link>
      ))}

      {/* Invite modal */}
      {showInvite && inviteLink && (
        <>
          <div className="overlay" onClick={() => setShowInvite(false)} />
          <div className="confirm-dialog">
            <h3>Пригласить друга</h3>
            <p>Отправьте эту ссылку другу, чтобы он вступил в клуб</p>
            <div style={{
              background: 'var(--bg-input)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-xs)', padding: '12px',
              fontSize: 13, color: 'var(--text-secondary)',
              wordBreak: 'break-all', marginBottom: 16,
            }}>
              {inviteLink}
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={handleCopy}>
                <Copy size={16} /> {copied ? 'Скопировано!' : 'Копировать'}
              </button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleShare}>
                <Share2 size={16} /> Отправить
              </button>
            </div>
            <button className="btn btn-ghost" onClick={() => setShowInvite(false)}>Закрыть</button>
          </div>
        </>
      )}

      {/* Remove confirmation */}
      {showRemove && (
        <>
          <div className="overlay" onClick={() => setShowRemove(null)} />
          <div className="confirm-dialog">
            <h3>Удалить {showRemove.first_name}?</h3>
            <p>Все его рыбалки, фотографии и достижения будут удалены навсегда.</p>
            <div className="btn-group" style={{ flexDirection: 'row' }}>
              <button className="btn btn-secondary" onClick={() => setShowRemove(null)}>Отмена</button>
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