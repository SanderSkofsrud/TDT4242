import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../models/assignment.js', () => ({
  findAssignmentById: vi.fn(),
}))

vi.mock('../../models/assignmentGuidance.js', () => ({
  createGuidance: vi.fn(),
  findGuidanceByAssignment: vi.fn(),
  updateGuidance: vi.fn(),
}))

vi.mock('../../models/enrolment.js', () => ({
  isUserInstructorInCourse: vi.fn(),
}))

vi.mock('../../models/accessLog.js', () => ({
  logAccess: vi.fn(),
}))

import { CAPABILITIES } from '../../config/capabilities.ts'
import {
  createGuidance,
  getGuidance,
  updateGuidance,
} from '../../controllers/assignmentGuidanceController.ts'
import { createNext, createResponse } from '../helpers/http.ts'
import { findAssignmentById } from '../../models/assignment.js'
import {
  createGuidance as createGuidanceModel,
  findGuidanceByAssignment,
  updateGuidance as updateGuidanceModel,
} from '../../models/assignmentGuidance.js'
import { isUserInstructorInCourse } from '../../models/enrolment.js'
import { logAccess } from '../../models/accessLog.js'

const guidance = {
  id: 'guidance-1',
  assignment_id: 'assignment-1',
  permitted_text: 'Ask for explanations.',
  prohibited_text: 'Do not ask for full answers.',
  permitted_categories: ['explanation'],
  prohibited_categories: ['code_assistance'],
  examples: null,
  created_by: 'instructor-1',
  locked_at: null,
  created_at: new Date('2026-03-01T00:00:00.000Z'),
}

