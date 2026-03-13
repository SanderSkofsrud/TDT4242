import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { createDeferred, flushPromises } from '../helpers/async'

vi.mock('../../services/dashboardService', () => ({
  getStudentDashboard: vi.fn(),
  getInstructorCourses: vi.fn(),
  getInstructorDashboard: vi.fn(),
  getFacultyDashboard: vi.fn(),
}))

import {
  useFacultyDashboard,
  useInstructorCourses,
  useInstructorDashboard,
  useStudentDashboard,
} from '../../hooks/useDashboard'
import {
  getFacultyDashboard,
  getInstructorCourses,
  getInstructorDashboard,
  getStudentDashboard,
} from '../../services/dashboardService'

afterEach(() => {
  cleanup()
})

const studentDashboard = {
  declarations: [
    {
      id: 'declaration-1',
      studentId: 'student-1',
      assignmentId: 'assignment-1',
      toolsUsed: ['ChatGPT'],
      categories: ['explanation'] as const,
      frequency: 'light' as const,
      contextText: 'Used for a short explanation.',
      policyVersion: 2,
      submittedAt: '2026-03-01T10:00:00.000Z',
      expiresAt: '2026-09-01T10:00:00.000Z',
    },
  ],
  summary: {
    totalDeclarations: 1,
    byCategory: { explanation: 1 },
    byFrequency: { light: 1 },
    perAssignment: [],
    perMonth: [],
  },
}

const instructorCourses = {
  courses: [
    {
      id: 'course-1',
      code: 'TDT4242',
      name: 'Software Testing',
    },
  ],
}

const instructorDashboard = {
  suppressed: false,
  aggregationLevel: 'category_frequency' as const,
  data: [
    {
      assignmentId: 'assignment-1',
      courseId: 'course-1',
      category: 'explanation',
      frequency: 'light',
      declarationCount: 3,
    },
  ],
}

const facultyDashboard = {
  suppressed: false,
  aggregationLevel: 'category' as const,
  data: [
    {
      courseId: 'course-1',
      facultyId: 'faculty-1',
      courseCode: 'TDT4242',
      courseName: 'Software Testing',
      category: 'explanation',
      frequency: 'light',
      declarationCount: 3,
    },
  ],
}

describe('useStudentDashboard', () => {
  it('loads the student dashboard on mount', async () => {
    vi.mocked(getStudentDashboard).mockResolvedValueOnce(studentDashboard)

    const { result } = renderHook(() => useStudentDashboard())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.data).toEqual(studentDashboard)
    expect(result.current.error).toBeNull()
  })

  it('stores an error when student dashboard loading fails', async () => {
    const error = new Error('student dashboard failed')
    vi.mocked(getStudentDashboard).mockRejectedValueOnce(error)

    const { result } = renderHook(() => useStudentDashboard())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.data).toBeNull()
    expect(result.current.error).toBe(error)
  })

  it('ignores late student dashboard responses after unmount', async () => {
    const pending = createDeferred(studentDashboard)
    vi.mocked(getStudentDashboard).mockReturnValueOnce(pending.promise)

    const { unmount } = renderHook(() => useStudentDashboard())

    unmount()

    await act(async () => {
      pending.resolve(studentDashboard)
      await pending.promise
      await flushPromises()
    })

    expect(getStudentDashboard).toHaveBeenCalledTimes(1)
  })
})

describe('useInstructorCourses', () => {
  it('loads instructor courses on mount', async () => {
    vi.mocked(getInstructorCourses).mockResolvedValueOnce(instructorCourses)

    const { result } = renderHook(() => useInstructorCourses())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.data).toEqual(instructorCourses)
    expect(result.current.error).toBeNull()
  })

  it('stores an error when instructor courses loading fails', async () => {
    const error = new Error('instructor courses failed')
    vi.mocked(getInstructorCourses).mockRejectedValueOnce(error)

    const { result } = renderHook(() => useInstructorCourses())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.data).toBeNull()
    expect(result.current.error).toBe(error)
  })

  it('ignores late instructor course responses after unmount', async () => {
    const pending = createDeferred(instructorCourses)
    vi.mocked(getInstructorCourses).mockReturnValueOnce(pending.promise)

    const { unmount } = renderHook(() => useInstructorCourses())

    unmount()

    await act(async () => {
      pending.resolve(instructorCourses)
      await pending.promise
      await flushPromises()
    })

    expect(getInstructorCourses).toHaveBeenCalledTimes(1)
  })
})

