import { describe, expect, it, vi } from 'vitest'

vi.mock('../../config/database.js', () => ({
  pool: {
    query: vi.fn(),
  },
}))

import {
  createGuidance,
  findGuidanceByAssignment,
  lockGuidance,
  updateGuidance,
} from '../../models/assignmentGuidance.ts'
import { pool } from '../../config/database.js'

describe('assignmentGuidance model', () => {
  const guidance = {
    id: 'guidance-1',
    assignment_id: 'assignment-1',
    locked_at: null,
  }

  it('creates guidance', async () => {
    vi.mocked(pool.query).mockResolvedValueOnce({
      rows: [guidance],
    } as never)

    await expect(
      createGuidance({
        assignment_id: 'assignment-1',
        permitted_text: 'Ask for explanations.',
        prohibited_text: 'Do not ask for full answers.',
        permitted_categories: ['explanation'],
        prohibited_categories: ['code_assistance'],
        examples: null,
        created_by: 'instructor-1',
      }),
    ).resolves.toEqual(guidance)

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO assignment_guidance'),
      [
        'assignment-1',
        'Ask for explanations.',
        'Do not ask for full answers.',
        ['explanation'],
        ['code_assistance'],
        null,
        'instructor-1',
      ],
    )
  })

  it('finds guidance by assignment and returns null when missing', async () => {
    vi.mocked(pool.query)
      .mockResolvedValueOnce({ rows: [guidance] } as never)
      .mockResolvedValueOnce({ rows: [] } as never)

    await expect(findGuidanceByAssignment('assignment-1')).resolves.toEqual(
      guidance,
    )
    await expect(findGuidanceByAssignment('missing')).resolves.toBeNull()
  })

  it('returns the current unlocked guidance when no update fields are provided', async () => {
    vi.mocked(pool.query).mockResolvedValueOnce({
      rows: [guidance],
    } as never)

    await expect(updateGuidance('assignment-1', {})).resolves.toEqual(guidance)
    expect(pool.query).toHaveBeenCalledWith(
      'SELECT * FROM assignment_guidance WHERE assignment_id = $1',
      ['assignment-1'],
    )
  })

  it('returns null when no update fields are provided and the guidance is locked', async () => {
    vi.mocked(pool.query).mockResolvedValueOnce({
      rows: [{ ...guidance, locked_at: new Date('2026-05-02T00:00:00.000Z') }],
    } as never)

    await expect(updateGuidance('assignment-1', {})).resolves.toBeNull()
  })

  it('updates provided guidance fields and returns the updated record', async () => {
    vi.mocked(pool.query).mockResolvedValueOnce({
      rows: [guidance],
    } as never)

    await expect(
      updateGuidance('assignment-1', {
        permitted_text: 'Updated permitted text.',
        examples: { permitted: ['One'], prohibited: ['Two'] },
      }),
    ).resolves.toEqual(guidance)

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('SET permitted_text = $1, examples = $2'),
      ['Updated permitted text.', { permitted: ['One'], prohibited: ['Two'] }, 'assignment-1'],
    )
  })

  it('updates prohibited and category fields when they are provided', async () => {
    vi.mocked(pool.query).mockResolvedValueOnce({
      rows: [guidance],
    } as never)

    await expect(
      updateGuidance('assignment-1', {
        prohibited_text: 'Updated prohibited text.',
        permitted_categories: ['structure'],
        prohibited_categories: ['code_assistance'],
      }),
    ).resolves.toEqual(guidance)

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining(
        'SET prohibited_text = $1, permitted_categories = $2, prohibited_categories = $3',
      ),
      [
        'Updated prohibited text.',
        ['structure'],
        ['code_assistance'],
        'assignment-1',
      ],
    )
  })

  it('returns null when an update affects no rows', async () => {
    vi.mocked(pool.query).mockResolvedValueOnce({ rows: [] } as never)

    await expect(
      updateGuidance('assignment-1', {
        permitted_text: 'Updated permitted text.',
      }),
    ).resolves.toBeNull()
  })

  it('locks guidance and returns null when nothing was updated', async () => {
    vi.mocked(pool.query)
      .mockResolvedValueOnce({ rows: [guidance] } as never)
      .mockResolvedValueOnce({ rows: [] } as never)

    await expect(lockGuidance('assignment-1')).resolves.toEqual(guidance)
    await expect(lockGuidance('assignment-2')).resolves.toBeNull()
    expect(pool.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('SET locked_at = now()'),
      ['assignment-1'],
    )
  })
})
