import 'express'

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        role: string
        capabilities: string[]
        privacyAckVersion: number
      }
    }
  }
}

export {}

