import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { CategorySelector } from '../../../components/declaration/CategorySelector.tsx'
import { ConfirmationModal } from '../../../components/declaration/ConfirmationModal.tsx'
import { FreeTextContext } from '../../../components/declaration/FreeTextContext.tsx'
import { FrequencySelector } from '../../../components/declaration/FrequencySelector.tsx'
import { ToolSelector } from '../../../components/declaration/ToolSelector.tsx'

afterEach(() => {
  cleanup()
})

describe('declaration components', () => {
  it('toggles categories in CategorySelector', () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <CategorySelector value={[]} onChange={onChange} />,
    )

    fireEvent.click(screen.getByRole('checkbox', { name: /Explanation/i }))
    expect(onChange).toHaveBeenCalledWith(['explanation'])

    rerender(<CategorySelector value={['explanation']} onChange={onChange} />)

    fireEvent.click(screen.getByRole('checkbox', { name: /Explanation/i }))
    expect(onChange).toHaveBeenLastCalledWith([])
    expect(screen.getByText('Code Assistance')).toBeTruthy()
  })

  it('renders ConfirmationModal with the expected labels and callbacks', () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()

    render(
      <ConfirmationModal
        isOpen
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    )

    expect(
      screen.getByRole('heading', { name: 'Submit Declaration' }),
    ).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Go Back and Review' }))
    fireEvent.click(screen.getByRole('button', { name: 'Submit Declaration' }))

    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('updates FreeTextContext text and remaining characters', () => {
    const onChange = vi.fn()

    render(<FreeTextContext value="Hello" onChange={onChange} />)

    expect(screen.getByText('495 characters remaining')).toBeTruthy()

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'Updated context' },
    })

    expect(onChange).toHaveBeenCalledWith('Updated context')
  })

  it('selects the frequency in FrequencySelector', () => {
    const onChange = vi.fn()

    render(<FrequencySelector value="light" onChange={onChange} />)

    fireEvent.click(screen.getByRole('radio', { name: 'Moderate' }))

    expect(onChange).toHaveBeenCalledWith('moderate')
  })

  it('toggles tools in ToolSelector', () => {
    const onChange = vi.fn()
    const { rerender } = render(<ToolSelector value={[]} onChange={onChange} />)

    fireEvent.click(screen.getByRole('checkbox', { name: 'ChatGPT' }))
    expect(onChange).toHaveBeenCalledWith(['ChatGPT'])

    rerender(<ToolSelector value={['ChatGPT']} onChange={onChange} />)

    fireEvent.click(screen.getByRole('checkbox', { name: 'ChatGPT' }))
    expect(onChange).toHaveBeenLastCalledWith([])
    expect(screen.getByText('GitHub Copilot')).toBeTruthy()
  })
})
