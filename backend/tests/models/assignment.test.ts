import { describe, expect, it, vi } from 'vitest'

vi.mock('../../config/database.js', () => ({
  pool: {
    query: vi.fn(),
  },
}))

import {
  createAssignment,
  findAssignmentById,
  findAssignmentsForCourse,
  findAssignmentsForStudent,
} from '../../models/assignment.ts'
import { pool } from '../../config/database.js'

describe('assignment model', () => {
  it('finds an assignment by id and returns null when missing', async () => {
    vi.mocked(pool.query)
      .mockResolvedValueOnce({ rows: [{ id: 'assignment-1' }] } as never)
      .mockResolvedValueOnce({ rows: [] } as never)

    await expect(findAssignmentById('assignment-1')).resolves.toEqual({
      id: 'assignment-1',
    })
    await expect(findAssignmentById('missing')).resolves.toBeNull()
    expect(pool.query).toHaveBeenNthCalledWith(
      1,
      'SELECT * FROM assignments WHERE id = $1',
      ['assignment-1'],
    )
  })

  it('finds assignments for a student', async () => {
    vi.mocked(pool.query).mockResolvedValueOnce({
      rows: [{ assignment_id: 'assignment-1' }],
    } as never)

    await expect(findAssignmentsForStudent('student-1')).resolves.toEqual([
      { assignment_id: 'assignment-1' },
    ])
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('ORDER BY a.due_date ASC, a.title ASC'),
      ['student-1'],
    )
  })

  it('creates an assignment', async () => {
    const dueDate = new Date('2026-05-01T00:00:00.000Z')
    vi.mocked(pool.query).mockResolvedValueOnce({
      rows: [{ id: 'assignment-1', due_date: dueDate }],
    } as never)

    await expect(
      createAssignment('course-1', 'Exercise 3', dueDate),
    ).resolves.toEqual({
      id: 'assignment-1',
      due_date: dueDate,
    })
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO assignments'),
      ['course-1', 'Exercise 3', dueDate],
    )
  })

  it('finds assignments for a course', async () => {
    vi.mocked(pool.query).mockResolvedValueOnce({
      rows: [{ assignment_id: 'assignment-1', guidance_id: null }],
    } as never)

    await expect(findAssignmentsForCourse('course-1')).resolves.toEqual([
      { assignment_id: 'assignment-1', guidance_id: null },
    ])
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('LEFT JOIN assignment_guidance g ON g.assignment_id = a.id'),
      ['course-1'],
    )
  })
})
