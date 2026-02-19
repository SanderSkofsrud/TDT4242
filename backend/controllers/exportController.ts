import type { Request, Response, NextFunction } from 'express'

import { findDeclarationsByStudent } from '../models/declaration.js'
import { getSharingPreferencesForStudent } from '../models/sharingPreference.js'
import { logAccess } from '../models/accessLog.js'
import { CAPABILITIES } from '../config/capabilities.js'

const INTERNAL_ERROR_BODY = { error: 'Internal server error' }

export async function exportMyData(
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

    const [declarations, sharingPreferences] = await Promise.all([
      findDeclarationsByStudent(userId),
      getSharingPreferencesForStudent(userId),
    ])

    const exportObject = {
      exportedAt: new Date().toISOString(),
      student: {
        id: userId,
      },
      declarations,
      sharingPreferences,
    }

    const filename = `ai-usage-export-${userId}.json`

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`,
    )
    res.setHeader('Content-Type', 'application/json')

    res.status(200).send(JSON.stringify(exportObject))

    void logAccess(
      userId,
      CAPABILITIES['data:export:own'],
      null,
    ).catch(() => {})
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('exportMyData error:', error)
    }

    res.status(500).json(INTERNAL_ERROR_BODY)
  }
}

