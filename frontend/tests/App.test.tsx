import type { ReactNode } from 'react'

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

async function loadApp() {
  vi.resetModules()

  vi.doMock('react-router-dom', () => ({
    BrowserRouter: ({ children }: { children: ReactNode }) => (
      <div data-testid="browser-router">{children}</div>
    ),
  }))

  vi.doMock('../context/AuthContext', () => ({
    AuthProvider: ({ children }: { children: ReactNode }) => (
      <div data-testid="auth-provider">{children}</div>
    ),
  }))

  vi.doMock('../context/PrivacyContext', () => ({
    PrivacyProvider: ({ children }: { children: ReactNode }) => (
      <div data-testid="privacy-provider">{children}</div>
    ),
  }))

  vi.doMock('../components/common/ErrorBoundary', () => ({
    ErrorBoundary: ({ children }: { children: ReactNode }) => (
      <div data-testid="error-boundary">{children}</div>
    ),
  }))

  vi.doMock('../router', () => ({
    AppRouter: () => <div data-testid="app-router">router</div>,
  }))

  return import('../App.tsx')
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.resetModules()
})

describe('App', () => {
  it('wraps the router with the error boundary, browser router, and providers', async () => {
    const { default: App } = await loadApp()

    render(<App />)

    expect(screen.getByTestId('error-boundary')).toBeTruthy()
    expect(screen.getByTestId('browser-router')).toBeTruthy()
    expect(screen.getByTestId('auth-provider')).toBeTruthy()
    expect(screen.getByTestId('privacy-provider')).toBeTruthy()
    expect(screen.getByTestId('app-router').textContent).toBe('router')
  })
})
