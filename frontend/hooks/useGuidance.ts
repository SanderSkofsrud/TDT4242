import { useEffect, useState } from 'react'

import type { AssignmentGuidance } from '../types/models'
import {
  createGuidance,
  getGuidance,
  updateGuidance,
} from '../services/guidanceService'

export function useGuidance(assignmentId: string) {
  const [guidance, setGuidance] = useState<AssignmentGuidance | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!assignmentId) return
    let cancelled = false
    ;(async () => {
      try {
        const data = await getGuidance(assignmentId)
        if (!cancelled) {
          setGuidance(data)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as Error)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [assignmentId])

  return { guidance, isLoading, error }
}

export function useGuidanceForm(assignmentId: string) {
  const { guidance } = useGuidance(assignmentId)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const save = async (data: {
    permittedText: string
    prohibitedText: string
    permittedCategories?: AssignmentGuidance['permittedCategories']
    prohibitedCategories?: AssignmentGuidance['prohibitedCategories']
    examples?: AssignmentGuidance['examples']
  }) => {
    setIsSaving(true)
    setError(null)
    try {
      if (guidance) {
        await updateGuidance(assignmentId, data)
      } else {
        await createGuidance(assignmentId, data)
      }
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setIsSaving(false)
    }
  }

  return { save, isSaving, error }
}
