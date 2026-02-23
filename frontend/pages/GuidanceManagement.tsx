import { useParams, useNavigate, useSearchParams } from 'react-router-dom'

import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { PrivacyBadge } from '../components/common/PrivacyBadge'
import { GuidanceForm } from '../components/guidance/GuidanceForm'
import { useGuidance } from '../hooks/useGuidance'
import { useGuidanceForm } from '../hooks/useGuidance'

export default function GuidanceManagement() {
  const { assignmentId } = useParams<{ assignmentId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { guidance, isLoading, error } = useGuidance(assignmentId ?? '')
  const { save, isSaving, error: saveError } = useGuidanceForm(assignmentId ?? '')

  const handleSave = async (data: {
    permittedText: string
    prohibitedText: string
    permittedCategories?: string[] | null
    prohibitedCategories?: string[] | null
    examples?: { permitted: string[]; prohibited: string[] } | null
  }) => {
    await save(data)
    const courseId = searchParams.get('courseId')
    if (courseId) {
      navigate(`/dashboard/instructor/${courseId}/assignments?saved=1`)
    }
  }

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

  if (error && !guidance) {
    return (
      <div className="container-app py-12">
        <p className="error-message">{error.message}</p>
        <PrivacyBadge />
      </div>
    )
  }

  const isLocked = guidance?.lockedAt != null

  return (
    <div className="container-app py-12 sm:py-16">
      <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-8">
        Manage assignment guidance
      </h1>
      {isLocked && (
        <div className="suppressed-notice mb-8">
          This guidance is locked and can no longer be edited as the assignment due date has passed.
        </div>
      )}
      {!isLocked && (
        <>
          {saveError && <p className="error-message mb-4">{saveError.message}</p>}
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
