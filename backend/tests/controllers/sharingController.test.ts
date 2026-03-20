import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../models/sharingPreference.js', () => ({
  getSharingPreferencesForStudent: vi.fn(),
  revokeSharing: vi.fn(),
  reinstateSharing: vi.fn(),
}))

vi.mock('../../models/enrolment.js', () => ({
  isStudentEnrolledInCourse: vi.fn(),
}))

import {
  getSharingStatus,
  reinstateSharing,
  revokeSharing,
} from '../../controllers/sharingController.ts'
import { createNext, createResponse } from '../helpers/http.ts'
import {
  getSharingPreferencesForStudent,
  reinstateSharing as reinstateSharingModel,
  revokeSharing as revokeSharingModel,
} from '../../models/sharingPreference.js'
import { isStudentEnrolledInCourse } from '../../models/enrolment.js'

describe('sharingController', () => {
  const originalNodeEnv = process.env.NODE_ENV

  beforeEach(() => {
    process.env.NODE_ENV = 'test'
  })

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv
    vi.restoreAllMocks()
  })

  describe('getSharingStatus', () => {
    it('returns 500 when there is no authenticated user id', async () => {
      const res = createResponse()

      await getSharingStatus({} as never, res as never, createNext())

      expect(res.status).toHaveBeenCalledWith(500)
    })

    it('returns the sharing preferences on success', async () => {
      vi.mocked(getSharingPreferencesForStudent).mockResolvedValueOnce([
        { course_id: 'course-1', is_shared: true },
      ] as never)
      const res = createResponse()

      await getSharingStatus(
        { user: { id: 'student-1' } } as never,
        res as never,
        createNext(),
      )

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith([
        { course_id: 'course-1', is_shared: true },
      ])
    })

    it('logs and returns 500 when loading sharing preferences fails in development', async () => {
      process.env.NODE_ENV = 'development'
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      vi.mocked(getSharingPreferencesForStudent).mockRejectedValueOnce(
        new Error('db failed'),
      )
      const res = createResponse()

      await getSharingStatus(
        { user: { id: 'student-1' } } as never,
        res as never,
        createNext(),
      )

      expect(consoleError).toHaveBeenCalledWith(
        'getSharingStatus error:',
        expect.any(Error),
      )
      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal server error',
      })
    })
  })

  describe('revokeSharing', () => {
    it('returns 500 when there is no authenticated user id', async () => {
      const res = createResponse()

      await revokeSharing(
        { params: { courseId: 'course-1' } } as never,
        res as never,
        createNext(),
      )

      expect(res.status).toHaveBeenCalledWith(500)
    })

    it('returns 404 when the student is not enrolled in the course', async () => {
      vi.mocked(isStudentEnrolledInCourse).mockResolvedValueOnce(false)
      const res = createResponse()

      await revokeSharing(
        {
          params: { courseId: 'course-1' },
          user: { id: 'student-1' },
        } as never,
        res as never,
        createNext(),
      )

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({
        error: 'Course not found for this student',
      })
    })

    it('revokes sharing on success', async () => {
      vi.mocked(isStudentEnrolledInCourse).mockResolvedValueOnce(true)
      vi.mocked(revokeSharingModel).mockResolvedValueOnce(true)
      const res = createResponse()

      await revokeSharing(
        {
          params: { courseId: 'course-1' },
          user: { id: 'student-1' },
        } as never,
        res as never,
        createNext(),
      )

      expect(revokeSharingModel).toHaveBeenCalledWith('student-1', 'course-1')
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({ success: true })
    })

    it('logs and returns 500 when revoking sharing fails in development', async () => {
      process.env.NODE_ENV = 'development'
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      vi.mocked(isStudentEnrolledInCourse).mockResolvedValueOnce(true)
      vi.mocked(revokeSharingModel).mockRejectedValueOnce(new Error('db failed'))
      const res = createResponse()

      await revokeSharing(
        {
          params: { courseId: 'course-1' },
          user: { id: 'student-1' },
        } as never,
        res as never,
        createNext(),
      )

      expect(consoleError).toHaveBeenCalledWith(
        'revokeSharing error:',
        expect.any(Error),
      )
      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal server error',
      })
    })
  })

  describe('reinstateSharing', () => {
    it('returns 500 when there is no authenticated user id', async () => {
      const res = createResponse()

      await reinstateSharing(
        { params: { courseId: 'course-1' } } as never,
        res as never,
        createNext(),
      )

      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal server error',
      })
    })

    it('returns 404 when the student is not enrolled in the course', async () => {
      vi.mocked(isStudentEnrolledInCourse).mockResolvedValueOnce(false)
      const res = createResponse()

      await reinstateSharing(
        {
          params: { courseId: 'course-1' },
          user: { id: 'student-1' },
        } as never,
        res as never,
        createNext(),
      )

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({
        error: 'Course not found for this student',
      })
    })

    it('reinstates sharing on success', async () => {
      vi.mocked(isStudentEnrolledInCourse).mockResolvedValueOnce(true)
      vi.mocked(reinstateSharingModel).mockResolvedValueOnce(true)
      const res = createResponse()

      await reinstateSharing(
        {
          params: { courseId: 'course-1' },
          user: { id: 'student-1' },
        } as never,
        res as never,
        createNext(),
      )

      expect(reinstateSharingModel).toHaveBeenCalledWith(
        'student-1',
        'course-1',
      )
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({ success: true })
    })

    it('logs and returns 500 when reinstating sharing fails in development', async () => {
      process.env.NODE_ENV = 'development'
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      vi.mocked(isStudentEnrolledInCourse).mockResolvedValueOnce(true)
      vi.mocked(reinstateSharingModel).mockRejectedValueOnce(
        new Error('db failed'),
      )
      const res = createResponse()

      await reinstateSharing(
        {
          params: { courseId: 'course-1' },
          user: { id: 'student-1' },
        } as never,
        res as never,
        createNext(),
      )

      expect(consoleError).toHaveBeenCalledWith(
        'reinstateSharing error:',
        expect.any(Error),
      )
      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal server error',
      })
    })
  })
})
