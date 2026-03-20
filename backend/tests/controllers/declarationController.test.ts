import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../models/declaration.js', () => ({
  createDeclaration: vi.fn(),
  findDeclarationById: vi.fn(),
  findDeclarationByStudentAndAssignment: vi.fn(),
  findDeclarationsByStudent: vi.fn(),
}))

vi.mock('../../models/assignment.js', () => ({
  findAssignmentById: vi.fn(),
}))

vi.mock('../../models/enrolment.js', () => ({
  isStudentEnrolledInCourse: vi.fn(),
}))

vi.mock('../../models/accessLog.js', () => ({
  logAccess: vi.fn(),
}))

import { CAPABILITIES } from '../../config/capabilities.ts'
import {
  getDeclaration,
  getMyDeclarations,
  submitDeclaration,
} from '../../controllers/declarationController.ts'
import { createNext, createResponse } from '../helpers/http.ts'
import {
  createDeclaration as createDeclarationModel,
  findDeclarationById,
  findDeclarationByStudentAndAssignment,
  findDeclarationsByStudent,
} from '../../models/declaration.js'
import { findAssignmentById } from '../../models/assignment.js'
import { isStudentEnrolledInCourse } from '../../models/enrolment.js'
import { logAccess } from '../../models/accessLog.js'

const declaration = {
  id: 'declaration-1',
  student_id: 'student-1',
  assignment_id: 'assignment-1',
  tools_used: ['ChatGPT'],
  categories: ['explanation'],
  frequency: 'light',
  context_text: null,
  policy_version: 2,
  submitted_at: new Date('2026-03-01T10:00:00.000Z'),
  expires_at: new Date('2026-09-01T10:00:00.000Z'),
}