describe('useInstructorDashboard', () => {
  it('loads instructor dashboard data when a course id is provided', async () => {
    vi.mocked(getInstructorDashboard).mockResolvedValueOnce(instructorDashboard)

    const { result } = renderHook(() => useInstructorDashboard('course-1'))

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.data).toEqual(instructorDashboard)
    expect(result.current.error).toBeNull()
    expect(getInstructorDashboard).toHaveBeenCalledWith('course-1')
  })

  it('stores an error when instructor dashboard loading fails', async () => {
    const error = new Error('instructor dashboard failed')
    vi.mocked(getInstructorDashboard).mockRejectedValueOnce(error)

    const { result } = renderHook(() => useInstructorDashboard('course-1'))

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.data).toBeNull()
    expect(result.current.error).toBe(error)
  })

  it('does not request instructor dashboard data without a course id', async () => {
    const { result } = renderHook(() => useInstructorDashboard(''))

    await act(async () => {
      await flushPromises()
    })

    expect(getInstructorDashboard).not.toHaveBeenCalled()
    expect(result.current.data).toBeNull()
    expect(result.current.error).toBeNull()
    expect(result.current.isLoading).toBe(true)
  })

  it('ignores late instructor dashboard responses after unmount', async () => {
    const pending = createDeferred(instructorDashboard)
    vi.mocked(getInstructorDashboard).mockReturnValueOnce(pending.promise)

    const { unmount } = renderHook(() => useInstructorDashboard('course-1'))

    unmount()

    await act(async () => {
      pending.resolve(instructorDashboard)
      await pending.promise
      await flushPromises()
    })

    expect(getInstructorDashboard).toHaveBeenCalledWith('course-1')
  })
})

describe('useFacultyDashboard', () => {
  it('loads faculty dashboard data when a faculty id is provided', async () => {
    vi.mocked(getFacultyDashboard).mockResolvedValueOnce(facultyDashboard)

    const { result } = renderHook(() => useFacultyDashboard('faculty-1'))

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.data).toEqual(facultyDashboard)
    expect(result.current.error).toBeNull()
    expect(getFacultyDashboard).toHaveBeenCalledWith('faculty-1')
  })

  it('stores an error when faculty dashboard loading fails', async () => {
    const error = new Error('faculty dashboard failed')
    vi.mocked(getFacultyDashboard).mockRejectedValueOnce(error)

    const { result } = renderHook(() => useFacultyDashboard('faculty-1'))

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.data).toBeNull()
    expect(result.current.error).toBe(error)
  })

  it('does not request faculty dashboard data without a faculty id', async () => {
    const { result } = renderHook(() => useFacultyDashboard(''))

    await act(async () => {
      await flushPromises()
    })

    expect(getFacultyDashboard).not.toHaveBeenCalled()
    expect(result.current.data).toBeNull()
    expect(result.current.error).toBeNull()
    expect(result.current.isLoading).toBe(true)
  })

  it('ignores late faculty dashboard responses after unmount', async () => {
    const pending = createDeferred(facultyDashboard)
    vi.mocked(getFacultyDashboard).mockReturnValueOnce(pending.promise)

    const { unmount } = renderHook(() => useFacultyDashboard('faculty-1'))

    unmount()

    await act(async () => {
      pending.resolve(facultyDashboard)
      await pending.promise
      await flushPromises()
    })

    expect(getFacultyDashboard).toHaveBeenCalledWith('faculty-1')
  })
})
