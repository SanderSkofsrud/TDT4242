import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { createDeferred } from '../helpers/async.ts'

interface AuthSnapshot {
  user: { id: string; role: string; privacyAckVersion: number } | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  acknowledgePrivacy: (version: number) => Promise<void>
}

function createToken(payload: Record<string, unknown>) {
  const encode = (value: Record<string, unknown>) =>
    Buffer.from(JSON.stringify(value)).toString('base64url')

  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(payload)}.signature`
}

async function loadAuthContextModule() {
  vi.resetModules()

  const login = vi.fn()
  const acknowledgePrivacyNotice = vi.fn()
  const registerUnauthorisedHandler = vi.fn()
  const setAuthToken = vi.fn()

  vi.doMock('../../services/userService', () => ({
    login,
    acknowledgePrivacyNotice,
  }))

  vi.doMock('../../services/api', () => ({
    registerUnauthorisedHandler,
    setAuthToken,
  }))

  const module = await import('../../context/AuthContext.tsx')

  return {
    ...module,
    acknowledgePrivacyNotice,
    login,
    registerUnauthorisedHandler,
    setAuthToken,
  }
}

function renderAuthProvider(
  module: Awaited<ReturnType<typeof loadAuthContextModule>>,
) {
  let current: AuthSnapshot | undefined
  const AuthProvider = module.AuthProvider

  function Consumer() {
    current = module.useAuth()

    return (
      <>
        <div data-testid="user">
          {current.user
            ? `${current.user.id}:${current.user.role}:${current.user.privacyAckVersion}`
            : 'none'}
        </div>
        <div data-testid="token">{current.token ?? 'none'}</div>
        <div data-testid="loading">{String(current.isLoading)}</div>
      </>
    )
  }

  render(
    <AuthProvider>
      <Consumer />
    </AuthProvider>,
  )

  return {
    getCurrent() {
      if (!current) {
        throw new Error('Auth context was not initialised')
      }

      return current
    },
  }
}

afterEach(() => {
  cleanup()
  window.localStorage.clear()
  document.cookie = 'authToken=; Max-Age=0; path=/'
  vi.restoreAllMocks()
  vi.resetModules()
})

describe('AuthContext', () => {
  it('throws when useAuth is used outside the provider', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const module = await loadAuthContextModule()

    function Consumer() {
      module.useAuth()
      return null
    }

    expect(() => render(<Consumer />)).toThrow(
      'useAuth must be used within an AuthProvider',
    )
    expect(consoleError).toHaveBeenCalled()
  })

  it('hydrates a valid token from localStorage and registers the unauthorised handler', async () => {
    const storedToken = createToken({
      sub: 'student-1',
      role: 'student',
      privacyAckVersion: 2,
      exp: Math.floor(Date.now() / 1000) + 3_600,
    })
    window.localStorage.setItem('authToken', storedToken)

    const module = await loadAuthContextModule()
    const { getCurrent } = renderAuthProvider(module)

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('student-1:student:2')
    })

    expect(screen.getByTestId('token').textContent).toBe(storedToken)
    expect(module.setAuthToken).toHaveBeenCalledWith(storedToken)
    expect(module.registerUnauthorisedHandler).toHaveBeenCalledTimes(1)

    const unauthorisedHandler = module.registerUnauthorisedHandler.mock.calls[0]?.[0] as
      | (() => void)
      | undefined

    expect(unauthorisedHandler).toBeTypeOf('function')

    act(() => {
      unauthorisedHandler?.()
    })

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('none')
    })

    expect(getCurrent().token).toBeNull()
    expect(module.setAuthToken).toHaveBeenCalledWith(null)
  })

  it('removes malformed stored tokens during startup', async () => {
    const malformedToken = createToken({
      sub: 'student-1',
      exp: Math.floor(Date.now() / 1000) + 3_600,
    })
    window.localStorage.setItem('authToken', malformedToken)

    const module = await loadAuthContextModule()
    renderAuthProvider(module)

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('none')
    })

    expect(window.localStorage.getItem('authToken')).toBeNull()
  })

  it('removes expired stored tokens during startup', async () => {
    const expiredToken = createToken({
      sub: 'student-1',
      role: 'student',
      privacyAckVersion: 2,
      exp: Math.floor(Date.now() / 1000) - 60,
    })
    window.localStorage.setItem('authToken', expiredToken)

    const module = await loadAuthContextModule()
    renderAuthProvider(module)

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('none')
    })

    expect(window.localStorage.getItem('authToken')).toBeNull()
  })

  it('logs in, persists the token, and stores the decoded user', async () => {
    const freshToken = createToken({
      sub: 'student-2',
      role: 'student',
      privacyAckVersion: 4,
      exp: Math.floor(Date.now() / 1000) + 3_600,
    })

    const module = await loadAuthContextModule()
    module.login.mockResolvedValueOnce({ token: freshToken })

    const { getCurrent } = renderAuthProvider(module)

    await act(async () => {
      await getCurrent().login('student@example.com', 'secret')
    })

    expect(module.login).toHaveBeenCalledWith('student@example.com', 'secret')
    expect(screen.getByTestId('user').textContent).toBe('student-2:student:4')
    expect(screen.getByTestId('token').textContent).toBe(freshToken)
    expect(window.localStorage.getItem('authToken')).toBe(freshToken)
    expect(document.cookie).toContain(`authToken=${freshToken}`)
    expect(module.setAuthToken).toHaveBeenCalledWith(freshToken)
  })

  it('sets and clears the loading flag when login fails', async () => {
    const deferred = createDeferred<{ token: string }>()
    const module = await loadAuthContextModule()
    module.login.mockReturnValueOnce(deferred.promise)

    const { getCurrent } = renderAuthProvider(module)

    act(() => {
      void getCurrent().login('student@example.com', 'secret').catch(() => {})
    })

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('true')
    })

    deferred.reject(new Error('Invalid credentials'))

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false')
    })

    expect(screen.getByTestId('user').textContent).toBe('none')
  })

  it('logs out and clears the current auth state', async () => {
    const storedToken = createToken({
      sub: 'student-1',
      role: 'student',
      privacyAckVersion: 2,
      exp: Math.floor(Date.now() / 1000) + 3_600,
    })
    window.localStorage.setItem('authToken', storedToken)

    const module = await loadAuthContextModule()
    const { getCurrent } = renderAuthProvider(module)

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('student-1:student:2')
    })

    act(() => {
      getCurrent().logout()
    })

    expect(screen.getByTestId('user').textContent).toBe('none')
    expect(screen.getByTestId('token').textContent).toBe('none')
    expect(window.localStorage.getItem('authToken')).toBeNull()
    expect(document.cookie).not.toContain(storedToken)
    expect(module.setAuthToken).toHaveBeenCalledWith(null)
  })

  it('acknowledges the privacy notice and updates the in-memory user version', async () => {
    const storedToken = createToken({
      sub: 'student-1',
      role: 'student',
      privacyAckVersion: 2,
      exp: Math.floor(Date.now() / 1000) + 3_600,
    })
    window.localStorage.setItem('authToken', storedToken)

    const module = await loadAuthContextModule()
    const { getCurrent } = renderAuthProvider(module)

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('student-1:student:2')
    })

    module.acknowledgePrivacyNotice.mockResolvedValueOnce(undefined)

    await act(async () => {
      await getCurrent().acknowledgePrivacy(5)
    })

    expect(module.acknowledgePrivacyNotice).toHaveBeenCalledWith(5)
    expect(screen.getByTestId('user').textContent).toBe('student-1:student:5')
  })
})
