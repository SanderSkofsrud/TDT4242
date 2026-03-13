import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { createDeferred, flushPromises } from '../helpers/async'

vi.mock('../../services/sharingService', () => ({
  getSharingStatus: vi.fn(),
  revokeSharing: vi.fn(),
  reinstateSharing: vi.fn(),
}))

import {
  useReinstateSharing,
  useRevokeSharing,
  useSharingStatus,
} from '../../hooks/useSharing'
import {
  getSharingStatus,
  reinstateSharing,
  revokeSharing,
} from '../../services/sharingService'

afterEach(() => {
  cleanup()
})

const preferences = [
  {
    studentId: 'student-1',
    courseId: 'course-1',
    courseCode: 'TDT4242',
    courseName: 'Software Testing',
    isShared: true,
    updatedAt: '2026-03-10T10:00:00.000Z',
  },
]

describe('useSharingStatus', () => {
  it('loads sharing preferences on mount', async () => {
    vi.mocked(getSharingStatus).mockResolvedValueOnce(preferences)

    const { result } = renderHook(() => useSharingStatus())

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.preferences).toEqual(preferences)
    expect(result.current.error).toBeNull()
    expect(getSharingStatus).toHaveBeenCalledTimes(1)
  })

  it('stores an error when the initial request fails', async () => {
    const error = new Error('load failed')
    vi.mocked(getSharingStatus).mockRejectedValueOnce(error)

    const { result } = renderHook(() => useSharingStatus())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.preferences).toEqual([])
    expect(result.current.error).toBe(error)
  })

  it('refetches preferences and clears the previous error', async () => {
    const initialError = new Error('initial failure')

    vi.mocked(getSharingStatus)
      .mockRejectedValueOnce(initialError)
      .mockResolvedValueOnce(preferences)

    const { result } = renderHook(() => useSharingStatus())

    await waitFor(() => expect(result.current.error).toBe(initialError))

    act(() => {
      result.current.refetch()
    })

    expect(result.current.isLoading).toBe(true)
    expect(result.current.error).toBeNull()

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.preferences).toEqual(preferences)
    expect(getSharingStatus).toHaveBeenCalledTimes(2)
  })

  it('ignores late responses after the hook unmounts', async () => {
    const pending = createDeferred<typeof preferences>()
    vi.mocked(getSharingStatus).mockReturnValueOnce(pending.promise)

    const { result, unmount } = renderHook(() => useSharingStatus())

    expect(result.current.isLoading).toBe(true)

    unmount()

    await act(async () => {
      pending.resolve(preferences)
      await pending.promise
      await flushPromises()
    })

    expect(getSharingStatus).toHaveBeenCalledTimes(1)
  })
})

describe('useRevokeSharing', () => {
  it('revokes sharing successfully', async () => {
    vi.mocked(revokeSharing).mockResolvedValueOnce({ success: true })

    const { result } = renderHook(() => useRevokeSharing())

    await act(async () => {
      await result.current.revoke('course-1')
    })

    expect(revokeSharing).toHaveBeenCalledWith('course-1')
    expect(result.current.isRevoking).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('stores and rethrows revoke errors', async () => {
    const error = new Error('revoke failed')
    vi.mocked(revokeSharing).mockRejectedValueOnce(error)

    const { result } = renderHook(() => useRevokeSharing())

    await act(async () => {
      await expect(result.current.revoke('course-1')).rejects.toBe(error)
    })

    expect(result.current.isRevoking).toBe(false)
    expect(result.current.error).toBe(error)
  })
})

describe('useReinstateSharing', () => {
  it('reinstates sharing successfully', async () => {
    vi.mocked(reinstateSharing).mockResolvedValueOnce({ success: true })

    const { result } = renderHook(() => useReinstateSharing())

    await act(async () => {
      await result.current.reinstate('course-1')
    })

    expect(reinstateSharing).toHaveBeenCalledWith('course-1')
    expect(result.current.isReinstating).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('stores and rethrows reinstate errors', async () => {
    const error = new Error('reinstate failed')
    vi.mocked(reinstateSharing).mockRejectedValueOnce(error)

    const { result } = renderHook(() => useReinstateSharing())

    await act(async () => {
      await expect(result.current.reinstate('course-1')).rejects.toBe(error)
    })

    expect(result.current.isReinstating).toBe(false)
    expect(result.current.error).toBe(error)
  })
})
