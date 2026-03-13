import { describe, expect, it, vi } from 'vitest'

vi.mock('../../config/database.js', () => ({
  pool: {
    query: vi.fn(),
  },
}))

import {
  createUser,
  findUserByEmail,
  findUserById,
  updatePrivacyAckVersion,
} from '../../models/user.ts'
import { pool } from '../../config/database.js'

describe('user model', () => {
  it('finds a user by email and returns null when missing', async () => {
    vi.mocked(pool.query)
      .mockResolvedValueOnce({ rows: [{ id: 'user-1' }] } as never)
      .mockResolvedValueOnce({ rows: [] } as never)

    await expect(findUserByEmail('student@example.com')).resolves.toEqual({
      id: 'user-1',
    })
    await expect(findUserByEmail('missing@example.com')).resolves.toBeNull()
  })

  it('finds a user by id and returns null when missing', async () => {
    vi.mocked(pool.query)
      .mockResolvedValueOnce({ rows: [{ id: 'user-1' }] } as never)
      .mockResolvedValueOnce({ rows: [] } as never)

    await expect(findUserById('user-1')).resolves.toEqual({ id: 'user-1' })
    await expect(findUserById('missing')).resolves.toBeNull()
  })

  it('creates a user', async () => {
    vi.mocked(pool.query).mockResolvedValueOnce({
      rows: [{ id: 'user-1' }],
    } as never)

    await expect(
      createUser('student@example.com', 'hash', 'student'),
    ).resolves.toEqual({ id: 'user-1' })
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO users'),
      ['student@example.com', 'hash', 'student'],
    )
  })

  it('updates the privacy acknowledgement version', async () => {
    vi.mocked(pool.query).mockResolvedValueOnce({} as never)

    await expect(updatePrivacyAckVersion('user-1', 2)).resolves.toBeUndefined()
    expect(pool.query).toHaveBeenCalledWith(
      'UPDATE users SET privacy_ack_version = $1 WHERE id = $2',
      [2, 'user-1'],
    )
  })
})
