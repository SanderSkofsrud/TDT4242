import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../models/declaration.js', () => ({
  findDeclarationsByStudent: vi.fn(),
}))

vi.mock('../../models/sharingPreference.js', () => ({
  getSharingPreferencesForStudent: vi.fn(),
}))

vi.mock('../../models/accessLog.js', () => ({
  logAccess: vi.fn(),
}))

import { CAPABILITIES } from '../../config/capabilities.ts'
import { exportMyData } from '../../controllers/exportController.ts'
import { createNext, createResponse } from '../helpers/http.ts'
import { findDeclarationsByStudent } from '../../models/declaration.js'
import { getSharingPreferencesForStudent } from '../../models/sharingPreference.js'
import { logAccess } from '../../models/accessLog.js'

describe('exportController', () => {
  const originalNodeEnv = process.env.NODE_ENV

  beforeEach(() => {
    process.env.NODE_ENV = 'test'
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-13T10:00:00.000Z'))
  })

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv
    vi.useRealTimers()
  })

  it('returns 500 when there is no authenticated user id', async () => {
    const res = createResponse()

    await exportMyData({} as never, res as never, createNext())

    expect(res.status).toHaveBeenCalledWith(500)
  })

  it('exports the user data and logs access on success', async () => {
    vi.mocked(findDeclarationsByStudent).mockResolvedValueOnce([
      { id: 'declaration-1' },
    ] as never)
    vi.mocked(getSharingPreferencesForStudent).mockResolvedValueOnce([
      { course_id: 'course-1', is_shared: true },
    ] as never)
    vi.mocked(logAccess).mockResolvedValue({} as never)
    const res = createResponse()

    await exportMyData(
      { user: { id: 'student-1' } } as never,
      res as never,
      createNext(),
    )

    expect(res.setHeader).toHaveBeenNthCalledWith(
      1,
      'Content-Disposition',
      'attachment; filename="ai-usage-export-student-1.json"',
    )
    expect(res.setHeader).toHaveBeenNthCalledWith(
      2,
      'Content-Type',
      'application/json',
    )
    expect(res.status).toHaveBeenCalledWith(200)

    const payload = JSON.parse(String(vi.mocked(res.send).mock.calls[0][0]))
    expect(payload).toEqual({
      exportedAt: '2026-03-13T10:00:00.000Z',
      student: { id: 'student-1' },
      declarations: [{ id: 'declaration-1' }],
      sharingPreferences: [{ course_id: 'course-1', is_shared: true }],
    })
    expect(logAccess).toHaveBeenCalledWith(
      'student-1',
      CAPABILITIES['data:export:own'],
      null,
    )
  })

  it('returns 500 when export generation fails', async () => {
    vi.mocked(findDeclarationsByStudent).mockRejectedValueOnce(new Error('db failed'))
    const res = createResponse()

    await exportMyData(
      { user: { id: 'student-1' } } as never,
      res as never,
      createNext(),
    )

    expect(res.status).toHaveBeenCalledWith(500)
  })

  it('logs export failures in development', async () => {
    process.env.NODE_ENV = 'development'
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(findDeclarationsByStudent).mockRejectedValueOnce(new Error('db failed'))
    const res = createResponse()

    await exportMyData(
      { user: { id: 'student-1' } } as never,
      res as never,
      createNext(),
    )

    expect(consoleError).toHaveBeenCalledWith(
      'exportMyData error:',
      expect.any(Error),
    )
    expect(res.status).toHaveBeenCalledWith(500)
  })
})
