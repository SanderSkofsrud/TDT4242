import { useParams } from 'react-router-dom'

import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { PrivacyBadge } from '../components/common/PrivacyBadge'
import { GuidanceForm } from '../components/guidance/GuidanceForm'
import { useGuidance } from '../hooks/useGuidance'
import { useGuidanceForm } from '../hooks/useGuidance'

export default function GuidanceManagement() {
  const { assignmentId } = useParams<{ assignmentId: string }>()
  const { guidance, isLoading, error } = useGuidance(assignmentId ?? '')
  const { save, isSaving, error: saveError } = useGuidanceForm(assignmentId ?? '')

  const handleSave = async (data: {
    permittedText: string
    prohibitedText: string
    examples?: { permitted: string[]; prohibited: string[] } | null
  }) => {
    await save(data)
  }

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

  if (error && !guidance) {
    return (
      <div className="container">
        <p className="error">{error.message}</p>
        <PrivacyBadge />
      </div>
    )
  }

  const isLocked = guidance?.lockedAt != null

  return (
    <div className="container">
      <h1>Manage assignment guidance</h1>
      {isLocked && (
        <p className="card" style={{ background: '#fffbeb', borderColor: '#f59e0b' }}>
          This guidance is locked and can no longer be edited as the assignment due date has passed.
        </p>
      )}
      {!isLocked && (
        <>
          {saveError && <p className="error">{saveError.message}</p>}
          <GuidanceForm
            initialValues={guidance ?? undefined}
            onSave={handleSave}
            isSaving={isSaving}
          />
        </>
      )}
      <PrivacyBadge />
    </div>
  )
}
