import type { Request, Response, NextFunction } from 'express'

import { CAPABILITIES } from '../config/capabilities.js'
import { findAssignmentsForStudent } from '../models/assignment.js'
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
