import type { Request, Response, NextFunction } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

import type { User } from '../types/models.js'
import {
  createUser,
  findUserByEmail,
  updatePrivacyAckVersion,
} from '../models/user.js'
import { logAccess } from '../models/accessLog.js'

const INTERNAL_ERROR_BODY = { error: 'Internal server error' }
const INVALID_CREDENTIALS_BODY = { error: 'Invalid credentials' }

const BCRYPT_COST = 12

const ALLOWED_ROLES = new Set(['student', 'instructor', 'head_of_faculty'])

export async function register(
  req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  const { email, password, role } = req.body as {
    email?: string
    password?: string
    role?: string
  }

  try {
    if (!role || !ALLOWED_ROLES.has(role)) {
      res.status(400).json({ error: 'Invalid role' })
      return
    }

    if (!email || !password) {
      res.status(400).json(INTERNAL_ERROR_BODY)
      return
    }

    const existing = await findUserByEmail(email)
    if (existing) {
      res.status(409).json({ error: 'Email already registered' })
      return
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_COST)

    const typedRole = role as User['role']
    const user = await createUser(email, passwordHash, typedRole)

    res.status(201).json({
      id: user.id,
      email: user.email,
      role: user.role,
    })
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('register error:', error)
    }

    res.status(500).json(INTERNAL_ERROR_BODY)
  }
}

export async function login(
  req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  const { email, password } = req.body as {
    email?: string
    password?: string
  }

  try {
    if (!email || !password) {
      res.status(401).json(INVALID_CREDENTIALS_BODY)
      return
    }

    const user = await findUserByEmail(email)
    if (!user) {
      res.status(401).json(INVALID_CREDENTIALS_BODY)
      return
    }

    const matches = await bcrypt.compare(password, user.password_hash)
    if (!matches) {
      res.status(401).json(INVALID_CREDENTIALS_BODY)
      return
    }

    const secret = process.env.JWT_SECRET
    if (!secret) {
      res.status(500).json(INTERNAL_ERROR_BODY)
      return
    }

    const token = jwt.sign(
      {
        sub: user.id,
        role: user.role,
        privacyAckVersion: user.privacy_ack_version,
      },
      secret,
      { expiresIn: '1h' },
    )

    // Issue token as JSON response for the SPA and also as a cookie so
    // that the browser can persist it across reloads. The cookie is
    // limited to 1 hour to match the JWT expiry.
    res
      .cookie('authToken', token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 1000,
        path: '/',
      })
      .status(200)
      .json({ token })
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('login error:', error)
    }

    res.status(500).json(INTERNAL_ERROR_BODY)
  }
}

export async function acknowledgePrivacyNotice(
  req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  const { version } = req.body as { version?: number }

  try {
    const userId = req.user?.id
    if (!userId) {
      res.status(500).json(INTERNAL_ERROR_BODY)
      return
    }

    const envVersion = Number.parseInt(
      process.env.PRIVACY_NOTICE_VERSION ?? '0',
      10,
    )

    if (
      typeof version !== 'number' ||
      !Number.isInteger(version) ||
      version !== envVersion
    ) {
      res.status(400).json({ error: 'Invalid privacy notice version' })
      return
    }

    await updatePrivacyAckVersion(userId, version)

    res.status(200).json({ success: true })

    void logAccess(userId, 'privacy_notice:ack', null).catch(() => {})
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('acknowledgePrivacyNotice error:', error)
    }

    res.status(500).json(INTERNAL_ERROR_BODY)
  }
}

