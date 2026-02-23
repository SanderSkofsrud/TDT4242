import { useEffect, useState } from 'react'

import type { StudentAssignmentsResponse, InstructorAssignmentsResponse } from '../types/models'
import { getStudentAssignments, getInstructorAssignments } from '../services/assignmentService'

export function useStudentAssignments() {
  const [data, setData] = useState<StudentAssignmentsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const resp = await getStudentAssignments()
        if (!cancelled) {
          setData(resp)
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

  return { data, isLoading, error }
}

export function useInstructorAssignments(courseId: string) {
  const [data, setData] = useState<InstructorAssignmentsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!courseId) return
    let cancelled = false
    ;(async () => {
      try {
        const resp = await getInstructorAssignments(courseId)
        if (!cancelled) {
          setData(resp)
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
  }, [courseId])

  return { data, isLoading, error }
}
