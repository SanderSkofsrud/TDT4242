import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../models/declaration.js', () => ({
  findDeclarationsByStudent: vi.fn(),
}))

vi.mock('../../models/dashboard.js', () => ({
  getInstructorAggregateForCourse: vi.fn(),
  getFacultyAggregateForFaculty: vi.fn(),
}))

vi.mock('../../models/enrolment.js', () => ({
  isUserInstructorInCourse: vi.fn(),
  getCoursesForInstructor: vi.fn(),
}))

vi.mock('../../models/accessLog.js', () => ({
  logAccess: vi.fn(),
}))

import { CAPABILITIES } from '../../config/capabilities.ts'
import {
  getFacultyDashboard,
  getInstructorCourses,
  getInstructorDashboard,
  getStudentDashboard,
} from '../../controllers/dashboardController.ts'
import { createNext, createResponse } from '../helpers/http.ts'
import { findDeclarationsByStudent } from '../../models/declaration.js'
import {
  getFacultyAggregateForFaculty,
  getInstructorAggregateForCourse,
} from '../../models/dashboard.js'
import {
  getCoursesForInstructor,
  isUserInstructorInCourse,
} from '../../models/enrolment.js'
import { logAccess } from '../../models/accessLog.js'

describe('dashboardController', () => {
  const originalNodeEnv = process.env.NODE_ENV

  beforeEach(() => {
    process.env.NODE_ENV = 'test'
  })

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv
  })

  describe('getStudentDashboard', () => {
    it('returns 500 when there is no authenticated user id', async () => {
      const res = createResponse()

      await getStudentDashboard({} as never, res as never, createNext())

      expect(res.status).toHaveBeenCalledWith(500)
    })

    it('aggregates declarations by category, frequency, assignment, and month', async () => {
      vi.mocked(findDeclarationsByStudent).mockResolvedValueOnce([
        {
          assignment_id: 'assignment-2',
          categories: ['structure'],
          frequency: 'moderate',
          submitted_at: '2026-02-10T10:00:00.000Z',
        },
        {
          assignment_id: 'assignment-1',
          categories: ['explanation', 'structure'],
          frequency: 'light',
          submitted_at: '2026-01-20T10:00:00.000Z',
        },
      ] as never)
      vi.mocked(logAccess).mockResolvedValue({} as never)
      const res = createResponse()

      await getStudentDashboard(
        { user: { id: 'student-1' } } as never,
        res as never,
        createNext(),
      )

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        declarations: [
          {
            assignment_id: 'assignment-2',
            categories: ['structure'],
            frequency: 'moderate',
            submitted_at: '2026-02-10T10:00:00.000Z',
          },
          {
            assignment_id: 'assignment-1',
            categories: ['explanation', 'structure'],
            frequency: 'light',
            submitted_at: '2026-01-20T10:00:00.000Z',
          },
        ],
        summary: {
          totalDeclarations: 2,
          byCategory: { structure: 2, explanation: 1 },
          byFrequency: { moderate: 1, light: 1 },
          perAssignment: [
            {
              assignmentId: 'assignment-1',
              totalDeclarations: 1,
              byCategory: { explanation: 1, structure: 1 },
              byFrequency: { light: 1 },
            },
            {
              assignmentId: 'assignment-2',
              totalDeclarations: 1,
              byCategory: { structure: 1 },
              byFrequency: { moderate: 1 },
            },
          ],
          perMonth: [
            {
              month: '2026-01',
              totalDeclarations: 1,
              byCategory: { explanation: 1, structure: 1 },
              byFrequency: { light: 1 },
            },
            {
              month: '2026-02',
              totalDeclarations: 1,
              byCategory: { structure: 1 },
              byFrequency: { moderate: 1 },
            },
          ],
        },
      })
      expect(logAccess).toHaveBeenCalledWith(
        'student-1',
        CAPABILITIES['dashboard:read:own'],
        null,
      )
    })

    it('returns 500 when dashboard aggregation throws', async () => {
      vi.mocked(findDeclarationsByStudent).mockRejectedValueOnce(
        new Error('db failed'),
      )
      const res = createResponse()

      await getStudentDashboard(
        { user: { id: 'student-1' } } as never,
        res as never,
        createNext(),
      )

      expect(res.status).toHaveBeenCalledWith(500)
    })
  })

  describe('getInstructorCourses', () => {
    it('returns 500 when there is no authenticated user id', async () => {
      const res = createResponse()

      await getInstructorCourses({} as never, res as never, createNext())

      expect(res.status).toHaveBeenCalledWith(500)
    })

    it('returns the instructor courses', async () => {
      vi.mocked(getCoursesForInstructor).mockResolvedValueOnce([
        { id: 'course-1', code: 'TDT4242', name: 'Software Testing' },
      ] as never)
      const res = createResponse()

      await getInstructorCourses(
        { user: { id: 'instructor-1' } } as never,
        res as never,
        createNext(),
      )

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        courses: [{ id: 'course-1', code: 'TDT4242', name: 'Software Testing' }],
      })
    })
  })

  describe('getInstructorDashboard', () => {
    it('returns 500 when there is no authenticated user id', async () => {
      const res = createResponse()

      await getInstructorDashboard(
        { params: { courseId: 'course-1' } } as never,
        res as never,
        createNext(),
      )

      expect(res.status).toHaveBeenCalledWith(500)
    })

    it('returns 403 when the user is not an instructor for the course', async () => {
      vi.mocked(isUserInstructorInCourse).mockResolvedValueOnce(false)
      const res = createResponse()

      await getInstructorDashboard(
        {
          params: { courseId: 'course-1' },
          user: { id: 'instructor-1' },
        } as never,
        res as never,
        createNext(),
      )

      expect(res.status).toHaveBeenCalledWith(403)
      expect(res.json).toHaveBeenCalledWith({
        error: 'You are not an instructor for this course',
      })
    })

    it('returns mapped aggregate rows and logs access on success', async () => {
      vi.mocked(isUserInstructorInCourse).mockResolvedValueOnce(true)
      vi.mocked(getInstructorAggregateForCourse).mockResolvedValueOnce([
        {
          assignment_id: 'assignment-1',
          course_id: 'course-1',
          category: 'explanation',
          frequency: 'light',
          declaration_count: 4,
        },
      ] as never)
      vi.mocked(logAccess).mockResolvedValue({} as never)
      const res = createResponse()

      await getInstructorDashboard(
        {
          params: { courseId: 'course-1' },
          user: { id: 'instructor-1' },
        } as never,
        res as never,
        createNext(),
      )

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        suppressed: false,
        courseId: 'course-1',
        data: [
          {
            assignmentId: 'assignment-1',
            courseId: 'course-1',
            category: 'explanation',
            frequency: 'light',
            declarationCount: 4,
          },
        ],
      })
      expect(logAccess).toHaveBeenCalledWith(
        'instructor-1',
        CAPABILITIES['dashboard:read:course_aggregate'],
        'course-1',
      )
    })
  })

  describe('getFacultyDashboard', () => {
    it('returns 500 when there is no authenticated user', async () => {
      const res = createResponse()

      await getFacultyDashboard(
        { query: { facultyId: 'faculty-1' } } as never,
        res as never,
        createNext(),
      )

      expect(res.status).toHaveBeenCalledWith(500)
    })

    it('returns 403 when the user is not head of faculty', async () => {
      const res = createResponse()

      await getFacultyDashboard(
        {
          query: { facultyId: 'faculty-1' },
          user: { id: 'user-1', role: 'student' },
        } as never,
        res as never,
        createNext(),
      )

      expect(res.status).toHaveBeenCalledWith(403)
      expect(res.json).toHaveBeenCalledWith({ error: 'Forbidden' })
    })

    it('returns 400 when facultyId is missing', async () => {
      const res = createResponse()

      await getFacultyDashboard(
        {
          query: {},
          user: { id: 'user-1', role: 'head_of_faculty' },
        } as never,
        res as never,
        createNext(),
      )

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        error: 'facultyId query parameter is required',
      })
    })

    it('returns mapped faculty aggregate rows and logs access on success', async () => {
      vi.mocked(getFacultyAggregateForFaculty).mockResolvedValueOnce([
        {
          course_id: 'course-1',
          faculty_id: 'faculty-1',
          course_code: 'TDT4242',
          course_name: 'Software Testing',
          category: 'explanation',
          frequency: 'light',
          declaration_count: 5,
        },
      ] as never)
      vi.mocked(logAccess).mockResolvedValue({} as never)
      const res = createResponse()

      await getFacultyDashboard(
        {
          query: { facultyId: 'faculty-1' },
          user: { id: 'head-1', role: 'head_of_faculty' },
        } as never,
        res as never,
        createNext(),
      )

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        suppressed: false,
        facultyId: 'faculty-1',
        data: [
          {
            courseId: 'course-1',
            facultyId: 'faculty-1',
            courseCode: 'TDT4242',
            courseName: 'Software Testing',
            category: 'explanation',
            frequency: 'light',
            declarationCount: 5,
          },
        ],
      })
      expect(logAccess).toHaveBeenCalledWith(
        'head-1',
        CAPABILITIES['dashboard:read:faculty_aggregate'],
        'faculty-1',
      )
    })
  })
})
