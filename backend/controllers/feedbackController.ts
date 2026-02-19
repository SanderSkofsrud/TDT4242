import type { Request, Response, NextFunction } from 'express'

import { CAPABILITIES } from '../config/capabilities.js'
import { findDeclarationById } from '../models/declaration.js'
import { findGuidanceByAssignment } from '../models/assignmentGuidance.js'
import {
  findTemplatesByPolicyVersion,
} from '../models/feedbackTemplate.js'
import { getCurrentPolicy } from '../models/policyDocument.js'
import { logAccess } from '../models/accessLog.js'

const INTERNAL_ERROR_BODY = { error: 'Internal server error' }

export async function getFeedback(
  req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  const declarationId = req.params.declarationId as string

  try {
    const userId = req.user?.id
    if (!userId) {
      res.status(500).json(INTERNAL_ERROR_BODY)
      return
    }

    const declaration = await findDeclarationById(declarationId)
    if (!declaration) {
      res.status(404).json({ error: 'Declaration not found' })
      return
    }

    if (declaration.student_id !== userId) {
      res
        .status(403)
        .json({ error: 'You may only view feedback for your own declarations' })
      return
    }

    const [guidance, templates, currentPolicy] = await Promise.all([
      findGuidanceByAssignment(declaration.assignment_id),
      findTemplatesByPolicyVersion(declaration.policy_version),
      getCurrentPolicy(),
    ])

    if (!currentPolicy) {
      res.status(404).json({ error: 'Policy document not available' })
      return
    }

    const declarationCategories = declaration.categories

    const filteredTemplates = templates
      .filter((template) => {
        if (template.category === null) {
          return true
        }

        return declarationCategories.includes(
          template.category as (typeof declarationCategories)[number],
        )
      })
      .map((template) => ({
        category: template.category,
        triggerCondition: template.trigger_condition,
        templateText: template.template_text,
      }))

    const responseBody = {
      declarationId: declaration.id,
      categories: declaration.categories,
      frequency: declaration.frequency,
      guidance: guidance
        ? {
            permittedText: guidance.permitted_text,
            prohibitedText: guidance.prohibited_text,
            examples: guidance.examples,
          }
        : null,
      feedbackTemplates: filteredTemplates,
      policyVersion: declaration.policy_version,
      policyFilePath: currentPolicy.file_path,
    }

    res.status(200).json(responseBody)

    void logAccess(
      userId,
      CAPABILITIES['declaration:read:own'],
      declaration.id,
    ).catch(() => {})
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('getFeedback error:', error)
    }

    res.status(500).json(INTERNAL_ERROR_BODY)
  }
}

export async function getCurrentPolicyDocument(
  _req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  try {
    const policy = await getCurrentPolicy()

    if (!policy) {
      res
        .status(404)
        .json({ error: 'No policy document is currently available' })
      return
    }

    res.status(200).json({
      version: policy.version,
      filePath: policy.file_path,
    })
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('getCurrentPolicyDocument error:', error)
    }

    res.status(500).json(INTERNAL_ERROR_BODY)
  }
}

