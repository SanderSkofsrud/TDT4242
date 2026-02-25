import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'

import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { PrivacyBadge } from '../components/common/PrivacyBadge'
import { CategorySelector } from '../components/declaration/CategorySelector'
import { ToolSelector } from '../components/declaration/ToolSelector'
import { FrequencySelector } from '../components/declaration/FrequencySelector'
import { FreeTextContext } from '../components/declaration/FreeTextContext'
import { ConfirmationModal } from '../components/declaration/ConfirmationModal'
import { GuidanceCard } from '../components/guidance/GuidanceCard'
import { useGuidance } from '../hooks/useGuidance'
import { useSubmitDeclaration } from '../hooks/useDeclaration'
import type { Declaration } from '../types/models'

export default function DeclarationSubmit() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const assignmentId = searchParams.get('assignmentId') ?? ''

  const { guidance, isLoading: guidanceLoading, error: guidanceError } = useGuidance(assignmentId)
  const { submit, isSubmitting, error: submitError } = useSubmitDeclaration()

  const [categories, setCategories] = useState<string[]>([])
  const [toolsUsed, setToolsUsed] = useState<string[]>([])
  const [frequency, setFrequency] = useState<string>('')
  const [contextText, setContextText] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  if (!assignmentId) {
    return (
      <div className="container-app py-12">
        <p className="error-message">No assignment specified</p>
        <PrivacyBadge />
      </div>
    )
  }

  if (guidanceLoading) {
    return (
      <>
        <LoadingSpinner message="Loading assignment guidance…" />
        <PrivacyBadge />
      </>
    )
  }

  if (guidanceError) {
    return (
      <div className="container-app py-12">
        <p className="error-message">{guidanceError.message}</p>
        <PrivacyBadge />
      </div>
    )
  }

  const handleOpenConfirm = () => {
    setValidationError(null)
    if (categories.length === 0) {
      setValidationError('Select at least one category.')
      return
    }
    if (toolsUsed.length === 0) {
      setValidationError('Select at least one tool.')
      return
    }
    if (!frequency) {
      setValidationError('Select a frequency.')
      return
    }
    setShowConfirm(true)
  }

  const handleConfirmSubmit = async () => {
    try {
      const trimmedContext = contextText.trim()
      const declaration = await submit({
        assignmentId,
        toolsUsed,
        categories: categories as Declaration['categories'],
        frequency: frequency as Declaration['frequency'],
        // Omit contextText when empty so backend optional() validator passes.
        contextText: trimmedContext === '' ? undefined : trimmedContext,
      })
      if (declaration) {
        navigate(`/declarations/${declaration.id}/feedback`)
      }
    } catch {
      setShowConfirm(false)
    }
  }

  return (
    <div className="container-app py-12 sm:py-16">
      <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-8">
        Submit AI usage declaration
      </h1>

      {guidance && (
        <div className="card-elevated mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-3">Assignment guidance</h2>
          <GuidanceCard guidance={guidance} />
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleOpenConfirm()
        }}
        className="space-y-8"
      >
        <CategorySelector value={categories} onChange={setCategories} />
        <ToolSelector value={toolsUsed} onChange={setToolsUsed} />
        <FrequencySelector value={frequency} onChange={setFrequency} />
        <FreeTextContext value={contextText} onChange={setContextText} />

        {validationError && <p className="error-message">{validationError}</p>}
        {submitError && <p className="error-message">{submitError.message}</p>}

        <button type="submit" disabled={isSubmitting} className="btn-primary">
          Continue to confirmation
        </button>
      </form>

      <ConfirmationModal
        isOpen={showConfirm}
        onConfirm={handleConfirmSubmit}
        onCancel={() => setShowConfirm(false)}
      />

      <PrivacyBadge />
    </div>
  )
}
