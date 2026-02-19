import type { Request, Response, NextFunction } from 'express'

import {
  getSharingPreferencesForStudent,
  revokeSharing as revokeSharingModel,
  reinstateSharing as reinstateSharingModel,
} from '../models/sharingPreference.js'
import { isStudentEnrolledInCourse } from '../models/enrolment.js'

const INTERNAL_ERROR_BODY = { error: 'Internal server error' }

export async function getSharingStatus(
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

    const preferences = await getSharingPreferencesForStudent(userId)
    res.status(200).json(preferences)
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('getSharingStatus error:', error)
    }

    res.status(500).json(INTERNAL_ERROR_BODY)
  }
}

export async function revokeSharing(
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

    const enrolled = await isStudentEnrolledInCourse(userId, courseId)
    if (!enrolled) {
      res.status(404).json({ error: 'Course not found for this student' })
      return
    }

    await revokeSharingModel(userId, courseId)

    res.status(200).json({ success: true })
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('revokeSharing error:', error)
    }

    res.status(500).json(INTERNAL_ERROR_BODY)
  }
}

export async function reinstateSharing(
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

    const enrolled = await isStudentEnrolledInCourse(userId, courseId)
    if (!enrolled) {
      res.status(404).json({ error: 'Course not found for this student' })
      return
    }

    await reinstateSharingModel(userId, courseId)

    res.status(200).json({ success: true })
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('reinstateSharing error:', error)
    }

    res.status(500).json(INTERNAL_ERROR_BODY)
  }
}

