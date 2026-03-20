import { describe, expect, it, vi } from 'vitest'

vi.mock('../../config/database.js', () => ({
  pool: {
    query: vi.fn(),
  },
}))

import {
  createSharingPreference,
  getSharingPreferencesForStudent,
  getSharingStatus,
  reinstateSharing,
  revokeSharing,
} from '../../models/sharingPreference.ts'
import { pool } from '../../config/database.js'

describe('sharingPreference model', () => {
  it('creates a sharing preference', async () => {
    vi.mocked(pool.query).mockResolvedValueOnce({
      rows: [{ student_id: 'student-1', course_id: 'course-1' }],
    } as never)

    await expect(
      createSharingPreference('student-1', 'course-1'),
    ).resolves.toEqual({
      student_id: 'student-1',
      course_id: 'course-1',
    })
  })

  it('gets sharing status and returns null when missing', async () => {
    vi.mocked(pool.query)
      .mockResolvedValueOnce({ rows: [{ is_shared: true }] } as never)
      .mockResolvedValueOnce({ rows: [] } as never)

    await expect(getSharingStatus('student-1', 'course-1')).resolves.toEqual({
      is_shared: true,
    })
    await expect(getSharingStatus('student-1', 'course-2')).resolves.toBeNull()
  })

  it('revokes sharing and returns whether any rows were updated', async () => {
    vi.mocked(pool.query)
      .mockResolvedValueOnce({ rowCount: 1 } as never)
      .mockResolvedValueOnce({ rowCount: 0 } as never)

    await expect(revokeSharing('student-1', 'course-1')).resolves.toBe(true)
    await expect(revokeSharing('student-1', 'course-2')).resolves.toBe(false)
  })

  it('reinstates sharing and returns whether any rows were updated', async () => {
    vi.mocked(pool.query)
      .mockResolvedValueOnce({ rowCount: 1 } as never)
      .mockResolvedValueOnce({ rowCount: null } as never)

    await expect(reinstateSharing('student-1', 'course-1')).resolves.toBe(true)
    await expect(reinstateSharing('student-1', 'course-2')).resolves.toBe(false)
  })

  it('gets sharing preferences for a student', async () => {
    vi.mocked(pool.query).mockResolvedValueOnce({
      rows: [{ course_code: 'TDT4242', course_name: 'Software Testing' }],
    } as never)

    await expect(getSharingPreferencesForStudent('student-1')).resolves.toEqual([
      { course_code: 'TDT4242', course_name: 'Software Testing' },
    ])
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('ORDER BY c.code'),
      ['student-1'],
    )
  })
})
