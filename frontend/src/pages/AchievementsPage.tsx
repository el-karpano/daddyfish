import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import {
  ArrowLeft, Trophy, Award, Lock, Star, Zap, Target, Fish
} from 'lucide-react'

const ACHIEVEMENT_ICONS: Record<string, any> = {
  first_trip: Zap,
  first_catch: Fish,
  ten_trips: Star,
  experienced: Award,
  hundred_fish: Target,
  big_catch: Trophy,
  first_trophy: Trophy,
  trophy_fisher: Trophy,
  explorer: Target,
  water_conqueror: Target,
  pike_hunter: Fish,
  perch_hunter: Fish,
  sharpshooter: Target,
  ichthyologist: Fish,
  heavyweight: Trophy,
  big_water: Target,
  photo_memory: Star,
  chronicler: Award,
  record_breaker: Trophy,
  true_fisher: Award,
}

export default function AchievementsPage() {
  const navigate = useNavigate()
  const [achievements, setAchievements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newAch, setNewAch] = useState<any>(null)

  useEffect(() => {
    api.getAchievements().then(achs => {
      setAchievements(achs)
      const newly = achs.find((a: any) => a.newly_unlocked)
      if (newly) setNewAch(newly)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="page">
        <div className="back-header">
          <button className="btn-icon" onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
          <h1 className="back-header-title">Достижения</h1>
        </div>
        {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 82, marginBottom: 10 }} />)}
      </div>
    )
  }

  const unlocked = achievements.filter(a => a.unlocked).length

  return (
    <div className="page">
      <div className="back-header">
        <button className="btn-icon" onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
        <h1 className="back-header-title">Достижения</h1>
      </div>

      {/* Progress header */}
      <div className="card" style={{
        textAlign: 'center',
        padding: '20px 16px',
        background: 'linear-gradient(135deg, var(--accent-dim), rgba(32,216,121,0.04))',
        border: '1px solid rgba(32,216,121,0.12)',
        marginBottom: 20,
      }}>
        <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent)' }}>{unlocked}</div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
          из {achievements.length} достижений
        </div>
        <div className="progress-bar" style={{ marginTop: 12 }}>
          <div className="progress-fill" style={{ width: `${(unlocked / achievements.length) * 100}%` }} />
        </div>
      </div>

      {achievements.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Trophy size={32} />
          </div>
          <h3 className="empty-state-title">Первые достижения уже совсем близко</h3>
          <p className="empty-state-text">Начните добавлять рыбалки, чтобы разблокировать достижения.</p>
        </div>
      )}

      {achievements.map((a, idx) => {
        const IconComp = ACHIEVEMENT_ICONS[a.id] || Trophy
        return (
          <div
            key={a.id}
            className={`card achievement-card ${a.unlocked ? '' : 'locked'}`}
            style={{ animationDelay: `${idx * 0.04}s` }}
          >
            <div className={`achievement-icon ${a.unlocked ? 'unlocked' : 'locked-icon'}`}>
              {a.unlocked ? <IconComp size={22} /> : <Lock size={18} style={{ opacity: 0.5 }} />}
            </div>
            <div className="achievement-info">
              <div className="achievement-title">{a.title}</div>
              <div className="achievement-desc">{a.description}</div>
              {!a.unlocked && a.target > 1 && (
                <>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${Math.min(100, (a.progress / a.target) * 100)}%` }} />
                  </div>
                  <div className="progress-text">{a.progress} / {a.target}</div>
                </>
              )}
            </div>
            {a.unlocked && (
              <div style={{
                fontSize: 11,
                color: 'var(--accent)',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                flexShrink: 0,
              }}>
                Получено
              </div>
            )}
          </div>
        )
      })}

      {/* New achievement popup */}
      {newAch && (
        <>
          <div className="overlay" onClick={() => setNewAch(null)} />
          <div className="achievement-popup" onClick={() => setNewAch(null)}>
            <div className="achievement-popup-icon">
              <Award size={48} style={{ color: 'var(--gold)' }} />
            </div>
            <div className="achievement-popup-title">Новое достижение!</div>
            <div className="achievement-popup-name">{newAch.title}</div>
          </div>
        </>
      )}
    </div>
  )
}