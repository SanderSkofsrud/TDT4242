import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'

import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { PrivacyBadge } from '../components/common/PrivacyBadge'
import { CategorySelector } from '../components/declaration/CategorySelector'
import { ToolSelector } from '../components/declaration/ToolSelector'
import { FrequencySelector } from '../components/declaration/FrequencySelector'
import { FreeTextContext } from '../components/declaration/FreeTextContext'
import { ConfirmationModal } from '../components/declaration/ConfirmationModal'
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
      <div className="container">
        <p className="error">No assignment specified</p>
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
      <div className="container">
        <p className="error">{guidanceError.message}</p>
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
      const declaration = await submit({
        assignmentId,
        toolsUsed,
        categories: categories as Declaration['categories'],
        frequency: frequency as Declaration['frequency'],
        contextText: contextText.trim() || null,
      })
      if (declaration) {
        navigate(`/declarations/${declaration.id}/feedback`)
      }
    } catch {
      setShowConfirm(false)
    }
  }

  return (
    <div className="container">
      <h1>Submit AI usage declaration</h1>

      {guidance && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2>Assignment guidance</h2>
          <p><strong>Permitted:</strong> {guidance.permittedText}</p>
          <p><strong>Prohibited:</strong> {guidance.prohibitedText}</p>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleOpenConfirm()
        }}
      >
        <div style={{ marginBottom: '1.5rem' }}>
          <CategorySelector value={categories} onChange={setCategories} />
        </div>
        <div style={{ marginBottom: '1.5rem' }}>
          <ToolSelector value={toolsUsed} onChange={setToolsUsed} />
        </div>
        <div style={{ marginBottom: '1.5rem' }}>
          <FrequencySelector value={frequency} onChange={setFrequency} />
        </div>
        <div style={{ marginBottom: '1.5rem' }}>
          <FreeTextContext value={contextText} onChange={setContextText} />
        </div>

        {validationError && <p className="error">{validationError}</p>}
        {submitError && <p className="error">{submitError.message}</p>}

        <button type="submit" disabled={isSubmitting}>
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
