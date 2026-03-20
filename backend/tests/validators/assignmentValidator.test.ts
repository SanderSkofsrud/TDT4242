import { describe, expect, it } from 'vitest'

import { createAssignmentValidator } from '../../validators/assignmentValidator.ts'
import { getValidationMessages } from '../helpers/validation.ts'

const validBody = {
  title: 'Final project report',
  dueDate: '2026-06-01',
}

describe('createAssignmentValidator', () => {
  it('accepts a valid assignment payload', async () => {
    await expect(
      getValidationMessages(createAssignmentValidator, validBody),
    ).resolves.toEqual([])
  })

  it('requires a title', async () => {
    const errors = await getValidationMessages(createAssignmentValidator, {
      ...validBody,
      title: '',
    })

    expect(errors).toContain('title is required')
  })

  it('rejects non-string titles', async () => {
    const errors = await getValidationMessages(createAssignmentValidator, {
      ...validBody,
      title: 42,
    })

    expect(errors).toContain('title must be a string')
  })

  it('rejects blank and overlong titles after trimming', async () => {
    const blankErrors = await getValidationMessages(createAssignmentValidator, {
      ...validBody,
      title: '   ',
    })
    const longErrors = await getValidationMessages(createAssignmentValidator, {
      ...validBody,
      title: 'x'.repeat(256),
    })

    expect(blankErrors).toContain('title must be between 1 and 255 characters')
    expect(longErrors).toContain('title must be between 1 and 255 characters')
  })

  it('requires dueDate and enforces strict ISO date input', async () => {
    const missingErrors = await getValidationMessages(createAssignmentValidator, {
      ...validBody,
      dueDate: undefined,
    })
    const invalidErrors = await getValidationMessages(createAssignmentValidator, {
      ...validBody,
      dueDate: '2026/06/01',
    })

    expect(missingErrors).toContain('dueDate is required')
    expect(invalidErrors).toContain(
      'dueDate must be a valid ISO 8601 date (YYYY-MM-DD)',
    )
  })
})
