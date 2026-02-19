import { createContext, useContext, useMemo } from 'react'

import { useAuth } from './AuthContext'

interface PrivacyContextValue {
  needsAcknowledgement: boolean
  currentVersion: number
  acknowledge: () => Promise<void>
}

const PrivacyContext = createContext<PrivacyContextValue | undefined>(
  undefined,
)

const PRIVACY_NOTICE_VERSION =
  Number.parseInt(import.meta.env.VITE_PRIVACY_NOTICE_VERSION ?? '1', 10) || 1

export function PrivacyProvider({ children }: { children: React.ReactNode }) {
  const { user, acknowledgePrivacy } = useAuth()

  const needsAcknowledgement =
    !!user && (user.privacyAckVersion ?? 0) < PRIVACY_NOTICE_VERSION

  const value: PrivacyContextValue = useMemo(
    () => ({
      needsAcknowledgement,
      currentVersion: PRIVACY_NOTICE_VERSION,
      acknowledge: () => acknowledgePrivacy(PRIVACY_NOTICE_VERSION),
    }),
    [needsAcknowledgement, acknowledgePrivacy],
  )

  return (
    <PrivacyContext.Provider value={value}>{children}</PrivacyContext.Provider>
  )
}

export function usePrivacy(): PrivacyContextValue {
  const ctx = useContext(PrivacyContext)
  if (!ctx) {
    throw new Error('usePrivacy must be used within a PrivacyProvider')
  }
  return ctx
}

// Acknowledgement state, sharing preferences
