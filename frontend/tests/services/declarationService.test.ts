import { describe, expect, it, vi } from 'vitest'

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

import api from '../../services/api'
import {
  getDeclaration,
  getMyDeclarations,
  submitDeclaration,
} from '../../services/declarationService'

const mockedGet = vi.mocked(api.get)
const mockedPost = vi.mocked(api.post)

const declarationApi = {
  id: 'declaration-1',
  student_id: 'student-1',
  assignment_id: 'assignment-1',
  tools_used: ['ChatGPT'],
  categories: ['explanation'] as const,
  frequency: 'light' as const,
  context_text: null,
  policy_version: 2,
  submitted_at: '2026-03-01T10:00:00.000Z',
  expires_at: '2026-09-01T10:00:00.000Z',
}

const declaration = {
  id: 'declaration-1',
  studentId: 'student-1',
  assignmentId: 'assignment-1',
  toolsUsed: ['ChatGPT'],
  categories: ['explanation'] as const,
  frequency: 'light' as const,
  contextText: null,
  policyVersion: 2,
  submittedAt: '2026-03-01T10:00:00.000Z',
  expiresAt: '2026-09-01T10:00:00.000Z',
}

describe('declarationService', () => {
  it('submits a declaration and maps the API response', async () => {
    mockedPost.mockResolvedValueOnce({ data: declarationApi } as never)

    const input = {
      assignmentId: 'assignment-1',
      toolsUsed: ['ChatGPT'],
      categories: ['explanation'] as const,
      frequency: 'light' as const,
      contextText: null,
    }

    await expect(submitDeclaration(input)).resolves.toEqual(declaration)
    expect(mockedPost).toHaveBeenCalledWith('/api/declarations', input)
  })

  it('loads a single declaration and maps the response', async () => {
    mockedGet.mockResolvedValueOnce({ data: declarationApi } as never)

    await expect(getDeclaration('declaration-1')).resolves.toEqual(declaration)
    expect(mockedGet).toHaveBeenCalledWith('/api/declarations/declaration-1')
  })

  it('loads and maps the current user declarations list', async () => {
    mockedGet.mockResolvedValueOnce({
      data: [declarationApi, { ...declarationApi, id: 'declaration-2' }],
    } as never)

    await expect(getMyDeclarations()).resolves.toEqual([
      declaration,
      { ...declaration, id: 'declaration-2' },
    ])
    expect(mockedGet).toHaveBeenCalledWith('/api/declarations')
  })
})
