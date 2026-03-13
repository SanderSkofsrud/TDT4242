import { describe, expect, it, vi } from 'vitest'

import noTelemetry from '../../middleware/noTelemetry.js'

describe('noTelemetry middleware', () => {
  it('removes server-identifying headers, adds nosniff and calls next', () => {
    const response = {
      removeHeader: vi.fn(),
      setHeader: vi.fn(),
    }
    const next = vi.fn()

    noTelemetry({} as never, response as never, next)

    expect(response.removeHeader).toHaveBeenNthCalledWith(1, 'X-Powered-By')
    expect(response.removeHeader).toHaveBeenNthCalledWith(2, 'Server')
    expect(response.setHeader).toHaveBeenCalledWith(
      'X-Content-Type-Options',
      'nosniff',
    )
    expect(next).toHaveBeenCalledTimes(1)
  })
})
