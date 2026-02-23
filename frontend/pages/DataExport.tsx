import { useState } from 'react'

import { PrivacyBadge } from '../components/common/PrivacyBadge'
import { exportMyData } from '../services/exportService'
import { useAuth } from '../context/AuthContext'

export default function DataExport() {
  const { logout } = useAuth()
  const [isExporting, setIsExporting] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleDownload = async () => {
    setIsExporting(true)
    setSuccess(false)
    try {
      await exportMyData()
      setSuccess(true)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="container-app py-12 sm:py-16">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Data export
        </h1>
        <button
          type="button"
          onClick={logout}
          className="btn-secondary"
        >
          Log out
        </button>
      </div>
      <p className="text-slate-600 max-w-xl mb-6 leading-relaxed">
        Your export will include all your AI usage declarations and sharing
        preferences in JSON format.
      </p>
      <ul className="list-disc list-inside text-slate-600 space-y-1 mb-8 max-w-xl">
        <li>Included: declarations, sharing preferences</li>
        <li>Not included: email, authentication data</li>
      </ul>
      <button
        type="button"
        onClick={handleDownload}
        disabled={isExporting}
        className="btn-primary"
      >
        {isExporting ? 'Preparing download…' : 'Download My Data'}
      </button>
      {success && (
        <p className="mt-4 text-emerald-500 font-medium">
          Your data export has been downloaded.
        </p>
      )}
      <PrivacyBadge />
    </div>
  )
}
