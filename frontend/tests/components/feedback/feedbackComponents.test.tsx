import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { FeedbackView } from '../../../components/feedback/FeedbackView.tsx'
import { PolicyReference } from '../../../components/feedback/PolicyReference.tsx'

afterEach(() => {
  cleanup()
})

describe('feedback components', () => {
  it('renders FeedbackView with guidance, templates, mismatches, and the policy link', () => {
    render(
      <FeedbackView
        feedback={{
          declarationId: 'declaration-1',
          categories: ['explanation', 'structure'],
          frequency: 'moderate',
          guidance: {
            permittedText: 'Explain concepts only.',
            prohibitedText: 'Do not produce final answers.',
            permittedCategories: ['explanation'],
            prohibitedCategories: ['code_assistance'],
            examples: null,
          },
          mismatches: [
            {
              category: 'structure',
              message: 'Structure is not explicitly permitted.',
            },
          ],
          feedbackTemplates: [
            {
              category: null,
              triggerCondition: 'always',
              templateText: 'Reflect on whether the AI support stayed within the assignment rules.',
            },
          ],
          policyVersion: 3,
          policyFilePath: '/policy/v3.pdf',
        }}
      />,
    )

    expect(screen.getByText('Your declaration')).toBeTruthy()
    expect(screen.getByText(/explanation, structure/i)).toBeTruthy()
    expect(screen.getByText('Permitted use')).toBeTruthy()
    expect(screen.getByText('Things to consider')).toBeTruthy()
    expect(screen.getByText('Potential mismatches')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'View Policy Document (Version 3)' })).toBeTruthy()
  })

  it('renders FeedbackView without optional sections when no guidance or templates are present', () => {
    render(
      <FeedbackView
        feedback={{
          declarationId: 'declaration-2',
          categories: ['rephrasing'],
          frequency: 'light',
          guidance: null,
          mismatches: [],
          feedbackTemplates: [],
          policyVersion: 1,
          policyFilePath: 'https://example.com/policy.pdf',
        }}
      />,
    )

    expect(screen.getByText(/rephrasing/i)).toBeTruthy()
    expect(screen.queryByText('Permitted use')).toBeNull()
    expect(screen.queryByText('Things to consider')).toBeNull()
    expect(screen.queryByText('Potential mismatches')).toBeNull()
  })

  it('builds relative and absolute policy document links correctly', () => {
    const { rerender } = render(
      <PolicyReference version={2} filePath="/policy/v2.pdf" />,
    )

    expect(
      screen
        .getByRole('link', { name: 'View Policy Document (Version 2)' })
        .getAttribute('href'),
    ).toBe('/policy/v2.pdf')

    rerender(
      <PolicyReference version={5} filePath="https://cdn.example.com/policy.pdf" />,
    )

    expect(
      screen
        .getByRole('link', { name: 'View Policy Document (Version 5)' })
        .getAttribute('href'),
    ).toBe('https://cdn.example.com/policy.pdf')
  })
})
