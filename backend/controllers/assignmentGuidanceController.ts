import type { Request, Response, NextFunction } from 'express'

import { CAPABILITIES } from '../config/capabilities.js'
import { findAssignmentById } from '../models/assignment.js'
import {
  createGuidance as createGuidanceModel,
  findGuidanceByAssignment,
  updateGuidance as updateGuidanceModel,
} from '../models/assignmentGuidance.js'
import { isUserInstructorInCourse } from '../models/enrolment.js'
import { logAccess } from '../models/accessLog.js'

const INTERNAL_ERROR_BODY = { error: 'Internal server error' }

export async function getGuidance(
  req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  const assignmentId = req.params.assignmentId as string

  try {
    const guidance = await findGuidanceByAssignment(assignmentId)

    if (!guidance) {
      res.status(404).json({ error: 'Guidance not found' })
      return
    }

    res.status(200).json(guidance)

    if (req.user) {
      void logAccess(
        req.user.id,
        CAPABILITIES['guidance:read'],
        guidance.id,
      ).catch(() => {})
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('getGuidance error:', error)
    }

    res.status(500).json(INTERNAL_ERROR_BODY)
  }
}

export async function createGuidance(
  req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  const assignmentId = req.params.assignmentId as string
  const { permittedText, prohibitedText, examples } = req.body

  try {
    const assignment = await findAssignmentById(assignmentId)
    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found' })
      return
    }

    const existing = await findGuidanceByAssignment(assignmentId)
    if (existing) {
      res
        .status(409)
        .json({ error: 'Guidance already exists for this assignment' })
      return
    }

    const userId = req.user?.id
    if (!userId) {
      res.status(500).json(INTERNAL_ERROR_BODY)
      return
    }

    const isInstructor = await isUserInstructorInCourse(
      userId,
      assignment.course_id,
    )
    if (!isInstructor) {
      res
        .status(403)
        .json({ error: 'You are not an instructor for this assignment' })
      return
    }

    const guidance = await createGuidanceModel({
      assignment_id: assignmentId,
      permitted_text: permittedText,
      prohibited_text: prohibitedText,
      examples: examples ?? null,
      created_by: userId,
    })

    res.status(201).json(guidance)

    void logAccess(
      userId,
      CAPABILITIES['guidance:write'],
      guidance.id,
    ).catch(() => {})
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('createGuidance error:', error)
    }

    res.status(500).json(INTERNAL_ERROR_BODY)
  }
}

export async function updateGuidance(
  req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  const assignmentId = req.params.assignmentId as string
  const { permittedText, prohibitedText, examples } = req.body

  try {
    const assignment = await findAssignmentById(assignmentId)
    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found' })
      return
    }

    const userId = req.user?.id
    if (!userId) {
      res.status(500).json(INTERNAL_ERROR_BODY)
      return
    }

    const isInstructor = await isUserInstructorInCourse(
      userId,
      assignment.course_id,
    )
    if (!isInstructor) {
      res
        .status(403)
        .json({ error: 'You are not an instructor for this assignment' })
      return
    }

    const updated = await updateGuidanceModel(assignmentId, {
      permitted_text: permittedText,
      prohibited_text: prohibitedText,
      examples: examples ?? null,
    })

    if (!updated) {
      res.status(409).json({
        error:
          'Guidance is locked after the assignment due date and cannot be edited',
      })
      return
    }

    res.status(200).json(updated)

    void logAccess(
      userId,
      CAPABILITIES['guidance:write'],
      updated.id,
    ).catch(() => {})
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('updateGuidance error:', error)
    }

    res.status(500).json(INTERNAL_ERROR_BODY)
  }
}

