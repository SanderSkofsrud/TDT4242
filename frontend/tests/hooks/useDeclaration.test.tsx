import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { createDeferred, flushPromises } from '../helpers/async'

vi.mock('../../services/declarationService', () => ({
  getDeclaration: vi.fn(),
  getMyDeclarations: vi.fn(),
  submitDeclaration: vi.fn(),
}))

vi.mock('../../services/feedbackService', () => ({
  getFeedback: vi.fn(),
}))

import {
  useDeclaration,
  useFeedback,
  useMyDeclarations,
  useSubmitDeclaration,
} from '../../hooks/useDeclaration'
import {
  getDeclaration,
  getMyDeclarations,
  submitDeclaration,
} from '../../services/declarationService'
import { getFeedback } from '../../services/feedbackService'

afterEach(() => {
  cleanup()
})

const declaration = {
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
}

const feedback = {
  declarationId: 'declaration-1',
  categories: ['explanation'],
  frequency: 'light',
  guidance: {
    permittedText: 'Ask for explanations.',
    prohibitedText: 'Do not submit generated code.',
    permittedCategories: ['explanation'],
    prohibitedCategories: ['code_assistance'],
    examples: null,
  },
  mismatches: [],
  feedbackTemplates: [],
  policyVersion: 2,
  policyFilePath: '/policy/v2.pdf',
}

const submitInput = {
  assignmentId: 'assignment-1',
  toolsUsed: ['ChatGPT'],
  categories: ['explanation'] as const,
  frequency: 'light' as const,
  contextText: 'Used for a short explanation.',
}

describe('useMyDeclarations', () => {
  it('loads declarations on mount', async () => {
    vi.mocked(getMyDeclarations).mockResolvedValueOnce([declaration])

    const { result } = renderHook(() => useMyDeclarations())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.declarations).toEqual([declaration])
    expect(result.current.error).toBeNull()
  })

  it('stores an error when loading declarations fails', async () => {
    const error = new Error('failed to load declarations')
    vi.mocked(getMyDeclarations).mockRejectedValueOnce(error)

    const { result } = renderHook(() => useMyDeclarations())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.declarations).toEqual([])
    expect(result.current.error).toBe(error)
  })

  it('ignores late declaration responses after unmount', async () => {
    const pending = createDeferred([declaration])
    vi.mocked(getMyDeclarations).mockReturnValueOnce(pending.promise)

    const { unmount } = renderHook(() => useMyDeclarations())

    unmount()

    await act(async () => {
      pending.resolve([declaration])
      await pending.promise
      await flushPromises()
    })

    expect(getMyDeclarations).toHaveBeenCalledTimes(1)
  })
})

describe('useDeclaration', () => {
  it('loads a declaration when an id is provided', async () => {
    vi.mocked(getDeclaration).mockResolvedValueOnce(declaration)

    const { result } = renderHook(() => useDeclaration('declaration-1'))

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.declaration).toEqual(declaration)
    expect(result.current.error).toBeNull()
    expect(getDeclaration).toHaveBeenCalledWith('declaration-1')
  })

  it('stores an error when loading a declaration fails', async () => {
    const error = new Error('failed to load declaration')
    vi.mocked(getDeclaration).mockRejectedValueOnce(error)

    const { result } = renderHook(() => useDeclaration('declaration-1'))

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.declaration).toBeNull()
    expect(result.current.error).toBe(error)
  })

  it('does not request a declaration when the id is missing', async () => {
    const { result } = renderHook(() => useDeclaration(''))

    await act(async () => {
      await flushPromises()
    })

    expect(getDeclaration).not.toHaveBeenCalled()
    expect(result.current.declaration).toBeNull()
    expect(result.current.error).toBeNull()
    expect(result.current.isLoading).toBe(true)
  })

  it('ignores late declaration responses after unmount', async () => {
    const pending = createDeferred(declaration)
    vi.mocked(getDeclaration).mockReturnValueOnce(pending.promise)

    const { unmount } = renderHook(() => useDeclaration('declaration-1'))

    unmount()

    await act(async () => {
      pending.resolve(declaration)
      await pending.promise
      await flushPromises()
    })

    expect(getDeclaration).toHaveBeenCalledWith('declaration-1')
  })
})

describe('useFeedback', () => {
  it('loads feedback when an id is provided', async () => {
    vi.mocked(getFeedback).mockResolvedValueOnce(feedback)

    const { result } = renderHook(() => useFeedback('declaration-1'))

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.feedback).toEqual(feedback)
    expect(result.current.error).toBeNull()
    expect(getFeedback).toHaveBeenCalledWith('declaration-1')
  })

  it('stores an error when loading feedback fails', async () => {
    const error = new Error('failed to load feedback')
    vi.mocked(getFeedback).mockRejectedValueOnce(error)

    const { result } = renderHook(() => useFeedback('declaration-1'))

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.feedback).toBeNull()
    expect(result.current.error).toBe(error)
  })

  it('does not request feedback when the id is missing', async () => {
    const { result } = renderHook(() => useFeedback(''))

    await act(async () => {
      await flushPromises()
    })

    expect(getFeedback).not.toHaveBeenCalled()
    expect(result.current.feedback).toBeNull()
    expect(result.current.error).toBeNull()
    expect(result.current.isLoading).toBe(true)
  })

  it('ignores late feedback responses after unmount', async () => {
    const pending = createDeferred(feedback)
    vi.mocked(getFeedback).mockReturnValueOnce(pending.promise)

    const { unmount } = renderHook(() => useFeedback('declaration-1'))

    unmount()

    await act(async () => {
      pending.resolve(feedback)
      await pending.promise
      await flushPromises()
    })

    expect(getFeedback).toHaveBeenCalledWith('declaration-1')
  })
})

describe('useSubmitDeclaration', () => {
  it('submits a declaration and returns the created declaration', async () => {
    vi.mocked(submitDeclaration).mockResolvedValueOnce(declaration)

    const { result } = renderHook(() => useSubmitDeclaration())

    let submitted

    await act(async () => {
      submitted = await result.current.submit(submitInput)
    })

    expect(submitDeclaration).toHaveBeenCalledWith(submitInput)
    expect(submitted).toEqual(declaration)
    expect(result.current.isSubmitting).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('stores and rethrows submission errors', async () => {
    const error = new Error('submit failed')
    vi.mocked(submitDeclaration).mockRejectedValueOnce(error)

    const { result } = renderHook(() => useSubmitDeclaration())

    await act(async () => {
      try {
        await result.current.submit(submitInput)
      } catch (err) {
        expect(err).toBe(error)
      }
    })

    expect(result.current.isSubmitting).toBe(false)
    expect(result.current.error).toBe(error)
  })

  it('clears a previous submission error before a successful retry', async () => {
    const error = new Error('submit failed')
    vi.mocked(submitDeclaration)
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce(declaration)

    const { result } = renderHook(() => useSubmitDeclaration())

    await act(async () => {
      try {
        await result.current.submit(submitInput)
      } catch {
        // The failure is expected here; the assertion happens below.
      }
    })

    expect(result.current.error).toBe(error)

    let submitted

    await act(async () => {
      submitted = await result.current.submit(submitInput)
    })

    expect(submitted).toEqual(declaration)
    expect(result.current.error).toBeNull()
    expect(result.current.isSubmitting).toBe(false)
  })
})
