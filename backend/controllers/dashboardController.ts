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

    for (const declaration of declarations) {
      // Count by category (categories is an array per declaration).
      for (const category of declaration.categories) {
        byCategory[category] = (byCategory[category] ?? 0) + 1
      }

      // Count by frequency (single value per declaration).
      const freq = declaration.frequency
      byFrequency[freq] = (byFrequency[freq] ?? 0) + 1
    }

    const responseBody = {
      declarations,
      summary: {
        totalDeclarations: declarations.length,
        byCategory,
        byFrequency,
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

    const data = await getInstructorAggregateForCourse(courseId)

    if (data.length === 0) {
      res.status(200).json({
        suppressed: true,
        message: 'Cohort size is below the minimum threshold for display',
      })

      void logAccess(
        userId,
        CAPABILITIES['dashboard:read:course_aggregate'],
        courseId,
      ).catch(() => {})

      return
    }

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
  // Known limitation: faculty scope is passed as a query parameter for this demo.
  // A production system requires a faculty_id field on the users table or a separate faculty-user association table.
  const facultyId = typeof req.query.facultyId === 'string'
    ? req.query.facultyId
    : undefined

  try {
    const user = req.user
    if (!user) {
      res.status(500).json(INTERNAL_ERROR_BODY)
      return
    }

    // This role check is acceptable here because faculty scope cannot be
    // inferred from enrolments alone in the current data model.
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

    const data = await getFacultyAggregateForFaculty(facultyId)

    if (data.length === 0) {
      res.status(200).json({
        suppressed: true,
        message: 'Cohort size is below the minimum threshold for display',
      })

      void logAccess(
        user.id,
        CAPABILITIES['dashboard:read:faculty_aggregate'],
        facultyId,
      ).catch(() => {})

      return
    }

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

