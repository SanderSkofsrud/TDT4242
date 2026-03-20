import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../models/assignment.js', () => ({
  findAssignmentsForStudent: vi.fn(),
  findAssignmentsForCourse: vi.fn(),
  createAssignment: vi.fn(),
}))

vi.mock('../../models/enrolment.js', () => ({
  isUserInstructorInCourse: vi.fn(),
}))

vi.mock('../../models/accessLog.js', () => ({
  logAccess: vi.fn(),
}))

import { CAPABILITIES } from '../../config/capabilities.ts'
import {
  createAssignmentForCourse,
  getInstructorAssignmentsForCourse,
  getStudentAssignments,
} from '../../controllers/assignmentsController.ts'
import { createNext, createResponse } from '../helpers/http.ts'
import {
  createAssignment as createAssignmentModel,
  findAssignmentsForCourse,
  findAssignmentsForStudent,
} from '../../models/assignment.js'
import { isUserInstructorInCourse } from '../../models/enrolment.js'
import { logAccess } from '../../models/accessLog.js'

describe('assignmentsController', () => {
  const originalNodeEnv = process.env.NODE_ENV

  beforeEach(() => {
    process.env.NODE_ENV = 'test'
  })

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv
  })

  describe('getStudentAssignments', () => {
    it('returns 500 when there is no authenticated user id', async () => {
      const res = createResponse()

      await getStudentAssignments({} as never, res as never, createNext())

      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' })
    })

    it('maps student assignment rows and logs access on success', async () => {
      vi.mocked(findAssignmentsForStudent).mockResolvedValueOnce([
        {
          assignment_id: 'assignment-1',
          course_id: 'course-1',
          course_code: 'TDT4242',
          course_name: 'Software Testing',
          title: 'Exercise 3',
          due_date: new Date('2026-05-01T00:00:00.000Z'),
          declaration_id: 'declaration-1',
          declaration_submitted_at: new Date('2026-04-20T00:00:00.000Z'),
        },
        {
          assignment_id: 'assignment-2',
          course_id: 'course-2',
          course_code: 'TMA4100',
          course_name: 'Calculus',
          title: 'Exercise 4',
          due_date: new Date('2026-06-01T00:00:00.000Z'),
          declaration_id: null,
          declaration_submitted_at: null,
        },
      ] as never)
      vi.mocked(logAccess).mockResolvedValue({} as never)

      const res = createResponse()

      await getStudentAssignments(
        { user: { id: 'student-1' } } as never,
        res as never,
        createNext(),
      )

      expect(findAssignmentsForStudent).toHaveBeenCalledWith('student-1')
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        assignments: [
          {
            id: 'assignment-1',
            title: 'Exercise 3',
            dueDate: new Date('2026-05-01T00:00:00.000Z'),
            course: {
              id: 'course-1',
              code: 'TDT4242',
              name: 'Software Testing',
            },
            declaration: {
              id: 'declaration-1',
              submittedAt: new Date('2026-04-20T00:00:00.000Z'),
            },
          },
          {
            id: 'assignment-2',
            title: 'Exercise 4',
            dueDate: new Date('2026-06-01T00:00:00.000Z'),
            course: {
              id: 'course-2',
              code: 'TMA4100',
              name: 'Calculus',
            },
            declaration: null,
          },
        ],
      })
      expect(logAccess).toHaveBeenCalledWith(
        'student-1',
        CAPABILITIES['assignment:read:own'],
        null,
      )
    })

    it('returns 500 and logs in development when loading assignments fails', async () => {
      process.env.NODE_ENV = 'development'
      vi.mocked(findAssignmentsForStudent).mockRejectedValueOnce(
        new Error('db failed'),
      )
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      const res = createResponse()

      await getStudentAssignments(
        { user: { id: 'student-1' } } as never,
        res as never,
        createNext(),
      )

      expect(consoleError).toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(500)
      consoleError.mockRestore()
    })
  })

  describe('getInstructorAssignmentsForCourse', () => {
    it('returns 500 when there is no authenticated user id', async () => {
      const res = createResponse()

      await getInstructorAssignmentsForCourse(
        { params: { courseId: 'course-1' } } as never,
        res as never,
        createNext(),
      )

      expect(res.status).toHaveBeenCalledWith(500)
    })

    it('returns 403 when the user is not an instructor for the course', async () => {
      vi.mocked(isUserInstructorInCourse).mockResolvedValueOnce(false)
      const res = createResponse()

      await getInstructorAssignmentsForCourse(
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

    it('maps instructor assignment rows and logs access on success', async () => {
      vi.mocked(isUserInstructorInCourse).mockResolvedValueOnce(true)
      vi.mocked(findAssignmentsForCourse).mockResolvedValueOnce([
        {
          assignment_id: 'assignment-1',
          course_id: 'course-1',
          title: 'Exercise 3',
          due_date: new Date('2026-05-01T00:00:00.000Z'),
          guidance_id: 'guidance-1',
          guidance_locked_at: new Date('2026-05-02T00:00:00.000Z'),
        },
        {
          assignment_id: 'assignment-2',
          course_id: 'course-1',
          title: 'Exercise 4',
          due_date: new Date('2026-06-01T00:00:00.000Z'),
          guidance_id: null,
          guidance_locked_at: null,
        },
      ] as never)
      vi.mocked(logAccess).mockResolvedValue({} as never)
      const res = createResponse()

      await getInstructorAssignmentsForCourse(
        {
          params: { courseId: 'course-1' },
          user: { id: 'instructor-1' },
        } as never,
        res as never,
        createNext(),
      )

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        courseId: 'course-1',
        assignments: [
          {
            id: 'assignment-1',
            courseId: 'course-1',
            title: 'Exercise 3',
            dueDate: new Date('2026-05-01T00:00:00.000Z'),
            guidance: {
              id: 'guidance-1',
              lockedAt: new Date('2026-05-02T00:00:00.000Z'),
            },
          },
          {
            id: 'assignment-2',
            courseId: 'course-1',
            title: 'Exercise 4',
            dueDate: new Date('2026-06-01T00:00:00.000Z'),
            guidance: null,
          },
        ],
      })
      expect(logAccess).toHaveBeenCalledWith(
        'instructor-1',
        CAPABILITIES['assignment:read:course'],
        'course-1',
      )
    })

    it('returns 500 when loading instructor assignments fails', async () => {
      vi.mocked(isUserInstructorInCourse).mockResolvedValueOnce(true)
      vi.mocked(findAssignmentsForCourse).mockRejectedValueOnce(
        new Error('db failed'),
      )
      const res = createResponse()

      await getInstructorAssignmentsForCourse(
        {
          params: { courseId: 'course-1' },
          user: { id: 'instructor-1' },
        } as never,
        res as never,
        createNext(),
      )

      expect(res.status).toHaveBeenCalledWith(500)
    })
  })

  describe('createAssignmentForCourse', () => {
    it('returns 500 when there is no authenticated user id', async () => {
      const res = createResponse()

      await createAssignmentForCourse(
        {
          params: { courseId: 'course-1' },
          body: { title: 'Exercise 3', dueDate: '2026-05-01' },
        } as never,
        res as never,
        createNext(),
      )

      expect(res.status).toHaveBeenCalledWith(500)
    })

    it('returns 403 when the user is not an instructor for the course', async () => {
      vi.mocked(isUserInstructorInCourse).mockResolvedValueOnce(false)
      const res = createResponse()

      await createAssignmentForCourse(
        {
          params: { courseId: 'course-1' },
          body: { title: 'Exercise 3', dueDate: '2026-05-01' },
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

    it('returns 400 when title or dueDate is missing', async () => {
      vi.mocked(isUserInstructorInCourse).mockResolvedValueOnce(true)
      const res = createResponse()

      await createAssignmentForCourse(
        {
          params: { courseId: 'course-1' },
          body: { title: '', dueDate: '' },
          user: { id: 'instructor-1' },
        } as never,
        res as never,
        createNext(),
      )

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        error: 'title and dueDate are required',
      })
    })

    it('creates the assignment, trims the title, converts the date, and logs access', async () => {
      vi.mocked(isUserInstructorInCourse).mockResolvedValueOnce(true)
      vi.mocked(createAssignmentModel).mockResolvedValueOnce({
        id: 'assignment-1',
        course_id: 'course-1',
        title: 'Exercise 3',
        due_date: new Date('2026-05-01T00:00:00.000Z'),
        created_at: new Date('2026-03-01T00:00:00.000Z'),
      } as never)
      vi.mocked(logAccess).mockResolvedValue({} as never)
      const res = createResponse()

      await createAssignmentForCourse(
        {
          params: { courseId: 'course-1' },
          body: { title: '  Exercise 3  ', dueDate: '2026-05-01T00:00:00.000Z' },
          user: { id: 'instructor-1' },
        } as never,
        res as never,
        createNext(),
      )

      expect(createAssignmentModel).toHaveBeenCalledWith(
        'course-1',
        'Exercise 3',
        new Date('2026-05-01T00:00:00.000Z'),
      )
      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith({
        id: 'assignment-1',
        courseId: 'course-1',
        title: 'Exercise 3',
        dueDate: new Date('2026-05-01T00:00:00.000Z'),
        createdAt: new Date('2026-03-01T00:00:00.000Z'),
      })
      expect(logAccess).toHaveBeenCalledWith(
        'instructor-1',
        CAPABILITIES['assignment:write:course'],
        'assignment-1',
      )
    })

    it('returns 500 when assignment creation fails', async () => {
      vi.mocked(isUserInstructorInCourse).mockResolvedValueOnce(true)
      vi.mocked(createAssignmentModel).mockRejectedValueOnce(new Error('db failed'))
      const res = createResponse()

      await createAssignmentForCourse(
        {
          params: { courseId: 'course-1' },
          body: { title: 'Exercise 3', dueDate: '2026-05-01' },
          user: { id: 'instructor-1' },
        } as never,
        res as never,
        createNext(),
      )

      expect(res.status).toHaveBeenCalledWith(500)
    })
  })
})
