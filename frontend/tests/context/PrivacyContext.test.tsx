import { cleanup, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

import { PrivacyProvider } from '../../context/PrivacyContext'
import { useAuth } from '../../context/AuthContext'
import { usePrivacyAck } from '../../hooks/usePrivacyAck'

afterEach(() => {
  cleanup()
})

function createWrapper() {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <PrivacyProvider>{children}</PrivacyProvider>
  }
}

describe('PrivacyContext', () => {
  it('requires the hook to be used inside a provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => renderHook(() => usePrivacyAck())).toThrow(
      'usePrivacy must be used within a PrivacyProvider',
    )

    consoleError.mockRestore()
  })

  it('marks acknowledgement as needed when there is no user', () => {
    const acknowledgePrivacy = vi.fn()
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      acknowledgePrivacy,
    } as never)

    const { result } = renderHook(() => usePrivacyAck(), {
      wrapper: createWrapper(),
    })

    expect(result.current.needsAcknowledgement).toBe(true)
    expect(result.current.currentVersion).toBe(1)
  })

  it('marks acknowledgement as needed when the user has an older version', () => {
    const acknowledgePrivacy = vi.fn()
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: 'user-1',
        role: 'student',
        privacyAckVersion: 0,
      },
      acknowledgePrivacy,
    } as never)

    const { result } = renderHook(() => usePrivacyAck(), {
      wrapper: createWrapper(),
    })

    expect(result.current.needsAcknowledgement).toBe(true)
  })

  it('marks acknowledgement as not needed when the user is up to date', () => {
    const acknowledgePrivacy = vi.fn()
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: 'user-1',
        role: 'student',
        privacyAckVersion: 1,
      },
      acknowledgePrivacy,
    } as never)

    const { result } = renderHook(() => usePrivacyAck(), {
      wrapper: createWrapper(),
    })

    expect(result.current.needsAcknowledgement).toBe(false)
  })

  it('delegates acknowledgement to the auth context with the current version', async () => {
    const acknowledgePrivacy = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: 'user-1',
        role: 'student',
        privacyAckVersion: 0,
      },
      acknowledgePrivacy,
    } as never)

    const { result } = renderHook(() => usePrivacyAck(), {
      wrapper: createWrapper(),
    })

    await expect(result.current.acknowledge()).resolves.toBeUndefined()
    expect(acknowledgePrivacy).toHaveBeenCalledWith(1)
  })
})
