import type { Request, Response, NextFunction } from 'express'

import { findDeclarationsByStudent } from '../models/declaration.js'
import {
  getInstructorAggregateForCourse,
  getFacultyAggregateForFaculty,
} from '../models/dashboard.js'
import {
  isUserInstructorInCourse,
  getCoursesForInstructor,
} from '../models/enrolment.js'
import { logAccess } from '../models/accessLog.js'
import { CAPABILITIES } from '../config/capabilities.js'

const INTERNAL_ERROR_BODY = { error: 'Internal server error' }

export async function getStudentDashboard(
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

    const byCategory: Record<string, number> = {}
    const byFrequency: Record<string, number> = {}
    const byAssignment: Record<
      string,
      {
        assignmentId: string
        totalDeclarations: number
        byCategory: Record<string, number>
        byFrequency: Record<string, number>
      }
    > = {}
    const byMonth: Record<
      string,
      {
        month: string
        totalDeclarations: number
        byCategory: Record<string, number>
        byFrequency: Record<string, number>
      }
    > = {}

    for (const declaration of declarations) {
      for (const category of declaration.categories) {
        byCategory[category] = (byCategory[category] ?? 0) + 1
      }

      const freq = declaration.frequency
      byFrequency[freq] = (byFrequency[freq] ?? 0) + 1

      const assignmentId = declaration.assignment_id
      if (!byAssignment[assignmentId]) {
        byAssignment[assignmentId] = {
          assignmentId,
          totalDeclarations: 0,
          byCategory: {},
          byFrequency: {},
        }
      }
      byAssignment[assignmentId].totalDeclarations += 1
      byAssignment[assignmentId].byFrequency[freq] =
        (byAssignment[assignmentId].byFrequency[freq] ?? 0) + 1
      for (const category of declaration.categories) {
        byAssignment[assignmentId].byCategory[category] =
          (byAssignment[assignmentId].byCategory[category] ?? 0) + 1
      }

      const submittedAt = declaration.submitted_at
      const monthKey = new Date(submittedAt).toISOString().slice(0, 7)
      if (!byMonth[monthKey]) {
        byMonth[monthKey] = {
          month: monthKey,
          totalDeclarations: 0,
          byCategory: {},
          byFrequency: {},
        }
      }
      byMonth[monthKey].totalDeclarations += 1
      byMonth[monthKey].byFrequency[freq] =
        (byMonth[monthKey].byFrequency[freq] ?? 0) + 1
      for (const category of declaration.categories) {
        byMonth[monthKey].byCategory[category] =
          (byMonth[monthKey].byCategory[category] ?? 0) + 1
      }
    }

    const perAssignment = Object.values(byAssignment).sort((a, b) =>
      a.assignmentId.localeCompare(b.assignmentId),
    )
    const perMonth = Object.values(byMonth).sort((a, b) =>
      a.month.localeCompare(b.month),
    )

    const responseBody = {
      declarations,
      summary: {
        totalDeclarations: declarations.length,
        byCategory,
        byFrequency,
        perAssignment,
        perMonth,
      },
    }

    res.status(200).json(responseBody)

    void logAccess(
      userId,
      CAPABILITIES['dashboard:read:own'],
      null,
    ).catch(() => {})
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('getStudentDashboard error:', error)
    }

    res.status(500).json(INTERNAL_ERROR_BODY)
  }
}

export async function getInstructorCourses(
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

    const courses = await getCoursesForInstructor(userId)
    res.status(200).json({ courses })
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('getInstructorCourses error:', error)
    }
    res.status(500).json(INTERNAL_ERROR_BODY)
  }
}

export async function getInstructorDashboard(
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
      res
        .status(403)
        .json({ error: 'You are not an instructor for this course' })
      return
    }

    const rows = await getInstructorAggregateForCourse(courseId)
    const data = rows.map((row) => ({
      assignmentId: row.assignment_id,
      courseId: row.course_id,
      category: row.category,
      frequency: row.frequency,
      declarationCount: row.declaration_count,
    }))

    res.status(200).json({
      suppressed: false,
      courseId,
      data,
    })

    void logAccess(
      userId,
      CAPABILITIES['dashboard:read:course_aggregate'],
      courseId,
    ).catch(() => {})
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('getInstructorDashboard error:', error)
    }

    res.status(500).json(INTERNAL_ERROR_BODY)
  }
}

export async function getFacultyDashboard(
  req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  const facultyId = typeof req.query.facultyId === 'string'
    ? req.query.facultyId
    : undefined

  try {
    const user = req.user
    if (!user) {
      res.status(500).json(INTERNAL_ERROR_BODY)
      return
    }

    if (user.role !== 'head_of_faculty') {
      res.status(403).json({ error: 'Forbidden' })
      return
    }

    if (!facultyId || facultyId.trim().length === 0) {
      res
        .status(400)
        .json({ error: 'facultyId query parameter is required' })
      return
    }

    const rows = await getFacultyAggregateForFaculty(facultyId)
    const data = rows.map((row) => ({
      courseId: row.course_id,
      facultyId: row.faculty_id,
      courseCode: row.course_code,
      courseName: row.course_name,
      category: row.category,
      frequency: row.frequency,
      declarationCount: row.declaration_count,
    }))

    res.status(200).json({
      suppressed: false,
      facultyId,
      data,
    })

    void logAccess(
      user.id,
      CAPABILITIES['dashboard:read:faculty_aggregate'],
      facultyId,
    ).catch(() => {})
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('getFacultyDashboard error:', error)
    }

    res.status(500).json(INTERNAL_ERROR_BODY)
  }
}
