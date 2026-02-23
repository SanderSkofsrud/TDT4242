import { Link } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'
import { ROLE_CAPABILITIES } from '../types/capabilities'
import { PrivacyBadge } from '../components/common/PrivacyBadge'

const ROLE_LABELS: Record<string, string> = {
  student: 'Student',
  instructor: 'Instructor',
  head_of_faculty: 'Head of Faculty',
  admin: 'Administrator',
}

export default function Profile() {
  const { user } = useAuth()

  if (!user) return null

  const capabilities = ROLE_CAPABILITIES[user.role] ?? []
  const canExport = capabilities.includes('data:export:own')
  const canManageSharing = capabilities.includes('sharing:manage')

  return (
    <div className="container-app py-12 sm:py-16">
      <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-8">
        Profile
      </h1>
      <div className="card-elevated max-w-xl mb-8">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Account</h2>
        <p className="text-slate-600">
          You are logged in as <strong>{ROLE_LABELS[user.role] ?? user.role}</strong>.
        </p>
      </div>
      <div className="max-w-xl space-y-3">
        <Link to="/dashboard" className="block text-primary-600 font-medium hover:underline">
          ← Back to dashboard
        </Link>
        {canExport && (
          <Link to="/export" className="block text-primary-600 font-medium hover:underline">
            Data export
          </Link>
        )}
        {canManageSharing && (
          <Link to="/privacy" className="block text-primary-600 font-medium hover:underline">
            Privacy & sharing settings
          </Link>
        )}
      </div>
      <PrivacyBadge />
    </div>
  )
}
