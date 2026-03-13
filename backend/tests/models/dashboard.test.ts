import { describe, expect, it, vi } from 'vitest'

vi.mock('../../config/database.js', () => ({
  pool: {
    query: vi.fn(),
  },
}))

import {
  getCourseCohortStats,
  getFacultyAggregateForFaculty,
  getFacultyCohortStats,
  getInstructorAggregateForCourse,
} from '../../models/dashboard.ts'
import { pool } from '../../config/database.js'

describe('dashboard model', () => {
  it('loads the instructor aggregate for a course', async () => {
    vi.mocked(pool.query).mockResolvedValueOnce({
      rows: [{ assignment_id: 'assignment-1', declaration_count: 3 }],
    } as never)

    await expect(getInstructorAggregateForCourse('course-1')).resolves.toEqual([
      { assignment_id: 'assignment-1', declaration_count: 3 },
    ])
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('FROM v_instructor_aggregate'),
      ['course-1'],
    )
  })

  it('loads the faculty aggregate for a faculty', async () => {
    vi.mocked(pool.query).mockResolvedValueOnce({
      rows: [{ course_id: 'course-1', declaration_count: 4 }],
    } as never)

    await expect(getFacultyAggregateForFaculty('faculty-1')).resolves.toEqual([
      { course_id: 'course-1', declaration_count: 4 },
    ])
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('FROM v_faculty_aggregate'),
      ['faculty-1'],
    )
  })

  it('loads course cohort stats', async () => {
    vi.mocked(pool.query).mockResolvedValueOnce({
      rows: [{ enrolled_students: 25, shared_students_with_declarations: 10 }],
    } as never)

    await expect(getCourseCohortStats('course-1')).resolves.toEqual({
      enrolled_students: 25,
      shared_students_with_declarations: 10,
    })
  })

  it('loads faculty cohort stats', async () => {
    vi.mocked(pool.query).mockResolvedValueOnce({
      rows: [{ enrolled_students: 100, shared_students_with_declarations: 40 }],
    } as never)

    await expect(getFacultyCohortStats('faculty-1')).resolves.toEqual({
      enrolled_students: 100,
      shared_students_with_declarations: 40,
    })
  })
})
