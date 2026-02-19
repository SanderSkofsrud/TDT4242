import { useEffect, useState } from 'react'

import type { SharingPreference } from '../types/models'
import {
  getSharingStatus,
  revokeSharing,
  reinstateSharing,
} from '../services/sharingService'

export function useSharingStatus() {
  const [preferences, setPreferences] = useState<SharingPreference[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await getSharingStatus()
        if (!cancelled) {
          setPreferences(data)
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

  return { preferences, isLoading, error }
}

export function useRevokeSharing() {
  const [isRevoking, setIsRevoking] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const revoke = async (courseId: string) => {
    setIsRevoking(true)
    setError(null)
    try {
      await revokeSharing(courseId)
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setIsRevoking(false)
    }
  }

  return { revoke, isRevoking, error }
}

export function useReinstateSharing() {
  const [isReinstating, setIsReinstating] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const reinstate = async (courseId: string) => {
    setIsReinstating(true)
    setError(null)
    try {
      await reinstateSharing(courseId)
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setIsReinstating(false)
    }
  }

  return { reinstate, isReinstating, error }
}
