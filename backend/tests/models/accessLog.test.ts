import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../config/database.js', () => ({
  pool: {
    query: vi.fn(),
  },
}))

import {
  hardDeleteExpiredLogs,
  logAccess,
} from '../../models/accessLog.ts'
import { pool } from '../../config/database.js'

describe('accessLog model', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-13T10:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('creates an access log with calculated timestamps', async () => {
    vi.mocked(pool.query).mockResolvedValueOnce({
      rows: [{ id: 'log-1' }],
    } as never)

    await expect(
      logAccess('user-1', 'dashboard:read:own', null),
    ).resolves.toEqual({ id: 'log-1' })

    const args = vi.mocked(pool.query).mock.calls[0]
    expect(args[0]).toContain('INSERT INTO access_log')
    expect(args[1]?.[0]).toBe('user-1')
    expect(args[1]?.[1]).toBe('dashboard:read:own')
    expect(args[1]?.[2]).toBeNull()
    expect(args[1]?.[3]).toEqual(new Date('2026-03-13T10:00:00.000Z'))
    expect(args[1]?.[4]).toBeInstanceOf(Date)
  })

  it('deletes expired logs and normalises null row counts to zero', async () => {
    vi.mocked(pool.query)
      .mockResolvedValueOnce({ rowCount: 2 } as never)
      .mockResolvedValueOnce({ rowCount: null } as never)

    await expect(hardDeleteExpiredLogs()).resolves.toBe(2)
    await expect(hardDeleteExpiredLogs()).resolves.toBe(0)
  })
})
