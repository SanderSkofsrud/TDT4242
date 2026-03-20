import { describe, expect, it, vi } from 'vitest'

vi.mock('../../config/database.js', () => ({
  pool: {
    connect: vi.fn(),
    query: vi.fn(),
  },
}))

vi.mock('../../config/retention.js', () => ({
  calculateExpiresAt: vi.fn(),
}))

import {
  createDeclaration,
  findDeclarationById,
  findDeclarationByStudentAndAssignment,
  findDeclarationsByStudent,
  findSharedDeclarationsForCourse,
  hardDeleteExpiredDeclarations,
} from '../../models/declaration.ts'
import { pool } from '../../config/database.js'
import { calculateExpiresAt } from '../../config/retention.js'

describe('declaration model', () => {
  it('creates a declaration inside a transaction and releases the client', async () => {
    const client = {
      query: vi
        .fn()
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({
          rows: [{ due_date: new Date('2026-06-01T00:00:00.000Z') }],
        })
        .mockResolvedValueOnce({
          rows: [{ id: 'declaration-1', assignment_id: 'assignment-1' }],
        })
        .mockResolvedValueOnce({}), // COMMIT
      release: vi.fn(),
    }

    vi.mocked(pool.connect).mockResolvedValueOnce(client as never)
    vi.mocked(calculateExpiresAt).mockReturnValueOnce(
      new Date('2026-12-01T00:00:00.000Z'),
    )

    const result = await createDeclaration({
      student_id: 'student-1',
      assignment_id: 'assignment-1',
      tools_used: ['ChatGPT'],
      categories: ['explanation'],
      frequency: 'light',
      context_text: null,
      policy_version: 2,
    })

    expect(client.query).toHaveBeenNthCalledWith(1, 'BEGIN')
    expect(client.query).toHaveBeenNthCalledWith(
      2,
      'SELECT due_date FROM assignments WHERE id = $1',
      ['assignment-1'],
    )
    expect(calculateExpiresAt).toHaveBeenCalledWith(
      new Date('2026-06-01T00:00:00.000Z'),
    )
    expect(client.query).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('INSERT INTO declarations'),
      [
        'student-1',
        'assignment-1',
        ['ChatGPT'],
        ['explanation'],
        'light',
        null,
        2,
        new Date('2026-12-01T00:00:00.000Z'),
      ],
    )
    expect(client.query).toHaveBeenNthCalledWith(4, 'COMMIT')
    expect(client.release).toHaveBeenCalledTimes(1)
    expect(result).toEqual({ id: 'declaration-1', assignment_id: 'assignment-1' })
  })

  it('rolls back and rethrows when the assignment cannot be found', async () => {
    const client = {
      query: vi
        .fn()
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({}),
      release: vi.fn(),
    }

    vi.mocked(pool.connect).mockResolvedValueOnce(client as never)

    await expect(
      createDeclaration({
        student_id: 'student-1',
        assignment_id: 'assignment-1',
        tools_used: ['ChatGPT'],
        categories: ['explanation'],
        frequency: 'light',
        context_text: null,
        policy_version: 2,
      }),
    ).rejects.toThrow('Assignment not found for declaration')

    expect(client.query).toHaveBeenCalledWith('ROLLBACK')
    expect(client.release).toHaveBeenCalledTimes(1)
  })

  it('finds a declaration by id and returns null when missing', async () => {
    vi.mocked(pool.query)
      .mockResolvedValueOnce({ rows: [{ id: 'declaration-1' }] } as never)
      .mockResolvedValueOnce({ rows: [] } as never)

    await expect(findDeclarationById('declaration-1')).resolves.toEqual({
      id: 'declaration-1',
    })
    await expect(findDeclarationById('missing')).resolves.toBeNull()
  })

  it('finds all declarations for a student', async () => {
    vi.mocked(pool.query).mockResolvedValueOnce({
      rows: [{ id: 'declaration-1' }, { id: 'declaration-2' }],
    } as never)

    await expect(findDeclarationsByStudent('student-1')).resolves.toEqual([
      { id: 'declaration-1' },
      { id: 'declaration-2' },
    ])
    expect(pool.query).toHaveBeenCalledWith(
      'SELECT * FROM declarations WHERE student_id = $1',
      ['student-1'],
    )
  })

  it('finds a declaration by student and assignment and returns null when absent', async () => {
    vi.mocked(pool.query)
      .mockResolvedValueOnce({ rows: [{ id: 'declaration-1' }] } as never)
      .mockResolvedValueOnce({ rows: [] } as never)

    await expect(
      findDeclarationByStudentAndAssignment('student-1', 'assignment-1'),
    ).resolves.toEqual({ id: 'declaration-1' })
    await expect(
      findDeclarationByStudentAndAssignment('student-1', 'missing'),
    ).resolves.toBeNull()
  })

  it('returns early when there are no assignment ids for shared declarations', async () => {
    await expect(findSharedDeclarationsForCourse('course-1', [])).resolves.toEqual([])
    expect(pool.query).not.toHaveBeenCalled()
  })

  it('finds shared declarations for a course and deletes expired declarations', async () => {
    vi.mocked(pool.query)
      .mockResolvedValueOnce({ rows: [{ id: 'declaration-1' }] } as never)
      .mockResolvedValueOnce({ rowCount: 2 } as never)
      .mockResolvedValueOnce({ rowCount: null } as never)

    await expect(
      findSharedDeclarationsForCourse('course-1', ['assignment-1']),
    ).resolves.toEqual([{ id: 'declaration-1' }])
    await expect(hardDeleteExpiredDeclarations()).resolves.toBe(2)
    await expect(hardDeleteExpiredDeclarations()).resolves.toBe(0)
  })
})
