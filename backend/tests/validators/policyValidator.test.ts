import { describe, expect, it } from 'vitest'

import { policyValidator } from '../../validators/policyValidator.ts'
import { getValidationMessages } from '../helpers/validation.ts'

describe('policyValidator', () => {
  it('accepts a positive integer version', async () => {
    await expect(
      getValidationMessages(policyValidator, { version: 2 }),
    ).resolves.toEqual([])
  })

  it('requires version to be present', async () => {
    const errors = await getValidationMessages(policyValidator, {
      version: undefined,
    })

    expect(errors).toContain('version is required')
  })

  it('treats zero as missing because checkFalsy is enabled', async () => {
    const zeroErrors = await getValidationMessages(policyValidator, {
      version: 0,
    })

    expect(zeroErrors).toContain('version is required')
  })

  it('rejects non-integer positive versions', async () => {
    const decimalErrors = await getValidationMessages(policyValidator, {
      version: 1.5,
    })

    expect(decimalErrors).toContain('version must be an integer greater than 0')
  })
})
