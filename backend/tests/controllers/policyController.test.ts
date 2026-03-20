import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resolve } from 'path'

vi.mock('fs/promises', () => ({
  rename: vi.fn(),
}))

vi.mock('../../models/policyDocument.js', () => ({
  uploadPolicyDocument: vi.fn(),
  getCurrentPolicy: vi.fn(),
}))

vi.mock('../../models/accessLog.js', () => ({
  logAccess: vi.fn(),
}))

import { rename } from 'fs/promises'

import { CAPABILITIES } from '../../config/capabilities.ts'
import { uploadPolicy } from '../../controllers/policyController.ts'
import { createNext, createResponse } from '../helpers/http.ts'
import {
  getCurrentPolicy,
  uploadPolicyDocument,
} from '../../models/policyDocument.js'
import { logAccess } from '../../models/accessLog.js'

describe('policyController', () => {
  const originalNodeEnv = process.env.NODE_ENV
  const originalStoragePath = process.env.POLICY_PDF_STORAGE_PATH

  beforeEach(() => {
    process.env.NODE_ENV = 'test'
    process.env.POLICY_PDF_STORAGE_PATH = 'C:/tmp/policies'
  })

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv
    process.env.POLICY_PDF_STORAGE_PATH = originalStoragePath
  })

  it('returns 400 for an invalid policy version', async () => {
    const res = createResponse()

    await uploadPolicy(
      {
        body: { version: 'invalid' },
        file: { path: 'temp.pdf' },
      } as never,
      res as never,
      createNext(),
    )

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid policy version' })
  })

  it('returns 409 when the uploaded version is not newer than the current policy', async () => {
    vi.mocked(getCurrentPolicy).mockResolvedValueOnce({ version: 3 } as never)
    const res = createResponse()

    await uploadPolicy(
      {
        body: { version: '3' },
        file: { path: 'temp.pdf' },
      } as never,
      res as never,
      createNext(),
    )

    expect(res.status).toHaveBeenCalledWith(409)
    expect(res.json).toHaveBeenCalledWith({
      error: 'Policy version must be greater than the current version',
    })
  })

  it('returns 400 when no file was uploaded', async () => {
    vi.mocked(getCurrentPolicy).mockResolvedValueOnce(null)
    const res = createResponse()

    await uploadPolicy(
      { body: { version: '4' } } as never,
      res as never,
      createNext(),
    )

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ error: 'No PDF file was uploaded' })
  })

  it('returns 500 when the user context is missing after the file move', async () => {
    const dateNow = vi.spyOn(Date, 'now').mockReturnValue(123456)
    vi.mocked(getCurrentPolicy).mockResolvedValueOnce(null)
    vi.mocked(rename).mockResolvedValueOnce(undefined)
    const res = createResponse()

    await uploadPolicy(
      {
        body: { version: '4' },
        file: { path: 'temp.pdf' },
      } as never,
      res as never,
      createNext(),
    )

    expect(rename).toHaveBeenCalledWith(
      'temp.pdf',
      resolve('C:/tmp/policies', 'policy-v4-123456.pdf'),
    )
    expect(res.status).toHaveBeenCalledWith(500)
    dateNow.mockRestore()
  })

  it('moves the file, stores the policy, and logs access on success', async () => {
    const dateNow = vi.spyOn(Date, 'now').mockReturnValue(123456)
    vi.mocked(getCurrentPolicy).mockResolvedValueOnce({ version: 2 } as never)
    vi.mocked(rename).mockResolvedValueOnce(undefined)
    vi.mocked(uploadPolicyDocument).mockResolvedValueOnce({
      id: 'policy-3',
      version: 3,
      file_path: 'C:/tmp/policies/policy-v3-123456.pdf',
    } as never)
    vi.mocked(logAccess).mockResolvedValue({} as never)
    const res = createResponse()

    await uploadPolicy(
      {
        body: { version: '3' },
        file: { path: 'temp.pdf' },
        user: { id: 'admin-1' },
      } as never,
      res as never,
      createNext(),
    )

    expect(uploadPolicyDocument).toHaveBeenCalledWith(
      resolve('C:/tmp/policies', 'policy-v3-123456.pdf'),
      3,
      'admin-1',
    )
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith({
      version: 3,
      filePath: 'C:/tmp/policies/policy-v3-123456.pdf',
    })
    expect(logAccess).toHaveBeenCalledWith(
      'admin-1',
      CAPABILITIES['policy:write'],
      'policy-3',
    )
    dateNow.mockRestore()
  })

  it('returns 500 when policy upload fails', async () => {
    vi.mocked(getCurrentPolicy).mockResolvedValueOnce(null)
    vi.mocked(rename).mockRejectedValueOnce(new Error('fs failed'))
    const res = createResponse()

    await uploadPolicy(
      {
        body: { version: '4' },
        file: { path: 'temp.pdf' },
        user: { id: 'admin-1' },
      } as never,
      res as never,
      createNext(),
    )

    expect(res.status).toHaveBeenCalledWith(500)
  })
})
