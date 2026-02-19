import type { Request, Response, NextFunction } from 'express'

import {
  createDeclaration,
  findDeclarationById,
  findDeclarationByStudentAndAssignment,
  findDeclarationsByStudent,
} from '../models/declaration.js'
import { findAssignmentById } from '../models/assignment.js'
import { isStudentEnrolledInCourse } from '../models/enrolment.js'
import { logAccess } from '../models/accessLog.js'
import { CAPABILITIES } from '../config/capabilities.js'

const INTERNAL_ERROR_BODY = { error: 'Internal server error' }

export async function submitDeclaration(
  req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  const { assignmentId, toolsUsed, categories, frequency, contextText } =
    req.body

  try {
    const userId = req.user?.id
    const privacyAckVersion = req.user?.privacyAckVersion

    if (!userId || privacyAckVersion === undefined) {
      res.status(500).json(INTERNAL_ERROR_BODY)
      return
    }

    const existing = await findDeclarationByStudentAndAssignment(
      userId,
      assignmentId,
    )
    if (existing) {
      res.status(409).json({
        error: 'A declaration has already been submitted for this assignment',
      })
      return
    }

    const assignment = await findAssignmentById(assignmentId)
    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found' })
      return
    }

    const isEnrolled = await isStudentEnrolledInCourse(
      userId,
      assignment.course_id,
    )
    if (!isEnrolled) {
      res.status(403).json({
        error: 'You are not enrolled in the course for this assignment',
      })
      return
    }

    const now = new Date()
    const dueDate = new Date(assignment.due_date)
    if (dueDate.getTime() < now.getTime()) {
      res.status(409).json({
        error: 'The submission window for this assignment has closed',
      })
      return
    }

    const envVersionRaw = process.env.PRIVACY_NOTICE_VERSION
    const envVersion =
      envVersionRaw !== undefined ? Number.parseInt(envVersionRaw, 10) : NaN

    if (!Number.isInteger(envVersion) || envVersion !== privacyAckVersion) {
      res.status(403).json({
        error:
          'Privacy notice acknowledgement required before submitting a declaration',
      })
      return
    }

    const declaration = await createDeclaration({
      student_id: userId,
      assignment_id: assignmentId,
      tools_used: toolsUsed,
      categories,
      frequency,
      context_text: contextText ?? null,
      policy_version: envVersion,
    })

    res.status(201).json(declaration)

    void logAccess(
      userId,
      CAPABILITIES['declaration:write'],
      declaration.id,
    ).catch(() => {})
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('submitDeclaration error:', error)
    }

    res.status(500).json(INTERNAL_ERROR_BODY)
  }
}

export async function getDeclaration(
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
        .json({ error: 'You may only read your own declarations' })
      return
    }

    res.status(200).json(declaration)

    void logAccess(
      userId,
      CAPABILITIES['declaration:read:own'],
      declaration.id,
    ).catch(() => {})
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('getDeclaration error:', error)
    }

    res.status(500).json(INTERNAL_ERROR_BODY)
  }
}

export async function getMyDeclarations(
  req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user?.id
    if (!userId) {
      res.status(500).json(INTERNAL_ERROR_BODY)
      return
    }

    const declarations = await findDeclarationsByStudent(userId)

    res.status(200).json(declarations)

    if (declarations.length > 0) {
      void logAccess(
        userId,
        CAPABILITIES['declaration:read:own'],
        null,
      ).catch(() => {})
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('getMyDeclarations error:', error)
    }

    res.status(500).json(INTERNAL_ERROR_BODY)
  }
}

