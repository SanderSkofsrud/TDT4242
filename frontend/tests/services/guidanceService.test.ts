import { describe, expect, it, vi } from 'vitest'

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}))

import api from '../../services/api'
import {
  createGuidance,
  getGuidance,
  updateGuidance,
} from '../../services/guidanceService'

const mockedGet = vi.mocked(api.get)
const mockedPost = vi.mocked(api.post)
const mockedPut = vi.mocked(api.put)

const guidanceApi = {
  id: 'guidance-1',
  assignment_id: 'assignment/1',
  permitted_text: 'Ask for explanations.',
  prohibited_text: 'Do not request a full final answer.',
  permitted_categories: ['explanation', 'structure'] as const,
  prohibited_categories: ['code_assistance'] as const,
  examples: {
    permitted: ['Explain the tradeoffs of this design.'],
    prohibited: ['Write the final solution for me.'],
  },
  created_by: 'user-1',
  locked_at: null,
  created_at: '2026-03-01T10:00:00.000Z',
}

const guidance = {
  id: 'guidance-1',
  assignmentId: 'assignment/1',
  permittedText: 'Ask for explanations.',
  prohibitedText: 'Do not request a full final answer.',
  permittedCategories: ['explanation', 'structure'] as const,
  prohibitedCategories: ['code_assistance'] as const,
  examples: {
    permitted: ['Explain the tradeoffs of this design.'],
    prohibited: ['Write the final solution for me.'],
  },
  createdBy: 'user-1',
  lockedAt: null,
  createdAt: '2026-03-01T10:00:00.000Z',
}

describe('guidanceService', () => {
  it('loads guidance for an encoded assignment id and maps the response', async () => {
    mockedGet.mockResolvedValueOnce({ data: guidanceApi } as never)

    await expect(getGuidance('assignment/1')).resolves.toEqual(guidance)
    expect(mockedGet).toHaveBeenCalledWith(
      '/api/assignments/assignment%2F1/guidance',
    )
  })

  it('creates guidance and maps the response', async () => {
    const input = {
      permittedText: 'Ask for explanations.',
      prohibitedText: 'Do not request a full final answer.',
      permittedCategories: ['explanation', 'structure'] as const,
      prohibitedCategories: ['code_assistance'] as const,
      examples: guidance.examples,
    }

    mockedPost.mockResolvedValueOnce({ data: guidanceApi } as never)

    await expect(createGuidance('assignment/1', input)).resolves.toEqual(guidance)
    expect(mockedPost).toHaveBeenCalledWith(
      '/api/assignments/assignment%2F1/guidance',
      input,
    )
  })

  it('updates guidance and maps nullable collections correctly', async () => {
    mockedPut.mockResolvedValueOnce({
      data: {
        ...guidanceApi,
        permitted_categories: null,
        prohibited_categories: null,
        examples: null,
        locked_at: '2026-03-02T10:00:00.000Z',
      },
    } as never)

    await expect(
      updateGuidance('assignment/1', {
        permittedText: 'Updated permitted guidance.',
        prohibitedText: 'Updated prohibited guidance.',
      }),
    ).resolves.toEqual({
      ...guidance,
      permittedCategories: null,
      prohibitedCategories: null,
      examples: null,
      lockedAt: '2026-03-02T10:00:00.000Z',
    })

    expect(mockedPut).toHaveBeenCalledWith(
      '/api/assignments/assignment%2F1/guidance',
      {
        permittedText: 'Updated permitted guidance.',
        prohibitedText: 'Updated prohibited guidance.',
      },
    )
  })
})
