import type { Request, Response, NextFunction, RequestHandler } from 'express'

import { CAPABILITIES } from '../config/capabilities.js'
import { logAccess } from '../models/accessLog.js'

const UNAUTHORISED_BODY = { error: 'Unauthorised' }
const FORBIDDEN_BODY = { error: 'Forbidden' }

export function requireCapability(
  capability: (typeof CAPABILITIES)[keyof typeof CAPABILITIES],
): RequestHandler {
  return async function rbacMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const user = req.user

    if (!user) {
      res.status(401).json(UNAUTHORISED_BODY)
      return
    }

    if (!user.capabilities.includes(capability)) {
      res.status(403).json(FORBIDDEN_BODY)
      return
    }

    try {
      await logAccess(user.id, capability, null)
    } catch {
      // Logging failures must not block legitimate access.
    }

    next()
  }
}

