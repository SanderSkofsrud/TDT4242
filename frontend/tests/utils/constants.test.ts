import { describe, expect, it } from 'vitest'

import {
  AI_CATEGORIES,
  CATEGORY_GLOSSARY,
  FREQUENCY_OPTIONS,
} from '../../utils/constants.ts'

describe('constants', () => {
  it('defines the supported AI categories and glossary entries', () => {
    expect(AI_CATEGORIES.map((category) => category.value)).toEqual([
      'explanation',
      'structure',
      'rephrasing',
      'code_assistance',
    ])
    expect(CATEGORY_GLOSSARY.explanation).toContain('The AI acts as a tutor')
    expect(CATEGORY_GLOSSARY.code_assistance).toContain('programming work')
  })

  it('defines the supported frequency options', () => {
    expect(FREQUENCY_OPTIONS).toEqual([
      { value: 'none', label: 'None' },
      { value: 'light', label: 'Light' },
      { value: 'moderate', label: 'Moderate' },
      { value: 'extensive', label: 'Extensive' },
    ])
  })
})
