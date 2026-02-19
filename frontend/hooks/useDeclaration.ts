import { useEffect, useState } from 'react'

import type { Declaration } from '../types/models'
import {
  getDeclaration,
  getMyDeclarations,
  submitDeclaration,
  type DeclarationSubmitInput,
} from '../services/declarationService'

export function useMyDeclarations() {
  const [declarations, setDeclarations] = useState<Declaration[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await getMyDeclarations()
        if (!cancelled) {
          setDeclarations(data)
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
  }, [])

  return { declarations, isLoading, error }
}

export function useDeclaration(declarationId: string) {
  const [declaration, setDeclaration] = useState<Declaration | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!declarationId) return
    let cancelled = false
    ;(async () => {
      try {
        const data = await getDeclaration(declarationId)
        if (!cancelled) {
          setDeclaration(data)
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
  }, [declarationId])

  return { declaration, isLoading, error }
}

export function useSubmitDeclaration() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const submit = async (input: DeclarationSubmitInput) => {
    setIsSubmitting(true)
    setError(null)
    try {
      await submitDeclaration(input)
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setIsSubmitting(false)
    }
  }

  return { submit, isSubmitting, error }
}
