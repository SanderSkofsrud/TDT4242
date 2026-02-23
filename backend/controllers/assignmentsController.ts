import type { Request, Response, NextFunction } from 'express'

import { CAPABILITIES } from '../config/capabilities.js'
import {
  findAssignmentsForStudent,
  findAssignmentsForCourse,
} from '../models/assignment.js'
import { isUserInstructorInCourse } from '../models/enrolment.js'
import { logAccess } from '../models/accessLog.js'

const INTERNAL_ERROR_BODY = { error: 'Internal server error' }

export async function getStudentAssignments(
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

    const rows = await findAssignmentsForStudent(userId)
    const assignments = rows.map((row) => ({
      id: row.assignment_id,
      title: row.title,
      dueDate: row.due_date,
      course: {
        id: row.course_id,
        code: row.course_code,
        name: row.course_name,
      },
      declaration: row.declaration_id
        ? {
            id: row.declaration_id,
            submittedAt: row.declaration_submitted_at,
          }
        : null,
    }))

    res.status(200).json({ assignments })

    void logAccess(
      userId,
      CAPABILITIES['assignment:read:own'],
      null,
    ).catch(() => {})
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('getStudentAssignments error:', error)
    }
    res.status(500).json(INTERNAL_ERROR_BODY)
  }
}

export async function getInstructorAssignmentsForCourse(
  req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  const courseId = req.params.courseId as string

  try {
    const userId = req.user?.id
    if (!userId) {
      res.status(500).json(INTERNAL_ERROR_BODY)
      return
    }

    const isInstructor = await isUserInstructorInCourse(userId, courseId)
    if (!isInstructor) {
      res.status(403).json({ error: 'You are not an instructor for this course' })
      return
    }

    const rows = await findAssignmentsForCourse(courseId)
    const assignments = rows.map((row) => ({
      id: row.assignment_id,
      courseId: row.course_id,
      title: row.title,
      dueDate: row.due_date,
      guidance: row.guidance_id
        ? {
            id: row.guidance_id,
            lockedAt: row.guidance_locked_at,
          }
        : null,
    }))

    res.status(200).json({ courseId, assignments })

    void logAccess(
      userId,
      CAPABILITIES['assignment:read:course'],
      courseId,
    ).catch(() => {})
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('getInstructorAssignmentsForCourse error:', error)
    }
    res.status(500).json(INTERNAL_ERROR_BODY)
  }
}
