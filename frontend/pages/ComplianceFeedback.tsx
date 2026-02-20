import { useParams } from 'react-router-dom'

import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { PrivacyBadge } from '../components/common/PrivacyBadge'
import { FeedbackView } from '../components/feedback/FeedbackView'
import { useFeedback } from '../hooks/useDeclaration'

export default function ComplianceFeedback() {
  const { declarationId } = useParams<{ declarationId: string }>()
  const { feedback, isLoading, error } = useFeedback(declarationId ?? '')

  if (!declarationId) {
    return (
      <div className="container-app py-12">
        <p className="error-message">No declaration specified</p>
        <PrivacyBadge />
      </div>
    )
  }

  if (isLoading) {
    return (
      <>
        <LoadingSpinner message="Loading feedback…" />
        <PrivacyBadge />
      </>
    )
  }

  if (error || !feedback) {
    return (
      <div className="container-app py-12">
        <p className="error-message">{error?.message ?? 'Feedback not found'}</p>
        <PrivacyBadge />
      </div>
    )
  }

  return (
    <>
      <FeedbackView feedback={feedback} />
      <PrivacyBadge />
    </>
  )
}
