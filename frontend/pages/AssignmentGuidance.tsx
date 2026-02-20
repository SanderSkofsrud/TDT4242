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
      <div className="container">
        <p className="error">No assignment specified</p>
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
      <div className="container">
        {is404(error) ? (
          <p>No guidance has been provided for this assignment yet.</p>
        ) : (
          <p className="error">{error.message}</p>
        )}
        <PrivacyBadge />
      </div>
    )
  }

  if (!guidance) {
    return (
      <div className="container">
        <p>No guidance has been provided for this assignment yet.</p>
        <PrivacyBadge />
      </div>
    )
  }

  return (
    <>
      <div className="container">
        <h1>Assignment guidance</h1>
        <GuidanceCard guidance={guidance} />
      </div>
      <PrivacyBadge />
    </>
  )
}