describe('assignmentGuidanceController', () => {
  const originalNodeEnv = process.env.NODE_ENV

  beforeEach(() => {
    process.env.NODE_ENV = 'test'
  })

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv
  })

  describe('getGuidance', () => {
    it('returns 404 when guidance does not exist', async () => {
      vi.mocked(findGuidanceByAssignment).mockResolvedValueOnce(null)
      const res = createResponse()

      await getGuidance(
        { params: { assignmentId: 'assignment-1' } } as never,
        res as never,
        createNext(),
      )

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({ error: 'Guidance not found' })
    })

    it('returns guidance and logs access when a user is present', async () => {
      vi.mocked(findGuidanceByAssignment).mockResolvedValueOnce(guidance as never)
      vi.mocked(logAccess).mockResolvedValue({} as never)
      const res = createResponse()

      await getGuidance(
        {
          params: { assignmentId: 'assignment-1' },
          user: { id: 'student-1' },
        } as never,
        res as never,
        createNext(),
      )

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(guidance)
      expect(logAccess).toHaveBeenCalledWith(
        'student-1',
        CAPABILITIES['guidance:read'],
        'guidance-1',
      )
    })

    it('returns guidance without logging when no user is present', async () => {
      vi.mocked(findGuidanceByAssignment).mockResolvedValueOnce(guidance as never)
      const res = createResponse()

      await getGuidance(
        { params: { assignmentId: 'assignment-1' } } as never,
        res as never,
        createNext(),
      )

      expect(res.status).toHaveBeenCalledWith(200)
      expect(logAccess).not.toHaveBeenCalled()
    })

    it('returns 500 when guidance lookup fails', async () => {
      vi.mocked(findGuidanceByAssignment).mockRejectedValueOnce(new Error('db failed'))
      const res = createResponse()

      await getGuidance(
        { params: { assignmentId: 'assignment-1' } } as never,
        res as never,
        createNext(),
      )

      expect(res.status).toHaveBeenCalledWith(500)
    })
  })

  describe('createGuidance', () => {
    const body = {
      permittedText: 'Ask for explanations.',
      prohibitedText: 'Do not ask for full answers.',
    }

    it('returns 404 when the assignment does not exist', async () => {
      vi.mocked(findAssignmentById).mockResolvedValueOnce(null)
      const res = createResponse()

      await createGuidance(
        {
          params: { assignmentId: 'assignment-1' },
          body,
          user: { id: 'instructor-1' },
        } as never,
        res as never,
        createNext(),
      )

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({ error: 'Assignment not found' })
    })

    it('returns 409 when guidance already exists', async () => {
      vi.mocked(findAssignmentById).mockResolvedValueOnce({
        id: 'assignment-1',
        course_id: 'course-1',
      } as never)
      vi.mocked(findGuidanceByAssignment).mockResolvedValueOnce(guidance as never)
      const res = createResponse()

      await createGuidance(
        {
          params: { assignmentId: 'assignment-1' },
          body,
          user: { id: 'instructor-1' },
        } as never,
        res as never,
        createNext(),
      )

      expect(res.status).toHaveBeenCalledWith(409)
      expect(res.json).toHaveBeenCalledWith({
        error: 'Guidance already exists for this assignment',
      })
    })

    it('returns 500 when the authenticated user is missing', async () => {
      vi.mocked(findAssignmentById).mockResolvedValueOnce({
        id: 'assignment-1',
        course_id: 'course-1',
      } as never)
      vi.mocked(findGuidanceByAssignment).mockResolvedValueOnce(null)
      const res = createResponse()

      await createGuidance(
        {
          params: { assignmentId: 'assignment-1' },
          body,
        } as never,
        res as never,
        createNext(),
      )

      expect(res.status).toHaveBeenCalledWith(500)
    })

    it('returns 403 when the user is not an instructor for the assignment course', async () => {
      vi.mocked(findAssignmentById).mockResolvedValueOnce({
        id: 'assignment-1',
        course_id: 'course-1',
      } as never)
      vi.mocked(findGuidanceByAssignment).mockResolvedValueOnce(null)
      vi.mocked(isUserInstructorInCourse).mockResolvedValueOnce(false)
      const res = createResponse()

      await createGuidance(
        {
          params: { assignmentId: 'assignment-1' },
          body,
          user: { id: 'instructor-1' },
        } as never,
        res as never,
        createNext(),
      )

      expect(res.status).toHaveBeenCalledWith(403)
      expect(res.json).toHaveBeenCalledWith({
        error: 'You are not an instructor for this assignment',
      })
    })

    it('creates guidance with nullable optional fields and logs access on success', async () => {
      vi.mocked(findAssignmentById).mockResolvedValueOnce({
        id: 'assignment-1',
        course_id: 'course-1',
      } as never)
      vi.mocked(findGuidanceByAssignment).mockResolvedValueOnce(null)
      vi.mocked(isUserInstructorInCourse).mockResolvedValueOnce(true)
      vi.mocked(createGuidanceModel).mockResolvedValueOnce(guidance as never)
      vi.mocked(logAccess).mockResolvedValue({} as never)
      const res = createResponse()

      await createGuidance(
        {
          params: { assignmentId: 'assignment-1' },
          body,
          user: { id: 'instructor-1' },
        } as never,
        res as never,
        createNext(),
      )

      expect(createGuidanceModel).toHaveBeenCalledWith({
        assignment_id: 'assignment-1',
        permitted_text: 'Ask for explanations.',
        prohibited_text: 'Do not ask for full answers.',
        permitted_categories: null,
        prohibited_categories: null,
        examples: null,
        created_by: 'instructor-1',
      })
      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith(guidance)
      expect(logAccess).toHaveBeenCalledWith(
        'instructor-1',
        CAPABILITIES['guidance:write'],
        'guidance-1',
      )
    })

    it('returns 500 when guidance creation fails', async () => {
      vi.mocked(findAssignmentById).mockResolvedValueOnce({
        id: 'assignment-1',
        course_id: 'course-1',
      } as never)
      vi.mocked(findGuidanceByAssignment).mockResolvedValueOnce(null)
      vi.mocked(isUserInstructorInCourse).mockResolvedValueOnce(true)
      vi.mocked(createGuidanceModel).mockRejectedValueOnce(new Error('db failed'))
      const res = createResponse()

      await createGuidance(
        {
          params: { assignmentId: 'assignment-1' },
          body,
          user: { id: 'instructor-1' },
        } as never,
        res as never,
        createNext(),
      )

      expect(res.status).toHaveBeenCalledWith(500)
    })
  })

  describe('updateGuidance', () => {
    const body = {
      permittedText: 'Updated permitted text.',
      prohibitedText: 'Updated prohibited text.',
    }

    it('returns 404 when the assignment does not exist', async () => {
      vi.mocked(findAssignmentById).mockResolvedValueOnce(null)
      const res = createResponse()

      await updateGuidance(
        {
          params: { assignmentId: 'assignment-1' },
          body,
          user: { id: 'instructor-1' },
        } as never,
        res as never,
        createNext(),
      )

      expect(res.status).toHaveBeenCalledWith(404)
    })

    it('returns 500 when the authenticated user is missing', async () => {
      vi.mocked(findAssignmentById).mockResolvedValueOnce({
        id: 'assignment-1',
        course_id: 'course-1',
      } as never)
      const res = createResponse()

      await updateGuidance(
        {
          params: { assignmentId: 'assignment-1' },
          body,
        } as never,
        res as never,
        createNext(),
      )

      expect(res.status).toHaveBeenCalledWith(500)
    })

    it('returns 403 when the user is not an instructor for the assignment course', async () => {
      vi.mocked(findAssignmentById).mockResolvedValueOnce({
        id: 'assignment-1',
        course_id: 'course-1',
      } as never)
      vi.mocked(isUserInstructorInCourse).mockResolvedValueOnce(false)
      const res = createResponse()

      await updateGuidance(
        {
          params: { assignmentId: 'assignment-1' },
          body,
          user: { id: 'instructor-1' },
        } as never,
        res as never,
        createNext(),
      )

      expect(res.status).toHaveBeenCalledWith(403)
      expect(res.json).toHaveBeenCalledWith({
        error: 'You are not an instructor for this assignment',
      })
    })

    it('returns 409 when the guidance is locked', async () => {
      vi.mocked(findAssignmentById).mockResolvedValueOnce({
        id: 'assignment-1',
        course_id: 'course-1',
      } as never)
      vi.mocked(isUserInstructorInCourse).mockResolvedValueOnce(true)
      vi.mocked(updateGuidanceModel).mockResolvedValueOnce(null)
      const res = createResponse()

      await updateGuidance(
        {
          params: { assignmentId: 'assignment-1' },
          body,
          user: { id: 'instructor-1' },
        } as never,
        res as never,
        createNext(),
      )

      expect(res.status).toHaveBeenCalledWith(409)
      expect(res.json).toHaveBeenCalledWith({
        error:
          'Guidance is locked after the assignment due date and cannot be edited',
      })
    })

    it('updates guidance with nullable optional fields and logs access on success', async () => {
      vi.mocked(findAssignmentById).mockResolvedValueOnce({
        id: 'assignment-1',
        course_id: 'course-1',
      } as never)
      vi.mocked(isUserInstructorInCourse).mockResolvedValueOnce(true)
      vi.mocked(updateGuidanceModel).mockResolvedValueOnce(guidance as never)
      vi.mocked(logAccess).mockResolvedValue({} as never)
      const res = createResponse()

      await updateGuidance(
        {
          params: { assignmentId: 'assignment-1' },
          body,
          user: { id: 'instructor-1' },
        } as never,
        res as never,
        createNext(),
      )

      expect(updateGuidanceModel).toHaveBeenCalledWith('assignment-1', {
        permitted_text: 'Updated permitted text.',
        prohibited_text: 'Updated prohibited text.',
        permitted_categories: null,
        prohibited_categories: null,
        examples: null,
      })
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(guidance)
      expect(logAccess).toHaveBeenCalledWith(
        'instructor-1',
        CAPABILITIES['guidance:write'],
        'guidance-1',
      )
    })

    it('returns 500 when updating guidance fails', async () => {
      vi.mocked(findAssignmentById).mockResolvedValueOnce({
        id: 'assignment-1',
        course_id: 'course-1',
      } as never)
      vi.mocked(isUserInstructorInCourse).mockResolvedValueOnce(true)
      vi.mocked(updateGuidanceModel).mockRejectedValueOnce(new Error('db failed'))
      const res = createResponse()

      await updateGuidance(
        {
          params: { assignmentId: 'assignment-1' },
          body,
          user: { id: 'instructor-1' },
        } as never,
        res as never,
        createNext(),
      )

      expect(res.status).toHaveBeenCalledWith(500)
    })
  })
})
