import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../models/declaration.js', () => ({
  findDeclarationById: vi.fn(),
}))

vi.mock('../../models/assignmentGuidance.js', () => ({
  findGuidanceByAssignment: vi.fn(),
}))

vi.mock('../../models/feedbackTemplate.js', () => ({
  findTemplatesByPolicyVersion: vi.fn(),
}))

vi.mock('../../models/policyDocument.js', () => ({
  getCurrentPolicy: vi.fn(),
}))

vi.mock('../../models/accessLog.js', () => ({
  logAccess: vi.fn(),
}))

import { CAPABILITIES } from '../../config/capabilities.ts'
import {
  getCurrentPolicyDocument,
  getFeedback,
} from '../../controllers/feedbackController.ts'
import { createNext, createResponse } from '../helpers/http.ts'
import { findDeclarationById } from '../../models/declaration.js'
import { findGuidanceByAssignment } from '../../models/assignmentGuidance.js'
import { findTemplatesByPolicyVersion } from '../../models/feedbackTemplate.js'
import { getCurrentPolicy } from '../../models/policyDocument.js'
import { logAccess } from '../../models/accessLog.js'

describe('feedbackController', () => {
  const originalNodeEnv = process.env.NODE_ENV

  beforeEach(() => {
    process.env.NODE_ENV = 'test'
  })

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv
  })

  describe('getFeedback', () => {
    it('returns 500 when there is no authenticated user id', async () => {
      const res = createResponse()

      await getFeedback(
        { params: { declarationId: 'declaration-1' } } as never,
        res as never,
        createNext(),
      )

      expect(res.status).toHaveBeenCalledWith(500)
    })

    it('returns 404 when the declaration does not exist', async () => {
      vi.mocked(findDeclarationById).mockResolvedValueOnce(null)
      const res = createResponse()

      await getFeedback(
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
        id: 'declaration-1',
        student_id: 'student-2',
      } as never)
      const res = createResponse()

      await getFeedback(
        {
          params: { declarationId: 'declaration-1' },
          user: { id: 'student-1' },
        } as never,
        res as never,
        createNext(),
      )

      expect(res.status).toHaveBeenCalledWith(403)
      expect(res.json).toHaveBeenCalledWith({
        error: 'You may only view feedback for your own declarations',
      })
    })

    it('returns 404 when the current policy is unavailable', async () => {
      vi.mocked(findDeclarationById).mockResolvedValueOnce({
        id: 'declaration-1',
        student_id: 'student-1',
        assignment_id: 'assignment-1',
        categories: ['explanation'],
        frequency: 'light',
        policy_version: 2,
      } as never)
      vi.mocked(findGuidanceByAssignment).mockResolvedValueOnce(null)
      vi.mocked(findTemplatesByPolicyVersion).mockResolvedValueOnce([] as never)
      vi.mocked(getCurrentPolicy).mockResolvedValueOnce(null)
      const res = createResponse()

      await getFeedback(
        {
          params: { declarationId: 'declaration-1' },
          user: { id: 'student-1' },
        } as never,
        res as never,
        createNext(),
      )

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({
        error: 'Policy document not available',
      })
    })

    it('returns filtered feedback, mismatches, and logs access on success', async () => {
      vi.mocked(findDeclarationById).mockResolvedValueOnce({
        id: 'declaration-1',
        student_id: 'student-1',
        assignment_id: 'assignment-1',
        categories: ['code_assistance', 'structure'],
        frequency: 'moderate',
        policy_version: 2,
      } as never)
      vi.mocked(findGuidanceByAssignment).mockResolvedValueOnce({
        permitted_text: 'Ask for explanations.',
        prohibited_text: 'Do not ask for final answers.',
        permitted_categories: ['explanation'],
        prohibited_categories: ['code_assistance'],
        examples: null,
      } as never)
      vi.mocked(findTemplatesByPolicyVersion).mockResolvedValueOnce([
        {
          category: null,
          trigger_condition: 'always',
          template_text: 'General advice.',
        },
        {
          category: 'structure',
          trigger_condition: 'uses structure',
          template_text: 'Structure-specific advice.',
        },
        {
          category: 'explanation',
          trigger_condition: 'uses explanation',
          template_text: 'Explanation-specific advice.',
        },
      ] as never)
      vi.mocked(getCurrentPolicy).mockResolvedValueOnce({
        file_path: '/policy/v2.pdf',
      } as never)
      vi.mocked(logAccess).mockResolvedValue({} as never)
      const res = createResponse()

      await getFeedback(
        {
          params: { declarationId: 'declaration-1' },
          user: { id: 'student-1' },
        } as never,
        res as never,
        createNext(),
      )

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        declarationId: 'declaration-1',
        categories: ['code_assistance', 'structure'],
        frequency: 'moderate',
        guidance: {
          permittedText: 'Ask for explanations.',
          prohibitedText: 'Do not ask for final answers.',
          permittedCategories: ['explanation'],
          prohibitedCategories: ['code_assistance'],
          examples: null,
        },
        mismatches: [
          {
            category: 'code_assistance',
            message:
              'Your declaration includes Code assistance, which is marked as prohibited in the assignment guidance.',
          },
          {
            category: 'structure',
            message:
              'Your declaration includes Structure, but this category is not listed as permitted in the assignment guidance.',
          },
        ],
        feedbackTemplates: [
          {
            category: null,
            triggerCondition: 'always',
            templateText: 'General advice.',
          },
          {
            category: 'structure',
            triggerCondition: 'uses structure',
            templateText: 'Structure-specific advice.',
          },
        ],
        policyVersion: 2,
        policyFilePath: '/policy/v2.pdf',
      })
      expect(logAccess).toHaveBeenCalledWith(
        'student-1',
        CAPABILITIES['declaration:read:own'],
        'declaration-1',
      )
    })

    it('returns 500 when feedback loading fails', async () => {
      vi.mocked(findDeclarationById).mockRejectedValueOnce(new Error('db failed'))
      const res = createResponse()

      await getFeedback(
        {
          params: { declarationId: 'declaration-1' },
          user: { id: 'student-1' },
        } as never,
        res as never,
        createNext(),
      )

      expect(res.status).toHaveBeenCalledWith(500)
    })

    it('logs feedback loading failures in development', async () => {
      process.env.NODE_ENV = 'development'
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      vi.mocked(findDeclarationById).mockRejectedValueOnce(new Error('db failed'))
      const res = createResponse()

      await getFeedback(
        {
          params: { declarationId: 'declaration-1' },
          user: { id: 'student-1' },
        } as never,
        res as never,
        createNext(),
      )

      expect(consoleError).toHaveBeenCalledWith(
        'getFeedback error:',
        expect.any(Error),
      )
      expect(res.status).toHaveBeenCalledWith(500)
    })
  })

  describe('getCurrentPolicyDocument', () => {
    it('returns 404 when no current policy exists', async () => {
      vi.mocked(getCurrentPolicy).mockResolvedValueOnce(null)
      const res = createResponse()

      await getCurrentPolicyDocument({} as never, res as never, createNext())

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({
        error: 'No policy document is currently available',
      })
    })

    it('returns the current policy document', async () => {
      vi.mocked(getCurrentPolicy).mockResolvedValueOnce({
        version: 2,
        file_path: '/policy/v2.pdf',
      } as never)
      const res = createResponse()

      await getCurrentPolicyDocument({} as never, res as never, createNext())

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        version: 2,
        filePath: '/policy/v2.pdf',
      })
    })

    it('returns 500 when policy lookup fails', async () => {
      vi.mocked(getCurrentPolicy).mockRejectedValueOnce(new Error('db failed'))
      const res = createResponse()

      await getCurrentPolicyDocument({} as never, res as never, createNext())

      expect(res.status).toHaveBeenCalledWith(500)
    })

    it('logs policy lookup failures in development', async () => {
      process.env.NODE_ENV = 'development'
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      vi.mocked(getCurrentPolicy).mockRejectedValueOnce(new Error('db failed'))
      const res = createResponse()

      await getCurrentPolicyDocument({} as never, res as never, createNext())

      expect(consoleError).toHaveBeenCalledWith(
        'getCurrentPolicyDocument error:',
        expect.any(Error),
      )
      expect(res.status).toHaveBeenCalledWith(500)
    })
  })
})
