import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { createDeferred, flushPromises } from '../helpers/async'

vi.mock('../../services/assignmentService', () => ({
  getStudentAssignments: vi.fn(),
  getInstructorAssignments: vi.fn(),
}))

import {
  useInstructorAssignments,
  useStudentAssignments,
} from '../../hooks/useAssignments'
import {
  getInstructorAssignments,
  getStudentAssignments,
} from '../../services/assignmentService'

afterEach(() => {
  cleanup()
})

const studentAssignments = {
  assignments: [
    {
      id: 'assignment-1',
      title: 'Exercise 3',
      dueDate: '2026-05-01',
      course: {
        id: 'course-1',
        code: 'TDT4242',
        name: 'Software Testing',
      },
      declaration: null,
    },
  ],
}

const instructorAssignments = {
  courseId: 'course-1',
  assignments: [
    {
      id: 'assignment-1',
      courseId: 'course-1',
      title: 'Exercise 3',
      dueDate: '2026-05-01',
      guidance: {
        id: 'guidance-1',
        lockedAt: null,
      },
    },
  ],
}

describe('useStudentAssignments', () => {
  it('loads student assignments on mount', async () => {
    vi.mocked(getStudentAssignments).mockResolvedValueOnce(studentAssignments)

    const { result } = renderHook(() => useStudentAssignments())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.data).toEqual(studentAssignments)
    expect(result.current.error).toBeNull()
  })

  it('stores an error when loading student assignments fails', async () => {
    const error = new Error('load failed')
    vi.mocked(getStudentAssignments).mockRejectedValueOnce(error)

    const { result } = renderHook(() => useStudentAssignments())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.data).toBeNull()
    expect(result.current.error).toBe(error)
  })

  it('ignores late student assignment responses after unmount', async () => {
    const pending = createDeferred(studentAssignments)
    vi.mocked(getStudentAssignments).mockReturnValueOnce(pending.promise)

    const { unmount } = renderHook(() => useStudentAssignments())

    unmount()

    await act(async () => {
      pending.resolve(studentAssignments)
      await pending.promise
      await flushPromises()
    })

    expect(getStudentAssignments).toHaveBeenCalledTimes(1)
  })
})

describe('useInstructorAssignments', () => {
  it('loads instructor assignments when a course id is provided', async () => {
    vi.mocked(getInstructorAssignments).mockResolvedValueOnce(instructorAssignments)

    const { result } = renderHook(() => useInstructorAssignments('course-1'))

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.data).toEqual(instructorAssignments)
    expect(result.current.error).toBeNull()
    expect(getInstructorAssignments).toHaveBeenCalledWith('course-1')
  })

  it('stores an error when loading instructor assignments fails', async () => {
    const error = new Error('load failed')
    vi.mocked(getInstructorAssignments).mockRejectedValueOnce(error)

    const { result } = renderHook(() => useInstructorAssignments('course-1'))

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.data).toBeNull()
    expect(result.current.error).toBe(error)
  })

  it('does not fetch instructor assignments without a course id', async () => {
    const { result } = renderHook(() => useInstructorAssignments(''))

    await act(async () => {
      await flushPromises()
    })

    expect(getInstructorAssignments).not.toHaveBeenCalled()
    expect(result.current.data).toBeNull()
    expect(result.current.error).toBeNull()
    expect(result.current.isLoading).toBe(true)
  })

  it('refetches instructor assignments and clears the previous error', async () => {
    const error = new Error('initial failure')

    vi.mocked(getInstructorAssignments)
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce(instructorAssignments)

    const { result } = renderHook(() => useInstructorAssignments('course-1'))

    await waitFor(() => expect(result.current.error).toBe(error))

    await act(async () => {
      await result.current.refetch()
    })

    expect(result.current.data).toEqual(instructorAssignments)
    expect(result.current.error).toBeNull()
    expect(result.current.isLoading).toBe(false)
    expect(getInstructorAssignments).toHaveBeenCalledTimes(2)
  })

  it('keeps the previous data when a manual refetch fails', async () => {
    const error = new Error('refetch failed')

    vi.mocked(getInstructorAssignments)
      .mockResolvedValueOnce(instructorAssignments)
      .mockRejectedValueOnce(error)

    const { result } = renderHook(() => useInstructorAssignments('course-1'))

    await waitFor(() => expect(result.current.data).toEqual(instructorAssignments))

    await act(async () => {
      await result.current.refetch()
    })

    expect(result.current.data).toEqual(instructorAssignments)
    expect(result.current.error).toBe(error)
    expect(result.current.isLoading).toBe(false)
  })
})
