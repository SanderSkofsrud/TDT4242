import { validationResult } from 'express-validator'
import { describe, expect, it } from 'vitest'

import { declarationValidator } from '../../validators/declarationValidator.ts'

const validBody = {
  assignmentId: '3d594650-3436-4bc0-9803-eb2c3f5a0b2b',
  toolsUsed: ['ChatGPT', 'Copilot'],
  categories: ['explanation', 'code_assistance'],
  frequency: 'moderate',
  contextText: 'Used for brainstorming a solution outline.',
}

async function getValidationMessages(body: Record<string, unknown>): Promise<string[]> {
  const req = { body }

  for (const validator of declarationValidator) {
    await validator.run(req as never)
  }

  return validationResult(req as never)
    .array()
    .map((error) => String(error.msg))
}

describe('declarationValidator', () => {
  it('accepts a valid payload', async () => {
    await expect(getValidationMessages(validBody)).resolves.toEqual([])
  })

  it('requires assignmentId', async () => {
    const errors = await getValidationMessages({
      ...validBody,
      assignmentId: '',
    })

    expect(errors).toContain('assignmentId is required')
  })

  it('rejects an invalid assignmentId UUID', async () => {
    const errors = await getValidationMessages({
      ...validBody,
      assignmentId: 'not-a-uuid',
    })

    expect(errors).toContain('assignmentId must be a valid UUID')
  })

  it('requires toolsUsed', async () => {
    const errors = await getValidationMessages({
      ...validBody,
      toolsUsed: undefined,
    })

    expect(errors).toContain('toolsUsed is required')
  })

  it('rejects toolsUsed arrays outside the allowed size range', async () => {
    const errors = await getValidationMessages({
      ...validBody,
      toolsUsed: new Array(21).fill('ChatGPT'),
    })

    expect(errors).toContain(
      'toolsUsed must be a non-empty array with at most 20 items',
    )
  })

  it('rejects toolsUsed entries that are blank strings', async () => {
    const errors = await getValidationMessages({
      ...validBody,
      toolsUsed: ['ChatGPT', '   '],
    })

    expect(errors).toContain('Each toolsUsed item must be a non-empty string')
  })

  it('requires categories', async () => {
    const errors = await getValidationMessages({
      ...validBody,
      categories: undefined,
    })

    expect(errors).toContain('categories is required')
  })

  it('rejects categories outside the allowed list', async () => {
    const errors = await getValidationMessages({
      ...validBody,
      categories: ['structure', 'unsupported'],
    })

    expect(errors).toContain(
      'categories must contain only explanation, structure, rephrasing, or code_assistance',
    )
  })

  it('requires frequency to be present and valid', async () => {
    const missingErrors = await getValidationMessages({
      ...validBody,
      frequency: undefined,
    })
    const invalidErrors = await getValidationMessages({
      ...validBody,
      frequency: 'heavy',
    })

    expect(missingErrors).toContain('frequency is required')
    expect(invalidErrors).toContain(
      'frequency must be one of none, light, moderate, extensive',
    )
  })

  it('validates contextText when provided', async () => {
    const wrongTypeErrors = await getValidationMessages({
      ...validBody,
      contextText: 42,
    })
    const tooLongErrors = await getValidationMessages({
      ...validBody,
      contextText: 'x'.repeat(501),
    })
    const optionalErrors = await getValidationMessages({
      ...validBody,
      contextText: undefined,
    })

    expect(wrongTypeErrors).toContain('contextText must be a string')
    expect(tooLongErrors).toContain(
      'contextText must be at most 500 characters',
    )
    expect(optionalErrors).toEqual([])
  })
})
