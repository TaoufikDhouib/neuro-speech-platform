import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import Logo from './Logo'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
    setMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Top Navigation */}
      <nav className="bg-white border-b-2 border-[#E5E5E5] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          {/* Logo */}
          <Link to="/dashboard" className="group">
            <Logo size="sm" />
          </Link>

          {/* Nav links (desktop) */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              to="/dashboard"
              className={`px-4 py-2 rounded-xl font-bold text-sm transition-all duration-150 ${
                location.pathname === '/dashboard'
                  ? 'bg-brand-100 text-brand-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              🏠 Dashboard
            </Link>
          </div>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-2xl hover:bg-gray-100 transition-colors duration-150"
            >
              <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-white font-black text-sm">
                {user?.name?.[0]?.toUpperCase() ?? 'U'}
              </div>
              <span className="font-bold text-sm text-gray-700 hidden sm:block">
                {user?.name ?? 'User'}
              </span>
              <span className="text-gray-400 text-xs">▼</span>
            </button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl border-2 border-[#E5E5E5] py-2 z-50"
                >
                  <div className="px-4 py-2 border-b-2 border-[#E5E5E5]">
                    <p className="font-black text-gray-800 text-sm">{user?.name}</p>
                    <p className="text-xs text-gray-400 font-semibold truncate">{user?.email}</p>
                  </div>
                  <Link
                    to="/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50 hover:text-brand-700 transition-colors"
                  >
                    🏠 Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm font-bold text-[#FF4B4B] hover:bg-[#FFE9E9] transition-colors"
                  >
                    🚪 Sign Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </nav>

      {menuOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
      )}

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  )
}
