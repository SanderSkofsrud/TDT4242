import type { ReactNode } from 'react'

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

const logoutMock = vi.fn()

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({
    logout: logoutMock,
  }),
}))

import { ConfirmDialog } from '../../../components/common/ConfirmDialog.tsx'
import { ErrorBoundary } from '../../../components/common/ErrorBoundary.tsx'
import { LoadingSpinner } from '../../../components/common/LoadingSpinner.tsx'
import { NavBar } from '../../../components/common/NavBar.tsx'
import { PrivacyBadge } from '../../../components/common/PrivacyBadge.tsx'

afterEach(() => {
  cleanup()
  logoutMock.mockReset()
  vi.restoreAllMocks()
})

describe('common components', () => {
  it('does not render ConfirmDialog when closed and focuses the confirm button when opened', async () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    const { rerender } = render(
      <ConfirmDialog
        isOpen={false}
        title="Confirm title"
        message="Confirm message"
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    )

    expect(screen.queryByRole('dialog')).toBeNull()

    rerender(
      <ConfirmDialog
        isOpen
        title="Confirm title"
        message="Confirm message"
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    )

    expect(screen.getByText('Confirm message')).toBeTruthy()
    await waitFor(() => {
      expect(document.activeElement?.textContent).toBe('Confirm')
    })

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))

    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('renders ErrorBoundary children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>safe child</div>
      </ErrorBoundary>,
    )

    expect(screen.getByText('safe child')).toBeTruthy()
  })

  it('renders the ErrorBoundary fallback after an error', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    function Boom() {
      throw new Error('boom')
    }

    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    )

    expect(
      screen.getByText('Something went wrong. Please refresh the page.'),
    ).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeTruthy()
    expect(consoleError).toHaveBeenCalled()
  })

  it('renders LoadingSpinner with and without a message', () => {
    const { rerender, container } = render(<LoadingSpinner />)

    expect(container.querySelector('.spinner')).not.toBeNull()
    expect(screen.queryByText('Loading data')).toBeNull()

    rerender(<LoadingSpinner message="Loading data" />)

    expect(screen.getByText('Loading data')).toBeTruthy()
  })

  it('renders NavBar links and calls logout when the button is clicked', () => {
    render(
      <MemoryRouter>
        <NavBar />
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: 'AI Guidebook' }).getAttribute('href')).toBe(
      '/dashboard',
    )
    expect(screen.getByRole('link', { name: 'Home' }).getAttribute('href')).toBe(
      '/dashboard',
    )
    expect(screen.getByRole('link', { name: 'Profile' }).getAttribute('href')).toBe(
      '/profile',
    )

    fireEvent.click(screen.getByRole('button', { name: 'Logout' }))

    expect(logoutMock).toHaveBeenCalledTimes(1)
  })

  it('renders PrivacyBadge with a link to sharing settings', () => {
    render(
      <MemoryRouter>
        <PrivacyBadge />
      </MemoryRouter>,
    )

    expect(
      screen.getByText(/Your AI usage data is private by default/i),
    ).toBeTruthy()
    expect(
      screen.getByRole('link', { name: 'Sharing settings' }).getAttribute('href'),
    ).toBe('/privacy')
  })
})
