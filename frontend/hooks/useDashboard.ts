import { useEffect, useState } from 'react'

import type {
  StudentDashboardResponse,
  InstructorCoursesResponse,
  InstructorDashboardResponse,
  FacultyDashboardResponse,
} from '../types/models'
import {
  getStudentDashboard,
  getInstructorCourses,
  getInstructorDashboard,
  getFacultyDashboard,
} from '../services/dashboardService'

export function useStudentDashboard() {
  const [data, setData] = useState<StudentDashboardResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const resp = await getStudentDashboard()
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

export function useInstructorCourses() {
  const [data, setData] = useState<InstructorCoursesResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const resp = await getInstructorCourses()
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

export function useInstructorDashboard(courseId: string) {
  const [data, setData] = useState<InstructorDashboardResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!courseId) return
    let cancelled = false
    ;(async () => {
      try {
        const resp = await getInstructorDashboard(courseId)
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

export function useFacultyDashboard(facultyId: string) {
  const [data, setData] = useState<FacultyDashboardResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!facultyId) return
    let cancelled = false
    ;(async () => {
      try {
        const resp = await getFacultyDashboard(facultyId)
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
  }, [facultyId])

  return { data, isLoading, error }
}
