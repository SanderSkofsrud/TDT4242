import { Link } from 'react-router-dom'

import { useAuth } from '../../context/AuthContext'

export function NavBar() {
  const { logout } = useAuth()

  return (
    <nav className="sticky top-0 z-10 bg-surface border-b border-slate-200 shadow-sm">
      <div className="container-app">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <Link
            to="/dashboard"
            className="text-xl font-bold text-slate-900 hover:text-primary-600 transition-colors"
          >
            AI Guidebook
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              to="/dashboard"
              className="btn-secondary py-2 px-4 text-sm"
            >
              Home
            </Link>
            <Link
              to="/profile"
              className="btn-secondary py-2 px-4 text-sm"
            >
              Profile
            </Link>
            <button
              type="button"
              onClick={logout}
              className="btn-secondary py-2 px-4 text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
