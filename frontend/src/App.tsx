import { BrowserRouter, Routes, Route, NavLink, useLocation, useNavigate } from 'react-router-dom'
import HomePage from './pages/HomePage'
import MapPage from './pages/MapPage'
import HistoryPage from './pages/HistoryPage'
import DetailPage from './pages/DetailPage'
import AddFishingPage from './pages/AddFishingPage'
import EditPage from './pages/EditPage'
import StatsPage from './pages/StatsPage'
import AchievementsPage from './pages/AchievementsPage'
import ProfilePage from './pages/ProfilePage'
import { Home, MapPin, Fish, User, Plus } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

function NavItem({ to, icon: Icon, label }: { to: string; icon: LucideIcon; label: string }) {
  return (
    <NavLink to={to} end={to === '/'} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
      <Icon size={22} strokeWidth={1.8} />
      <span>{label}</span>
    </NavLink>
  )
}

function BottomNav() {
  const navigate = useNavigate()

  return (
    <nav className="bottom-nav">
      <NavItem to="/" icon={Home} label="Главная" />
      <NavItem to="/history" icon={Fish} label="Рыбалки" />
      <button className="nav-add-btn" onClick={() => navigate('/add')}>
        <Plus size={24} strokeWidth={2.5} />
      </button>
      <NavItem to="/map" icon={MapPin} label="Места" />
      <NavItem to="/profile" icon={User} label="Профиль" />
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