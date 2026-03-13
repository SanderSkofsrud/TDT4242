import { describe, expect, it, vi } from 'vitest'

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

import api from '../../services/api'
import {
  getCurrentPolicy,
  getFeedback,
} from '../../services/feedbackService'

const mockedGet = vi.mocked(api.get)

describe('feedbackService', () => {
  it('loads feedback for an encoded declaration id', async () => {
    const feedback = {
      declarationId: 'declaration/1',
      categories: ['explanation'],
      frequency: 'light',
      guidance: null,
      mismatches: [],
      feedbackTemplates: [],
      policyVersion: 2,
      policyFilePath: '/policy/v2.pdf',
    }

    mockedGet.mockResolvedValueOnce({ data: feedback } as never)

    await expect(getFeedback('declaration/1')).resolves.toEqual(feedback)
    expect(mockedGet).toHaveBeenCalledWith(
      '/api/declarations/declaration%2F1/feedback',
    )
  })

  it('loads the current policy document', async () => {
    const policy = {
      version: 2,
      filePath: '/policy/v2.pdf',
    }

    mockedGet.mockResolvedValueOnce({ data: policy } as never)

    await expect(getCurrentPolicy()).resolves.toEqual(policy)
    expect(mockedGet).toHaveBeenCalledWith('/api/policy/current')
  })
})
