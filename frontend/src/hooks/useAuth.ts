import { useState, useCallback } from 'react'
import { authAPI } from '../services/api'
import { useAuthContext } from '../context/AuthContext'

export function useAuth() {
  const { user, token, isAuthenticated, setSession, clearSession } = useAuthContext()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await authAPI.login(email, password)
      setSession(data.token, data.refreshToken, data.user)
      return true
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Login failed. Please try again.'
      setError(message)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [setSession])

  const register = useCallback(async (registerData: { email: string; password: string; name: string }) => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await authAPI.register(registerData)
      setSession(data.token, data.refreshToken, data.user)
      return true
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Registration failed. Please try again.'
      setError(message)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [setSession])

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('refreshToken')
    clearSession()
    if (refreshToken) {
      authAPI.logout(refreshToken).catch(() => {})
    }
  }, [clearSession])

  const clearError = useCallback(() => setError(null), [])

  return { user, token, isAuthenticated, isLoading, error, login, register, logout, clearError }
}
