import { describe, expect, it, vi } from 'vitest'

vi.mock('../../models/accessLog.js', () => ({
  logAccess: vi.fn(),
}))

import { CAPABILITIES } from '../../config/capabilities.ts'
import { requireCapability } from '../../middleware/rbac.ts'
import { logAccess } from '../../models/accessLog.js'

function createResponse() {
  const response = {
    status: vi.fn(),
    json: vi.fn(),
  }

  response.status.mockReturnValue(response)
  response.json.mockReturnValue(response)

  return response
}

describe('requireCapability', () => {
  it('returns 401 when the request has no user', async () => {
    const middleware = requireCapability(CAPABILITIES['dashboard:read:own'])
    const res = createResponse()
    const next = vi.fn()

    await middleware({} as never, res as never, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorised' })
    expect(next).not.toHaveBeenCalled()
    expect(logAccess).not.toHaveBeenCalled()
  })

  it('returns 403 when the user lacks the required capability', async () => {
    const middleware = requireCapability(CAPABILITIES['dashboard:read:own'])
    const res = createResponse()
    const next = vi.fn()

    await middleware({
      user: {
        id: 'student-1',
        role: 'student',
        capabilities: [CAPABILITIES['declaration:write']],
        privacyAckVersion: 1,
      },
    } as never, res as never, next)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({ error: 'Forbidden' })
    expect(next).not.toHaveBeenCalled()
    expect(logAccess).not.toHaveBeenCalled()
  })

  it('logs access and calls next when the capability is present', async () => {
    vi.mocked(logAccess).mockResolvedValueOnce({} as never)

    const middleware = requireCapability(CAPABILITIES['dashboard:read:own'])
    const res = createResponse()
    const next = vi.fn()

    await middleware({
      user: {
        id: 'student-1',
        role: 'student',
        capabilities: [CAPABILITIES['dashboard:read:own']],
        privacyAckVersion: 1,
      },
    } as never, res as never, next)

    expect(logAccess).toHaveBeenCalledWith(
      'student-1',
      CAPABILITIES['dashboard:read:own'],
      null,
    )
    expect(next).toHaveBeenCalledTimes(1)
    expect(res.status).not.toHaveBeenCalled()
  })

  it('still calls next when access logging fails', async () => {
    vi.mocked(logAccess).mockRejectedValueOnce(new Error('db unavailable'))

    const middleware = requireCapability(CAPABILITIES['dashboard:read:own'])
    const res = createResponse()
    const next = vi.fn()

    await middleware({
      user: {
        id: 'student-1',
        role: 'student',
        capabilities: [CAPABILITIES['dashboard:read:own']],
        privacyAckVersion: 1,
      },
    } as never, res as never, next)

    expect(logAccess).toHaveBeenCalledWith(
      'student-1',
      CAPABILITIES['dashboard:read:own'],
      null,
    )
    expect(next).toHaveBeenCalledTimes(1)
    expect(res.status).not.toHaveBeenCalled()
  })
})
