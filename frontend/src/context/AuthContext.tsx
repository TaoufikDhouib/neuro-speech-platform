import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { User } from '../types'

interface StoredAuth {
  user: User | null
  token: string | null
  refreshToken: string | null
}

interface AuthContextValue extends StoredAuth {
  isAuthenticated: boolean
  setSession: (token: string, refreshToken: string, user: User) => void
  clearSession: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function loadFromStorage(): StoredAuth {
  try {
    const token = localStorage.getItem('token')
    const refreshToken = localStorage.getItem('refreshToken')
    const raw = localStorage.getItem('user')
    const user = raw ? (JSON.parse(raw) as User) : null
    return { token, refreshToken, user }
  } catch {
    return { token: null, refreshToken: null, user: null }
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<StoredAuth>(loadFromStorage)

  const setSession = useCallback((token: string, refreshToken: string, user: User) => {
    localStorage.setItem('token', token)
    localStorage.setItem('refreshToken', refreshToken)
    localStorage.setItem('user', JSON.stringify(user))
    setAuth({ token, refreshToken, user })
  }, [])

  const clearSession = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    setAuth({ token: null, refreshToken: null, user: null })
  }, [])

  return (
    <AuthContext.Provider value={{ ...auth, isAuthenticated: !!auth.token, setSession, clearSession }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider')
  return ctx
}
