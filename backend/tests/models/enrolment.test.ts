import { describe, expect, it, vi } from 'vitest'

vi.mock('../../config/database.js', () => ({
  pool: {
    query: vi.fn(),
  },
}))

import {
  getCoursesForInstructor,
  isStudentEnrolledInCourse,
  isUserInstructorInCourse,
} from '../../models/enrolment.ts'
import { pool } from '../../config/database.js'

describe('enrolment model', () => {
  it('gets courses for an instructor', async () => {
    vi.mocked(pool.query).mockResolvedValueOnce({
      rows: [{ id: 'course-1', code: 'TDT4242', name: 'Software Testing' }],
    } as never)

    await expect(getCoursesForInstructor('instructor-1')).resolves.toEqual([
      { id: 'course-1', code: 'TDT4242', name: 'Software Testing' },
    ])
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("WHERE e.user_id = $1 AND e.role = 'instructor'"),
      ['instructor-1'],
    )
  })

  it('checks whether a user is an instructor in a course', async () => {
    vi.mocked(pool.query)
      .mockResolvedValueOnce({ rowCount: 1 } as never)
      .mockResolvedValueOnce({ rowCount: 0 } as never)

    await expect(
      isUserInstructorInCourse('instructor-1', 'course-1'),
    ).resolves.toBe(true)
    await expect(
      isUserInstructorInCourse('instructor-1', 'course-2'),
    ).resolves.toBe(false)
  })

  it('checks whether a student is enrolled in a course', async () => {
    vi.mocked(pool.query)
      .mockResolvedValueOnce({ rowCount: 1 } as never)
      .mockResolvedValueOnce({ rowCount: 0 } as never)

    await expect(
      isStudentEnrolledInCourse('student-1', 'course-1'),
    ).resolves.toBe(true)
    await expect(
      isStudentEnrolledInCourse('student-1', 'course-2'),
    ).resolves.toBe(false)
  })
})
