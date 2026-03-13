import { describe, expect, it, vi } from 'vitest'

vi.mock('../../config/database.js', () => ({
  pool: {
    connect: vi.fn(),
    query: vi.fn(),
  },
}))

import {
  getCurrentPolicy,
  getPolicyByVersion,
  uploadPolicyDocument,
} from '../../models/policyDocument.ts'
import { pool } from '../../config/database.js'

describe('policyDocument model', () => {
  it('uploads a policy document in a transaction', async () => {
    const client = {
      query: vi
        .fn()
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ rows: [{ id: 'policy-1' }] })
        .mockResolvedValueOnce({}),
      release: vi.fn(),
    }
    vi.mocked(pool.connect).mockResolvedValueOnce(client as never)

    await expect(
      uploadPolicyDocument('/policy/v2.pdf', 2, 'admin-1'),
    ).resolves.toEqual({ id: 'policy-1' })
    expect(client.query).toHaveBeenNthCalledWith(1, 'BEGIN')
    expect(client.query).toHaveBeenNthCalledWith(
      2,
      'UPDATE policy_documents SET is_current = FALSE WHERE is_current = TRUE',
    )
    expect(client.query).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('INSERT INTO policy_documents'),
      [2, '/policy/v2.pdf', 'admin-1'],
    )
    expect(client.query).toHaveBeenNthCalledWith(4, 'COMMIT')
    expect(client.release).toHaveBeenCalledTimes(1)
  })

  it('rolls back when upload fails', async () => {
    const client = {
      query: vi
        .fn()
        .mockResolvedValueOnce({})
        .mockRejectedValueOnce(new Error('db failed'))
        .mockResolvedValueOnce({}),
      release: vi.fn(),
    }
    vi.mocked(pool.connect).mockResolvedValueOnce(client as never)

    await expect(
      uploadPolicyDocument('/policy/v2.pdf', 2, 'admin-1'),
    ).rejects.toThrow('db failed')
    expect(client.query).toHaveBeenCalledWith('ROLLBACK')
    expect(client.release).toHaveBeenCalledTimes(1)
  })

  it('gets the current policy and returns null when missing', async () => {
    vi.mocked(pool.query)
      .mockResolvedValueOnce({ rows: [{ id: 'policy-1' }] } as never)
      .mockResolvedValueOnce({ rows: [] } as never)

    await expect(getCurrentPolicy()).resolves.toEqual({ id: 'policy-1' })
    await expect(getCurrentPolicy()).resolves.toBeNull()
  })

  it('gets a policy by version and returns null when missing', async () => {
    vi.mocked(pool.query)
      .mockResolvedValueOnce({ rows: [{ id: 'policy-2' }] } as never)
      .mockResolvedValueOnce({ rows: [] } as never)

    await expect(getPolicyByVersion(2)).resolves.toEqual({ id: 'policy-2' })
    await expect(getPolicyByVersion(3)).resolves.toBeNull()
  })
})
