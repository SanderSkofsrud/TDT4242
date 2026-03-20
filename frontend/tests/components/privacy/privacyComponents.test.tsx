import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { SharingStatus } from '../../../components/privacy/SharingStatus.tsx'

afterEach(() => {
  cleanup()
})

describe('privacy components', () => {
  it('renders the empty SharingStatus state', () => {
    render(
      <SharingStatus
        preferences={[]}
        onRevoke={vi.fn()}
        onReinstate={vi.fn()}
      />,
    )

    expect(
      screen.getByText(
        'You have no course enrolments with sharing preferences.',
      ),
    ).toBeTruthy()
  })

  it('renders shared and private rows and supports revoke and reinstate actions', () => {
    const onRevoke = vi.fn()
    const onReinstate = vi.fn()

    render(
      <SharingStatus
        preferences={[
          {
            studentId: 'student-1',
            courseId: 'course-1',
            courseCode: 'TDT4242',
            courseName: 'Software Engineering',
            isShared: true,
            updatedAt: '2026-03-13T00:00:00.000Z',
          },
          {
            studentId: 'student-1',
            courseId: 'course-2',
            courseCode: 'TMA4100',
            courseName: 'Calculus',
            isShared: false,
            updatedAt: '2026-03-13T00:00:00.000Z',
          },
        ]}
        onRevoke={onRevoke}
        onReinstate={onReinstate}
      />,
    )

    expect(screen.getByText(/TDT4242/i)).toBeTruthy()
    expect(screen.getByText(/TMA4100/i)).toBeTruthy()
    expect(screen.getByText('Shared')).toBeTruthy()
    expect(screen.getByText('Private')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Share Access' }))
    expect(onReinstate).toHaveBeenCalledWith('course-2')

    fireEvent.click(screen.getByRole('button', { name: 'Revoke Access' }))
    expect(screen.getByText('Revoke access')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByText('Revoke access')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Revoke Access' }))
    fireEvent.click(screen.getAllByRole('button', { name: 'Revoke Access' })[1])

    expect(onRevoke).toHaveBeenCalledWith('course-1')
    expect(screen.queryByText('Revoke access')).toBeNull()
  })
})
