import { useParams } from 'react-router-dom'

import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { PrivacyBadge } from '../components/common/PrivacyBadge'
import { GuidanceCard } from '../components/guidance/GuidanceCard'
import { useGuidance } from '../hooks/useGuidance'

function is404(err: unknown): boolean {
  return (err as { response?: { status: number } })?.response?.status === 404
}

export default function AssignmentGuidance() {
  const { assignmentId } = useParams<{ assignmentId: string }>()
  const { guidance, isLoading, error } = useGuidance(assignmentId ?? '')

  if (!assignmentId) {
    return (
      <div className="container-app py-12">
        <p className="error-message">No assignment specified</p>
        <PrivacyBadge />
      </div>
    )
  }

  if (isLoading) {
    return (
      <>
        <LoadingSpinner message="Loading guidance…" />
        <PrivacyBadge />
      </>
    )
  }

  if (error) {
    return (
      <div className="container-app py-12">
        {is404(error) ? (
          <p className="text-slate-600">No guidance has been provided for this assignment yet.</p>
        ) : (
          <p className="error-message">{error.message}</p>
        )}
        <PrivacyBadge />
      </div>
    )
  }

  if (!guidance) {
    return (
      <div className="container-app py-12">
        <p className="text-slate-600">No guidance has been provided for this assignment yet.</p>
        <PrivacyBadge />
      </div>
    )
  }

  return (
    <>
      <div className="container-app py-12 sm:py-16">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-8">
          Assignment guidance
        </h1>
        <GuidanceCard guidance={guidance} />
      </div>
      <PrivacyBadge />
    </>
  )
}
