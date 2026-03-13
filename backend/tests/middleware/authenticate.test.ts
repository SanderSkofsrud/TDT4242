import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn(),
  },
}))

vi.mock('../../models/user.js', () => ({
  findUserById: vi.fn(),
}))

import jwt from 'jsonwebtoken'

import { ROLE_CAPABILITIES } from '../../config/capabilities.ts'
import { authenticate } from '../../middleware/authenticate.ts'
import { findUserById } from '../../models/user.js'

function createResponse() {
  const response = {
    status: vi.fn(),
    json: vi.fn(),
  }

  response.status.mockReturnValue(response)
  response.json.mockReturnValue(response)

  return response
}

function createRequest(authorization?: string) {
  return {
    header: vi.fn((name: string) =>
      name === 'Authorization' ? authorization : undefined),
  }
}

describe('authenticate', () => {
  const originalSecret = process.env.JWT_SECRET

  afterEach(() => {
    process.env.JWT_SECRET = originalSecret
  })

  it('returns 401 when the Authorization header is missing or invalid', async () => {
    const res = createResponse()
    const next = vi.fn()

    await authenticate(createRequest() as never, res as never, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorised' })
    expect(jwt.verify).not.toHaveBeenCalled()
    expect(next).not.toHaveBeenCalled()
  })

  it('returns 401 when JWT_SECRET is not configured', async () => {
    delete process.env.JWT_SECRET

    const res = createResponse()
    const next = vi.fn()

    await authenticate(createRequest('Bearer token') as never, res as never, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorised' })
    expect(jwt.verify).not.toHaveBeenCalled()
    expect(next).not.toHaveBeenCalled()
  })

  it('returns 401 when token verification fails', async () => {
    process.env.JWT_SECRET = 'secret'
    vi.mocked(jwt.verify).mockImplementationOnce(() => {
      throw new Error('bad token')
    })

    const res = createResponse()

    await authenticate(
      createRequest('Bearer token') as never,
      res as never,
      vi.fn(),
    )

    expect(jwt.verify).toHaveBeenCalledWith('token', 'secret')
    expect(res.status).toHaveBeenCalledWith(401)
  })

  it('returns 401 when the token payload has no subject', async () => {
    process.env.JWT_SECRET = 'secret'
    vi.mocked(jwt.verify).mockReturnValueOnce({} as never)

    const res = createResponse()
    const next = vi.fn()

    await authenticate(
      createRequest('Bearer token') as never,
      res as never,
      next,
    )

    expect(findUserById).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(401)
    expect(next).not.toHaveBeenCalled()
  })

  it('returns 401 when the user does not exist', async () => {
    process.env.JWT_SECRET = 'secret'
    vi.mocked(jwt.verify).mockReturnValueOnce({ sub: 'user-1' } as never)
    vi.mocked(findUserById).mockResolvedValueOnce(null)

    const res = createResponse()

    await authenticate(
      createRequest('Bearer token') as never,
      res as never,
      vi.fn(),
    )

    expect(findUserById).toHaveBeenCalledWith('user-1')
    expect(res.status).toHaveBeenCalledWith(401)
  })

  it('attaches the authenticated user and mapped capabilities for known roles', async () => {
    process.env.JWT_SECRET = 'secret'
    vi.mocked(jwt.verify).mockReturnValueOnce({ sub: 'user-1' } as never)
    vi.mocked(findUserById).mockResolvedValueOnce({
      id: 'user-1',
      email: 'student@example.com',
      password_hash: 'hash',
      role: 'student',
      privacy_ack_version: 3,
      created_at: new Date(),
    })

    const req = createRequest('Bearer token')
    const res = createResponse()
    const next = vi.fn()

    await authenticate(req as never, res as never, next)

    expect(req.user).toEqual({
      id: 'user-1',
      role: 'student',
      capabilities: ROLE_CAPABILITIES.student,
      privacyAckVersion: 3,
    })
    expect(next).toHaveBeenCalledTimes(1)
    expect(res.status).not.toHaveBeenCalled()
  })

  it('falls back to an empty capability list for unexpected roles', async () => {
    process.env.JWT_SECRET = 'secret'
    vi.mocked(jwt.verify).mockReturnValueOnce({ sub: 'user-2' } as never)
    vi.mocked(findUserById).mockResolvedValueOnce({
      id: 'user-2',
      email: 'unknown@example.com',
      password_hash: 'hash',
      role: 'guest',
      privacy_ack_version: 1,
      created_at: new Date(),
    } as never)

    const req = createRequest('Bearer token')
    const next = vi.fn()

    await authenticate(req as never, createResponse() as never, next)

    expect(req.user).toEqual({
      id: 'user-2',
      role: 'guest',
      capabilities: [],
      privacyAckVersion: 1,
    })
    expect(next).toHaveBeenCalledTimes(1)
  })
})
