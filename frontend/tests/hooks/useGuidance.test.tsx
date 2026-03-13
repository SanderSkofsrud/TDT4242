import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { createDeferred, flushPromises } from '../helpers/async'

vi.mock('../../services/guidanceService', () => ({
  getGuidance: vi.fn(),
  createGuidance: vi.fn(),
  updateGuidance: vi.fn(),
}))

import {
  useGuidance,
  useGuidanceForm,
} from '../../hooks/useGuidance'
import {
  createGuidance,
  getGuidance,
  updateGuidance,
} from '../../services/guidanceService'

afterEach(() => {
  cleanup()
})

const guidance = {
  id: 'guidance-1',
  assignmentId: 'assignment-1',
  permittedText: 'Ask for explanations.',
  prohibitedText: 'Do not ask for the full final answer.',
  permittedCategories: ['explanation', 'structure'] as const,
  prohibitedCategories: ['code_assistance'] as const,
  examples: {
    permitted: ['Explain the tradeoffs of this approach.'],
    prohibited: ['Write the entire solution for me.'],
  },
  createdBy: 'user-1',
  lockedAt: null,
  createdAt: '2026-03-01T10:00:00.000Z',
}

const guidanceInput = {
  permittedText: 'Ask for explanations.',
  prohibitedText: 'Do not ask for the full final answer.',
  permittedCategories: ['explanation', 'structure'] as const,
  prohibitedCategories: ['code_assistance'] as const,
  examples: guidance.examples,
}

describe('useGuidance', () => {
  it('loads guidance when an assignment id is provided', async () => {
    vi.mocked(getGuidance).mockResolvedValueOnce(guidance)

    const { result } = renderHook(() => useGuidance('assignment-1'))

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.guidance).toEqual(guidance)
    expect(result.current.error).toBeNull()
  })

  it('treats a 404 guidance lookup as no guidance instead of an error', async () => {
    const error = { response: { status: 404 } }
    vi.mocked(getGuidance).mockRejectedValueOnce(error)

    const { result } = renderHook(() => useGuidance('assignment-1'))

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.guidance).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('stores non-404 lookup failures as errors', async () => {
    const error = new Error('guidance failed')
    vi.mocked(getGuidance).mockRejectedValueOnce(error)

    const { result } = renderHook(() => useGuidance('assignment-1'))

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.guidance).toBeNull()
    expect(result.current.error).toBe(error)
  })

  it('does not fetch guidance without an assignment id', async () => {
    const { result } = renderHook(() => useGuidance(''))

    await act(async () => {
      await flushPromises()
    })

    expect(getGuidance).not.toHaveBeenCalled()
    expect(result.current.guidance).toBeNull()
    expect(result.current.error).toBeNull()
    expect(result.current.isLoading).toBe(true)
  })

  it('ignores late guidance responses after unmount', async () => {
    const pending = createDeferred(guidance)
    vi.mocked(getGuidance).mockReturnValueOnce(pending.promise)

    const { unmount } = renderHook(() => useGuidance('assignment-1'))

    unmount()

    await act(async () => {
      pending.resolve(guidance)
      await pending.promise
      await flushPromises()
    })

    expect(getGuidance).toHaveBeenCalledTimes(1)
  })
})

describe('useGuidanceForm', () => {
  it('creates guidance when none exists', async () => {
    vi.mocked(getGuidance).mockRejectedValueOnce({ response: { status: 404 } })
    vi.mocked(createGuidance).mockResolvedValueOnce(guidance)

    const { result } = renderHook(() => useGuidanceForm('assignment-1'))

    await act(async () => {
      await flushPromises()
    })

    await act(async () => {
      await result.current.save(guidanceInput)
    })

    expect(createGuidance).toHaveBeenCalledWith('assignment-1', guidanceInput)
    expect(updateGuidance).not.toHaveBeenCalled()
    expect(result.current.isSaving).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('updates guidance when an existing record has been loaded', async () => {
    vi.mocked(getGuidance).mockResolvedValueOnce(guidance)
    vi.mocked(updateGuidance).mockResolvedValueOnce(guidance)

    const { result } = renderHook(() => useGuidanceForm('assignment-1'))

    await waitFor(() => expect(getGuidance).toHaveBeenCalledWith('assignment-1'))
    await act(async () => {
      await flushPromises()
    })

    await act(async () => {
      await result.current.save(guidanceInput)
    })

    expect(updateGuidance).toHaveBeenCalledWith('assignment-1', guidanceInput)
    expect(createGuidance).not.toHaveBeenCalled()
    expect(result.current.isSaving).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('stores and rethrows save errors', async () => {
    const error = new Error('save failed')
    vi.mocked(getGuidance).mockRejectedValueOnce({ response: { status: 404 } })
    vi.mocked(createGuidance).mockRejectedValueOnce(error)

    const { result } = renderHook(() => useGuidanceForm('assignment-1'))

    await act(async () => {
      await flushPromises()
    })

    await act(async () => {
      await expect(result.current.save(guidanceInput)).rejects.toBe(error)
    })

    expect(result.current.isSaving).toBe(false)
    expect(result.current.error).toBe(error)
  })

  it('clears a previous save error before a successful retry', async () => {
    const error = new Error('save failed')
    vi.mocked(getGuidance).mockRejectedValue({ response: { status: 404 } })
    vi.mocked(createGuidance)
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce(guidance)

    const { result } = renderHook(() => useGuidanceForm('assignment-1'))

    await act(async () => {
      await flushPromises()
    })

    await act(async () => {
      try {
        await result.current.save(guidanceInput)
      } catch {
        // Expected first failure.
      }
    })

    expect(result.current.error).toBe(error)

    await act(async () => {
      await result.current.save(guidanceInput)
    })

    expect(createGuidance).toHaveBeenCalledTimes(2)
    expect(result.current.error).toBeNull()
    expect(result.current.isSaving).toBe(false)
  })
})
