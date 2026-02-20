import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import type { User } from '../types/models'
import { login as loginService, acknowledgePrivacyNotice } from '../services/userService'
import { registerUnauthorisedHandler, setAuthToken } from '../services/api'

interface AuthContextValue {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  acknowledgePrivacy: (version: number) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

let initialToken: string | null = null

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setTokenState] = useState<string | null>(initialToken)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Token is kept in memory only. On full page refresh, the user must log in
    // again; this is an intentional privacy trade-off.
    if (token) {
      setAuthToken(token)
    }
  }, [token])

  useEffect(() => {
    registerUnauthorisedHandler(() => {
      setUser(null)
      setTokenState(null)
      setAuthToken(null)
      initialToken = null
    })
  }, [])

  const decodeToken = (jwt: string): {
    sub?: string
    role?: User['role']
    privacyAckVersion?: number
  } => {
    try {
      const [, payload] = jwt.split('.')
      const decoded = JSON.parse(atob(payload))
      return decoded
    } catch {
      return {}
    }
  }

  const login = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true)
      try {
        const { token: newToken } = await loginService(email, password)
        setTokenState(newToken)
        setAuthToken(newToken)
        initialToken = newToken

        const payload = decodeToken(newToken)
        if (!payload.sub || !payload.role || payload.privacyAckVersion == null) {
          throw new Error('Invalid token payload')
        }

        // email is not included in the JWT payload to minimise token size.
        // If a component needs to display the user's email, a /api/auth/me
        // endpoint should be added to the backend in a future iteration.
        const authUser: User = {
          id: payload.sub,
          role: payload.role,
          privacyAckVersion: payload.privacyAckVersion,
        }
        setUser(authUser)
      } finally {
        setIsLoading(false)
      }
    },
    [],
  )

  const logout = useCallback(() => {
    setTokenState(null)
    setAuthToken(null)
    initialToken = null
    setUser(null)
  }, [])

  const acknowledgePrivacy = useCallback(
    async (version: number) => {
      if (!user) return
      await acknowledgePrivacyNotice(version)
      setUser({ ...user, privacyAckVersion: version })
    },
    [user],
  )

  const value = useMemo(
    () => ({
      user,
      token,
      isLoading,
      login,
      logout,
      acknowledgePrivacy,
    }),
    [user, token, isLoading, login, logout, acknowledgePrivacy],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}