describe('declarationController', () => {
  const originalPrivacyVersion = process.env.PRIVACY_NOTICE_VERSION
  const originalNodeEnv = process.env.NODE_ENV

  beforeEach(() => {
    process.env.PRIVACY_NOTICE_VERSION = '2'
    process.env.NODE_ENV = 'test'
  })

  afterEach(() => {
    process.env.PRIVACY_NOTICE_VERSION = originalPrivacyVersion
    process.env.NODE_ENV = originalNodeEnv
  })

  describe('submitDeclaration', () => {
    const body = {
      assignmentId: 'assignment-1',
      toolsUsed: ['ChatGPT'],
      categories: ['explanation'],
      frequency: 'light',
      contextText: undefined,
    }

    it('returns 500 when the authenticated user context is incomplete', async () => {
      const res = createResponse()

      await submitDeclaration(
        { body, user: { id: 'student-1' } } as never,
        res as never,
        createNext(),
      )

      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' })
    })

    it('returns 409 when a declaration already exists', async () => {
      vi.mocked(findDeclarationByStudentAndAssignment).mockResolvedValueOnce(
        declaration as never,
      )

      const res = createResponse()

      await submitDeclaration(
        {
          body,
          user: { id: 'student-1', privacyAckVersion: 2 },
        } as never,
        res as never,
        createNext(),
      )

      expect(findDeclarationByStudentAndAssignment).toHaveBeenCalledWith(
        'student-1',
        'assignment-1',
      )
      expect(res.status).toHaveBeenCalledWith(409)
      expect(res.json).toHaveBeenCalledWith({
        error: 'A declaration has already been submitted for this assignment',
      })
    })

    it('returns 404 when the assignment does not exist', async () => {
      vi.mocked(findDeclarationByStudentAndAssignment).mockResolvedValueOnce(null)
      vi.mocked(findAssignmentById).mockResolvedValueOnce(null)

      const res = createResponse()

      await submitDeclaration(
        {
          body,
          user: { id: 'student-1', privacyAckVersion: 2 },
        } as never,
        res as never,
        createNext(),
      )

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({ error: 'Assignment not found' })
    })

    it('returns 403 when the student is not enrolled in the course', async () => {
      vi.mocked(findDeclarationByStudentAndAssignment).mockResolvedValueOnce(null)
      vi.mocked(findAssignmentById).mockResolvedValueOnce({
        id: 'assignment-1',
        course_id: 'course-1',
        due_date: new Date('2099-01-01T00:00:00.000Z'),
      } as never)
      vi.mocked(isStudentEnrolledInCourse).mockResolvedValueOnce(false)

      const res = createResponse()

      await submitDeclaration(
        {
          body,
          user: { id: 'student-1', privacyAckVersion: 2 },
        } as never,
        res as never,
        createNext(),
      )

      expect(res.status).toHaveBeenCalledWith(403)
      expect(res.json).toHaveBeenCalledWith({
        error: 'You are not enrolled in the course for this assignment',
      })
    })

    it('returns 409 when the assignment due date has passed', async () => {
      vi.mocked(findDeclarationByStudentAndAssignment).mockResolvedValueOnce(null)
      vi.mocked(findAssignmentById).mockResolvedValueOnce({
        id: 'assignment-1',
        course_id: 'course-1',
        due_date: new Date('2000-01-01T00:00:00.000Z'),
      } as never)
      vi.mocked(isStudentEnrolledInCourse).mockResolvedValueOnce(true)

      const res = createResponse()

      await submitDeclaration(
        {
          body,
          user: { id: 'student-1', privacyAckVersion: 2 },
        } as never,
        res as never,
        createNext(),
      )

      expect(res.status).toHaveBeenCalledWith(409)
      expect(res.json).toHaveBeenCalledWith({
        error: 'The submission window for this assignment has closed',
      })
    })

    it('returns 403 when the privacy notice acknowledgement does not match', async () => {
      process.env.PRIVACY_NOTICE_VERSION = '3'
      vi.mocked(findDeclarationByStudentAndAssignment).mockResolvedValueOnce(null)
      vi.mocked(findAssignmentById).mockResolvedValueOnce({
        id: 'assignment-1',
        course_id: 'course-1',
        due_date: new Date('2099-01-01T00:00:00.000Z'),
      } as never)
      vi.mocked(isStudentEnrolledInCourse).mockResolvedValueOnce(true)

      const res = createResponse()

      await submitDeclaration(
        {
          body,
          user: { id: 'student-1', privacyAckVersion: 2 },
        } as never,
        res as never,
        createNext(),
      )

      expect(res.status).toHaveBeenCalledWith(403)
      expect(res.json).toHaveBeenCalledWith({
        error:
          'Privacy notice acknowledgement required before submitting a declaration',
      })
    })

    it('creates the declaration and logs access on success', async () => {
      vi.mocked(findDeclarationByStudentAndAssignment).mockResolvedValueOnce(null)
      vi.mocked(findAssignmentById).mockResolvedValueOnce({
        id: 'assignment-1',
        course_id: 'course-1',
        due_date: new Date('2099-01-01T00:00:00.000Z'),
      } as never)
      vi.mocked(isStudentEnrolledInCourse).mockResolvedValueOnce(true)
      vi.mocked(createDeclarationModel).mockResolvedValueOnce(
        declaration as never,
      )
      vi.mocked(logAccess).mockResolvedValue({} as never)

      const res = createResponse()

      await submitDeclaration(
        {
          body,
          user: { id: 'student-1', privacyAckVersion: 2 },
        } as never,
        res as never,
        createNext(),
      )

      expect(createDeclarationModel).toHaveBeenCalledWith({
        student_id: 'student-1',
        assignment_id: 'assignment-1',
        tools_used: ['ChatGPT'],
        categories: ['explanation'],
        frequency: 'light',
        context_text: null,
        policy_version: 2,
      })
      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith(declaration)
      expect(logAccess).toHaveBeenCalledWith(
        'student-1',
        CAPABILITIES['declaration:write'],
        'declaration-1',
      )
    })

    it('returns 500 and logs in development when an unexpected error occurs', async () => {
      process.env.NODE_ENV = 'development'
      vi.mocked(findDeclarationByStudentAndAssignment).mockRejectedValueOnce(
        new Error('db failed'),
      )
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      const res = createResponse()

      await submitDeclaration(
        {
          body,
          user: { id: 'student-1', privacyAckVersion: 2 },
        } as never,
        res as never,
        createNext(),
      )

      expect(consoleError).toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' })
      consoleError.mockRestore()
    })
  })

  describe('getDeclaration', () => {
    it('returns 500 when there is no authenticated user id', async () => {
      const res = createResponse()

      await getDeclaration(
        { params: { declarationId: 'declaration-1' } } as never,
        res as never,
        createNext(),
      )

      expect(res.status).toHaveBeenCalledWith(500)
    })

    it('returns 404 when the declaration is missing', async () => {
      vi.mocked(findDeclarationById).mockResolvedValueOnce(null)
      const res = createResponse()

      await getDeclaration(
        {
          params: { declarationId: 'declaration-1' },
          user: { id: 'student-1' },
        } as never,
        res as never,
        createNext(),
      )

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({ error: 'Declaration not found' })
    })

    it('returns 403 when the declaration belongs to another user', async () => {
      vi.mocked(findDeclarationById).mockResolvedValueOnce({
        ...declaration,
        student_id: 'student-2',
      } as never)
      const res = createResponse()

      await getDeclaration(
        {
          params: { declarationId: 'declaration-1' },
          user: { id: 'student-1' },
        } as never,
        res as never,
        createNext(),
      )

      expect(res.status).toHaveBeenCalledWith(403)
      expect(res.json).toHaveBeenCalledWith({
        error: 'You may only read your own declarations',
      })
    })

    it('returns the declaration and logs access on success', async () => {
      vi.mocked(findDeclarationById).mockResolvedValueOnce(declaration as never)
      vi.mocked(logAccess).mockResolvedValue({} as never)
      const res = createResponse()

      await getDeclaration(
        {
          params: { declarationId: 'declaration-1' },
          user: { id: 'student-1' },
        } as never,
        res as never,
        createNext(),
      )

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(declaration)
      expect(logAccess).toHaveBeenCalledWith(
        'student-1',
        CAPABILITIES['declaration:read:own'],
        'declaration-1',
      )
    })

    it('returns 500 when loading the declaration throws', async () => {
      vi.mocked(findDeclarationById).mockRejectedValueOnce(new Error('db failed'))
      const res = createResponse()

      await getDeclaration(
        {
          params: { declarationId: 'declaration-1' },
          user: { id: 'student-1' },
        } as never,
        res as never,
        createNext(),
      )

      expect(res.status).toHaveBeenCalledWith(500)
    })
  })

  describe('getMyDeclarations', () => {
    it('returns 500 when there is no authenticated user id', async () => {
      const res = createResponse()

      await getMyDeclarations({} as never, res as never, createNext())

      expect(res.status).toHaveBeenCalledWith(500)
    })

    it('returns declarations and logs access when the list is non-empty', async () => {
      vi.mocked(findDeclarationsByStudent).mockResolvedValueOnce([
        declaration,
      ] as never)
      vi.mocked(logAccess).mockResolvedValue({} as never)
      const res = createResponse()

      await getMyDeclarations(
        { user: { id: 'student-1' } } as never,
        res as never,
        createNext(),
      )

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith([declaration])
      expect(logAccess).toHaveBeenCalledWith(
        'student-1',
        CAPABILITIES['declaration:read:own'],
        null,
      )
    })

    it('returns declarations without logging access when the list is empty', async () => {
      vi.mocked(findDeclarationsByStudent).mockResolvedValueOnce([] as never)
      const res = createResponse()

      await getMyDeclarations(
        { user: { id: 'student-1' } } as never,
        res as never,
        createNext(),
      )

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith([])
      expect(logAccess).not.toHaveBeenCalled()
    })

    it('returns 500 when loading declarations throws', async () => {
      vi.mocked(findDeclarationsByStudent).mockRejectedValueOnce(
        new Error('db failed'),
      )
      const res = createResponse()

      await getMyDeclarations(
        { user: { id: 'student-1' } } as never,
        res as never,
        createNext(),
      )

      expect(res.status).toHaveBeenCalledWith(500)
    })
  })
})
