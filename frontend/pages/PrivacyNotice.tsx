import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'
import { usePrivacy } from '../context/PrivacyContext'

export default function PrivacyNotice() {
  const navigate = useNavigate()
  const { acknowledge } = usePrivacy()
  const { logout } = useAuth()
  const [isAcknowledging, setIsAcknowledging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAcknowledge = async () => {
    setError(null)
    setIsAcknowledging(true)
    try {
      await acknowledge()
      navigate('/dashboard', { replace: true })
    } catch {
      setError('Failed to save acknowledgement. Please try again.')
    } finally {
      setIsAcknowledging(false)
    }
  }

  return (
    <div className="container">
      <h1>Privacy Notice</h1>

      <section style={{ marginBottom: '1.5rem' }}>
        <h2>What we collect</h2>
        <p>
          User ID, course ID, assignment ID, tools used, categories, frequency,
          optional context you provide, and timestamps.
        </p>
      </section>

      <section style={{ marginBottom: '1.5rem' }}>
        <h2>Purpose</h2>
        <p>
          Educational guidance and integrity documentation only. This data is not
          used for grading or automated decisions.
        </p>
      </section>

      <section style={{ marginBottom: '1.5rem' }}>
        <h2>Retention</h2>
        <p>
          183 days from the assignment due date, then hard deleted. No backups
          are kept after deletion.
        </p>
      </section>

      <section style={{ marginBottom: '1.5rem' }}>
        <h2>Who has access</h2>
        <ul style={{ marginLeft: '1.5rem' }}>
          <li>You: your own data</li>
          <li>Enrolled instructors: only where sharing is active</li>
          <li>Head of faculty: aggregates only, no individual data</li>
          <li>System administrators: infrastructure only, no content access</li>
        </ul>
      </section>

      <section style={{ marginBottom: '1.5rem' }}>
        <h2>Sharing</h2>
        <p>
          Your data is private by default. Instructors of courses you are
          enrolled in have access unless you revoke it. You can revoke or
          reinstate access at any time from the sharing settings page.
        </p>
      </section>

      <div style={{ marginTop: '2rem' }}>
        {error && <p className="error">{error}</p>}
        <button
          type="button"
          onClick={handleAcknowledge}
          disabled={isAcknowledging}
        >
          I understand and agree
        </button>
        <p style={{ marginTop: '1rem' }}>
          <button
            type="button"
            onClick={() => logout()}
            style={{ background: 'none', border: 'none', padding: 0, color: '#0066cc', textDecoration: 'underline', cursor: 'pointer', font: 'inherit' }}
          >
            Log out instead
          </button>
        </p>
      </div>
    </div>
  )
}
