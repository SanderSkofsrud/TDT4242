import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import type { User } from '../types/models'
import * as userService from '../services/userService'
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

if (typeof window !== 'undefined') {
  initialToken = window.localStorage.getItem('authToken')
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setTokenState] = useState<string | null>(initialToken)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (token) {
      setAuthToken(token)
    } else {
      setAuthToken(null)
    }
  }, [token])

  useEffect(() => {
    if (!initialToken) return

    const payload = decodeToken(initialToken)

    if (!payload.sub || !payload.role || payload.privacyAckVersion == null) {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('authToken')
      }
      initialToken = null
      return
    }

    if (payload.exp && Date.now() >= payload.exp * 1000) {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('authToken')
      }
      initialToken = null
      return
    }

    const authUser: User = {
      id: payload.sub,
      role: payload.role,
      privacyAckVersion: payload.privacyAckVersion,
    }

    setUser(authUser)
    setTokenState(initialToken)
  }, [])

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
    exp?: number
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
        const { token: newToken } = await userService.login(email, password)
        setTokenState(newToken)
        setAuthToken(newToken)
        initialToken = newToken

        if (typeof window !== 'undefined') {
          window.localStorage.setItem('authToken', newToken)
          document.cookie = `authToken=${newToken}; max-age=${60 * 60}; path=/`
        }

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

    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('authToken')
      document.cookie = 'authToken=; Max-Age=0; path=/'
    }
  }, [])

  const acknowledgePrivacy = useCallback(
    async (version: number): Promise<void> => {
      await userService.acknowledgePrivacyNotice(version)
      setUser((prev) =>
        prev ? { ...prev, privacyAckVersion: version } : prev,
      )
    },
    [],
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

