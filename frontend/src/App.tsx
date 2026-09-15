import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom'
import HomePage from './pages/HomePage'
import MapPage from './pages/MapPage'
import HistoryPage from './pages/HistoryPage'
import DetailPage from './pages/DetailPage'
import AddFishingPage from './pages/AddFishingPage'
import EditPage from './pages/EditPage'
import StatsPage from './pages/StatsPage'
import AchievementsPage from './pages/AchievementsPage'
import ProfilePage from './pages/ProfilePage'

function BottomNav() {
  const items = [
    { to: '/', icon: '🏠', label: 'Главная' },
    { to: '/map', icon: '🗺', label: 'Карта' },
    { to: '/history', icon: '🎣', label: 'Рыбалки' },
    { to: '/profile', icon: '👤', label: 'Профиль' },
  ]
  return (
    <nav className="bottom-nav">
      {items.map(i => (
        <NavLink key={i.to} to={i.to} end={i.to === '/'} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-item-icon">{i.icon}</span>
          <span>{i.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

function AppRoutes() {
  const location = useLocation()
  const hideNav = ['/add', '/map-picker'].some(p => location.pathname.startsWith(p))

  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/record/:id" element={<DetailPage />} />
        <Route path="/add" element={<AddFishingPage />} />
        <Route path="/edit/:id" element={<EditPage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/achievements" element={<AchievementsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
      {!hideNav && <BottomNav />}
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
