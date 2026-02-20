import { useState } from 'react'

import { PrivacyBadge } from '../components/common/PrivacyBadge'
import { exportMyData } from '../services/exportService'

export default function DataExport() {
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
    <div className="container">
      <h1>Data export</h1>
      <p>
        Your export will include all your AI usage declarations and sharing
        preferences in JSON format.
      </p>
      <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
        <li>Included: declarations, sharing preferences</li>
        <li>Not included: email, authentication data</li>
      </ul>
      <button
        type="button"
        onClick={handleDownload}
        disabled={isExporting}
      >
        {isExporting ? 'Preparing download…' : 'Download My Data'}
      </button>
      {success && (
        <p style={{ marginTop: '1rem', color: 'green' }}>
          Your data export has been downloaded.
        </p>
      )}
      <PrivacyBadge />
    </div>
  )
}
