import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

import { ROLE_CAPABILITIES } from '../config/capabilities.js'
import { findUserById } from '../models/user.js'

const UNAUTHORISED_BODY = { error: 'Unauthorised' }

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json(UNAUTHORISED_BODY)
    return
  }

  const token = authHeader.slice('Bearer '.length).trim()
  const secret = process.env.JWT_SECRET

  if (!secret) {
    // If the server is misconfigured, fail closed rather than allowing unauthenticated access.
    res.status(401).json(UNAUTHORISED_BODY)
    return
  }

  try {
    const decoded = jwt.verify(token, secret) as jwt.JwtPayload
    const userId = decoded.sub as string | undefined

    if (!userId) {
      res.status(401).json(UNAUTHORISED_BODY)
      return
    }

    const user = await findUserById(userId)
    if (!user) {
      res.status(401).json(UNAUTHORISED_BODY)
      return
    }

    const capabilities = ROLE_CAPABILITIES[user.role] ?? []

    req.user = {
      id: user.id,
      role: user.role,
      capabilities,
      privacyAckVersion: user.privacy_ack_version,
    }

    next()
  } catch {
    res.status(401).json(UNAUTHORISED_BODY)
  }
}

