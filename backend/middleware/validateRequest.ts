import type { Request, Response, NextFunction } from 'express'
import { validationResult } from 'express-validator'

export function validateRequest(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const errors = validationResult(req)

  if (errors.isEmpty()) {
    next()
    return
  }

  const details = errors.array().map((err) => err.msg)

  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.error('Validation failed:', errors.array())
  }

  res.status(422).json({
    error: 'Validation failed',
    details,
  })
}

