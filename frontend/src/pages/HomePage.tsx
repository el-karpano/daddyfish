import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { api } from '../api'

export default function HomePage() {
  const [recordCount, setRecordCount] = useState<number | null>(null)
  const [firstVisit, setFirstVisit] = useState(false)

  useEffect(() => {
    api.getRecords().then(records => {
      setRecordCount(records.length)
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
          <div className="empty-state-emoji">🎣</div>
          <h2 className="empty-state-title">Добро пожаловать в твою рыбацкую историю</h2>
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
      <div className="hero">
        <div className="hero-emoji">🎣</div>
        <h1>МОЯ РЫБАЛКА</h1>
        <p>Твой личный рыбацкий дневник</p>
      </div>

      <Link to="/add" style={{ textDecoration: 'none' }}>
        <div className="card" style={{ background: 'linear-gradient(135deg, var(--accent-dim), rgba(26,82,118,0.3))', border: '1px solid rgba(46,204,113,0.2)' }}>
          <div className="card-row">
            <div className="card-icon" style={{ background: 'var(--accent)', color: '#000' }}>🎣</div>
            <div>
              <div className="card-title">Добавить рыбалку</div>
              <div className="card-subtitle">Записать новый выезд</div>
            </div>
          </div>
        </div>
      </Link>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 4 }}>
        <Link to="/map" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ textAlign: 'center', padding: '20px 12px' }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>🗺</div>
            <div className="card-title" style={{ fontSize: 14 }}>Мои места</div>
          </div>
        </Link>
        <Link to="/stats" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ textAlign: 'center', padding: '20px 12px' }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>📊</div>
            <div className="card-title" style={{ fontSize: 14 }}>Статистика</div>
          </div>
        </Link>
        <Link to="/achievements" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ textAlign: 'center', padding: '20px 12px' }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>🏆</div>
            <div className="card-title" style={{ fontSize: 14 }}>Достижения</div>
          </div>
        </Link>
        <Link to="/history" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ textAlign: 'center', padding: '20px 12px' }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>📋</div>
            <div className="card-title" style={{ fontSize: 14 }}>История</div>
          </div>
        </Link>
      </div>

      {recordCount === 0 && (
        <div className="card" style={{ textAlign: 'center', marginTop: 16 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🎣</div>
          <p style={{ fontSize: 14, color: 'var(--text-dim)' }}>
            Первая рыбалка ещё впереди.<br />Добавьте свой первый выезд!
          </p>
        </div>
      )}
    </div>
  )
}
