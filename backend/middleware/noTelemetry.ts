// Hard boundary: no behavioral telemetry. This middleware must remain on all routes in all environments.

import type { Request, Response, NextFunction } from 'express'

export default function noTelemetry(
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  res.removeHeader('X-Powered-By')
  res.removeHeader('Server')
  res.setHeader('X-Content-Type-Options', 'nosniff')

  next()
}

