import { describe, expect, it } from 'vitest'

import { guidanceValidator } from '../../validators/guidanceValidator.ts'
import { getValidationMessages } from '../helpers/validation.ts'

const validBody = {
  permittedText: 'You may use AI to explain concepts.',
  prohibitedText: 'Do not submit AI-generated final answers.',
  permittedCategories: ['explanation', 'structure'],
  prohibitedCategories: ['code_assistance'],
  examples: {
    permitted: ['Explain time complexity.'],
    prohibited: ['Write the full assignment for me.'],
  },
}

describe('guidanceValidator', () => {
  it('accepts a valid payload', async () => {
    await expect(
      getValidationMessages(guidanceValidator, validBody),
    ).resolves.toEqual([])
  })

  it('requires permittedText and prohibitedText', async () => {
    const permittedErrors = await getValidationMessages(guidanceValidator, {
      ...validBody,
      permittedText: '',
    })
    const prohibitedErrors = await getValidationMessages(guidanceValidator, {
      ...validBody,
      prohibitedText: '',
    })

    expect(permittedErrors).toContain('permittedText is required')
    expect(prohibitedErrors).toContain('prohibitedText is required')
  })

  it('rejects text fields that exceed the maximum length', async () => {
    const permittedErrors = await getValidationMessages(guidanceValidator, {
      ...validBody,
      permittedText: 'x'.repeat(2001),
    })
    const prohibitedErrors = await getValidationMessages(guidanceValidator, {
      ...validBody,
      prohibitedText: 'x'.repeat(2001),
    })

    expect(permittedErrors).toContain(
      'permittedText must be at most 2000 characters',
    )
    expect(prohibitedErrors).toContain(
      'prohibitedText must be at most 2000 characters',
    )
  })

  it('rejects invalid permittedCategories input', async () => {
    const tooManyErrors = await getValidationMessages(guidanceValidator, {
      ...validBody,
      permittedCategories: [
        'explanation',
        'structure',
        'rephrasing',
        'code_assistance',
        'extra',
      ],
    })
    const invalidMemberErrors = await getValidationMessages(guidanceValidator, {
      ...validBody,
      permittedCategories: ['explanation', 'invalid'],
    })

    expect(tooManyErrors).toContain(
      'permittedCategories must be an array with at most 4 items',
    )
    expect(invalidMemberErrors).toContain(
      'permittedCategories must contain only explanation, structure, rephrasing, or code_assistance',
    )
  })

  it('rejects invalid prohibitedCategories input', async () => {
    const tooManyErrors = await getValidationMessages(guidanceValidator, {
      ...validBody,
      prohibitedCategories: [
        'explanation',
        'structure',
        'rephrasing',
        'code_assistance',
        'extra',
      ],
    })
    const invalidMemberErrors = await getValidationMessages(guidanceValidator, {
      ...validBody,
      prohibitedCategories: ['code_assistance', 'invalid'],
    })

    expect(tooManyErrors).toContain(
      'prohibitedCategories must be an array with at most 4 items',
    )
    expect(invalidMemberErrors).toContain(
      'prohibitedCategories must contain only explanation, structure, rephrasing, or code_assistance',
    )
  })

  it('rejects overlapping permitted and prohibited categories', async () => {
    const errors = await getValidationMessages(guidanceValidator, {
      ...validBody,
      permittedCategories: ['explanation', 'structure'],
      prohibitedCategories: ['structure'],
    })

    expect(errors).toContain(
      'Categories cannot be both permitted and prohibited',
    )
  })

  it('tolerates malformed permittedCategories while validating prohibitedCategories', async () => {
    const errors = await getValidationMessages(guidanceValidator, {
      ...validBody,
      permittedCategories: 'invalid',
      prohibitedCategories: ['structure'],
    })

    expect(errors).toContain(
      'permittedCategories must be an array with at most 4 items',
    )
    expect(errors).not.toContain(
      'Categories cannot be both permitted and prohibited',
    )
  })

  it('rejects invalid examples containers and permitted examples', async () => {
    const objectErrors = await getValidationMessages(guidanceValidator, {
      ...validBody,
      examples: 'invalid',
    })
    const tooManyErrors = await getValidationMessages(guidanceValidator, {
      ...validBody,
      examples: {
        permitted: new Array(11).fill('Explain the algorithm.'),
      },
    })
    const invalidItemErrors = await getValidationMessages(guidanceValidator, {
      ...validBody,
      examples: {
        permitted: ['x'.repeat(501)],
      },
    })

    expect(objectErrors).toContain('examples must be an object')
    expect(tooManyErrors).toContain(
      'examples.permitted must be an array with at most 10 items',
    )
    expect(invalidItemErrors).toContain(
      'Each examples.permitted item must be a string of at most 500 characters',
    )
  })

  it('rejects invalid prohibited examples and accepts optional collections', async () => {
    const tooManyErrors = await getValidationMessages(guidanceValidator, {
      ...validBody,
      examples: {
        prohibited: new Array(11).fill('Write the whole answer.'),
      },
    })
    const invalidItemErrors = await getValidationMessages(guidanceValidator, {
      ...validBody,
      examples: {
        prohibited: [123],
      },
    })
    const optionalErrors = await getValidationMessages(guidanceValidator, {
      permittedText: validBody.permittedText,
      prohibitedText: validBody.prohibitedText,
    })

    expect(tooManyErrors).toContain(
      'examples.prohibited must be an array with at most 10 items',
    )
    expect(invalidItemErrors).toContain(
      'Each examples.prohibited item must be a string of at most 500 characters',
    )
    expect(optionalErrors).toEqual([])
  })
})
