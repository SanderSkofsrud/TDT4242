import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { GuidanceCard } from '../../../components/guidance/GuidanceCard.tsx'
import { GuidanceForm } from '../../../components/guidance/GuidanceForm.tsx'

afterEach(() => {
  cleanup()
})

describe('guidance components', () => {
  it('renders GuidanceCard with categories and examples', () => {
    render(
      <GuidanceCard
        guidance={{
          id: 'guidance-1',
          assignmentId: 'assignment-1',
          permittedText: 'Ask for explanations.',
          prohibitedText: 'Do not request final answers.',
          permittedCategories: ['explanation'],
          prohibitedCategories: ['code_assistance'],
          examples: {
            permitted: ['Explain a concept'],
            prohibited: ['Write the final solution'],
          },
          createdBy: 'instructor-1',
          lockedAt: null,
          createdAt: '2026-03-13T00:00:00.000Z',
        }}
      />,
    )

    expect(screen.getByText('Permitted categories: explanation')).toBeTruthy()
    expect(screen.getByText('Prohibited categories: code_assistance')).toBeTruthy()
    expect(screen.getByText('Permitted examples')).toBeTruthy()
    expect(screen.getByText('Write the final solution')).toBeTruthy()
  })

  it('renders GuidanceCard without optional categories or examples', () => {
    render(
      <GuidanceCard
        guidance={{
          id: 'guidance-2',
          assignmentId: 'assignment-1',
          permittedText: 'Use AI sparingly.',
          prohibitedText: 'Do not submit generated text.',
          permittedCategories: null,
          prohibitedCategories: null,
          examples: null,
          createdBy: 'instructor-1',
          lockedAt: null,
          createdAt: '2026-03-13T00:00:00.000Z',
        }}
      />,
    )

    expect(screen.getByText('Use AI sparingly.')).toBeTruthy()
    expect(screen.queryByText('Permitted examples')).toBeNull()
    expect(screen.queryByText(/Permitted categories:/)).toBeNull()
  })

  it('syncs GuidanceForm state from incoming initial values', () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const { rerender } = render(
      <GuidanceForm
        initialValues={{
          id: 'guidance-1',
          assignmentId: 'assignment-1',
          permittedText: 'Start here',
          prohibitedText: 'Avoid this',
          permittedCategories: ['explanation'],
          prohibitedCategories: ['code_assistance'],
          examples: {
            permitted: ['Explain a concept'],
            prohibited: ['Generate code'],
          },
          createdBy: 'instructor-1',
          lockedAt: null,
          createdAt: '2026-03-13T00:00:00.000Z',
        }}
        onSave={onSave}
        isSaving={false}
      />,
    )

    expect(
      (screen.getByLabelText('Permitted use') as HTMLTextAreaElement).value,
    ).toBe('Start here')
    expect(
      (screen.getByLabelText('Prohibited use') as HTMLTextAreaElement).value,
    ).toBe('Avoid this')
    expect(
      (screen.getAllByRole('checkbox', { name: 'Explanation' })[0] as HTMLInputElement)
        .checked,
    ).toBe(true)

    rerender(
      <GuidanceForm
        initialValues={{
          id: 'guidance-2',
          assignmentId: 'assignment-1',
          permittedText: 'Updated permitted text',
          prohibitedText: 'Updated prohibited text',
          permittedCategories: ['structure'],
          prohibitedCategories: ['rephrasing'],
          examples: {
            permitted: ['Outline the answer'],
            prohibited: ['Rewrite the final text'],
          },
          createdBy: 'instructor-1',
          lockedAt: null,
          createdAt: '2026-03-13T00:00:00.000Z',
        }}
        onSave={onSave}
        isSaving={false}
      />,
    )

    expect(
      (screen.getByLabelText('Permitted use') as HTMLTextAreaElement).value,
    ).toBe(
      'Updated permitted text',
    )
    expect(
      (screen.getByLabelText('Prohibited use') as HTMLTextAreaElement).value,
    ).toBe(
      'Updated prohibited text',
    )
    expect(
      (screen.getAllByRole('checkbox', { name: 'Structure' })[0] as HTMLInputElement)
        .checked,
    ).toBe(true)
    expect(
      (screen.getAllByRole('checkbox', { name: 'Rephrasing' })[1] as HTMLInputElement)
        .checked,
    ).toBe(true)
  })

  it('adds, removes, toggles, and submits GuidanceForm values', () => {
    const onSave = vi.fn().mockResolvedValue(undefined)

    render(<GuidanceForm onSave={onSave} isSaving={false} />)

    fireEvent.change(screen.getByLabelText('Permitted use'), {
      target: { value: 'Explain concepts only.' },
    })
    fireEvent.change(screen.getByLabelText('Prohibited use'), {
      target: { value: 'Do not solve the assignment.' },
    })

    fireEvent.click(screen.getAllByRole('checkbox', { name: 'Explanation' })[0])
    fireEvent.click(screen.getAllByRole('checkbox', { name: 'Code Assistance' })[1])

    const addButtons = screen.getAllByRole('button', { name: 'Add example' })
    fireEvent.click(addButtons[0])
    fireEvent.click(addButtons[0])
    fireEvent.click(addButtons[1])

    let textboxes = screen.getAllByRole('textbox')
    fireEvent.change(textboxes[2], {
      target: { value: '' },
    })
    fireEvent.change(textboxes[3], {
      target: { value: 'Ask the AI to explain lecture material.' },
    })
    fireEvent.change(textboxes[4], {
      target: { value: 'Ask the AI to generate the final code.' },
    })

    fireEvent.click(screen.getAllByRole('button', { name: 'Remove' })[0])

    textboxes = screen.getAllByRole('textbox')
    expect((textboxes[2] as HTMLInputElement).value).toBe(
      'Ask the AI to explain lecture material.',
    )

    fireEvent.click(screen.getByRole('button', { name: 'Save guidance' }))

    expect(onSave).toHaveBeenCalledWith({
      permittedText: 'Explain concepts only.',
      prohibitedText: 'Do not solve the assignment.',
      permittedCategories: ['explanation'],
      prohibitedCategories: ['code_assistance'],
      examples: {
        permitted: ['Ask the AI to explain lecture material.'],
        prohibited: ['Ask the AI to generate the final code.'],
      },
    })
  })

  it('shows the saving label when GuidanceForm is submitting', () => {
    render(
      <GuidanceForm
        onSave={vi.fn().mockResolvedValue(undefined)}
        isSaving
      />,
    )

    expect(screen.getByRole('button', { name: /Saving/i })).toBeTruthy()
  })
})
