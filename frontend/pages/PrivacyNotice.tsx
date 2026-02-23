import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { usePrivacy } from '../context/PrivacyContext'

export default function PrivacyNotice() {
  const navigate = useNavigate()
  const { acknowledge } = usePrivacy()
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
    <div className="container-app py-12 sm:py-16">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-8">
          Privacy Notice
        </h1>

        <div className="space-y-8">
          <section className="card-elevated">
            <h2 className="text-xl font-bold text-slate-900 mb-2">What we collect</h2>
            <p className="text-slate-600 leading-relaxed">
              User ID, course ID, assignment ID, tools used, categories, frequency,
              optional context you provide, and timestamps.
            </p>
          </section>

          <section className="card-elevated">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Purpose</h2>
            <p className="text-slate-600 leading-relaxed">
              Educational guidance and integrity documentation only. This data is not
              used for grading or automated decisions.
            </p>
          </section>

          <section className="card-elevated">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Retention</h2>
            <p className="text-slate-600 leading-relaxed">
              183 days from the assignment due date, then hard deleted. No backups
              are kept after deletion.
            </p>
          </section>

          <section className="card-elevated">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Who has access</h2>
            <ul className="list-disc list-inside text-slate-600 space-y-1">
              <li>You: your own data</li>
              <li>Enrolled instructors: only where sharing is active</li>
              <li>Head of faculty: aggregates only, no individual data</li>
              <li>System administrators: infrastructure only, no content access</li>
            </ul>
          </section>

          <section className="card-elevated">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Sharing</h2>
            <p className="text-slate-600 leading-relaxed">
              Your data is private by default. Instructors of courses you are
              enrolled in have access unless you revoke it. You can revoke or
              reinstate access at any time from the sharing settings page.
            </p>
          </section>

          <section className="card-elevated mt-10">
            <h2 className="text-lg font-bold text-slate-900 mb-2">Your choice</h2>
            <p className="text-slate-600 text-sm mb-6">
              You must accept to continue using the service. If you do not agree, use the Logout button in the navigation bar above.
            </p>
            {error && <p className="error-message mb-3">{error}</p>}
            <button
              type="button"
              onClick={handleAcknowledge}
              disabled={isAcknowledging}
              className="btn-primary"
            >
              I understand and agree
            </button>
          </section>
        </div>
      </div>
    </div>
  )
}
