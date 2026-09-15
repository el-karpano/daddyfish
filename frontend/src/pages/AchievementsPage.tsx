import { useState, useEffect } from 'react'
import { api } from '../api'

export default function AchievementsPage() {
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
        <h2 className="page-title">🏆 ДОСТИЖЕНИЯ</h2>
        {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 70, marginBottom: 10 }} />)}
      </div>
    )
  }

  const unlocked = achievements.filter(a => a.unlocked).length

  return (
    <div className="page">
      <h2 className="page-title">🏆 ДОСТИЖЕНИЯ</h2>
      <p style={{ fontSize: 14, color: 'var(--text-dim)', marginBottom: 20 }}>
        Получено: {unlocked} / {achievements.length}
      </p>

      {achievements.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-emoji">🏆</div>
          <h3 className="empty-state-title">Первые достижения уже совсем близко</h3>
          <p className="empty-state-text">Начните добавлять рыбалки, чтобы разблокировать достижения.</p>
        </div>
      )}

      {achievements.map(a => (
        <div key={a.id} className={`card achievement-card ${a.unlocked ? '' : 'locked'}`}>
          <div className={`achievement-icon ${a.unlocked ? 'unlocked' : 'locked-icon'}`}>
            {a.unlocked ? a.icon : '🔒'}
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
        </div>
      ))}

      {newAch && (
        <>
          <div className="overlay" onClick={() => setNewAch(null)} />
          <div className="achievement-popup" onClick={() => setNewAch(null)}>
            <div className="achievement-popup-icon">🏆</div>
            <div className="achievement-popup-title">НОВОЕ ДОСТИЖЕНИЕ!</div>
            <div className="achievement-popup-name">{newAch.icon} {newAch.title}</div>
          </div>
        </>
      )}
    </div>
  )
}
