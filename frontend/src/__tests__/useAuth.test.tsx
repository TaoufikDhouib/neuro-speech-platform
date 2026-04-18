import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAuth } from '../hooks/useAuth'
import { AuthProvider } from '../context/AuthContext'
import type { ReactNode } from 'react'

// Mock the API module
vi.mock('../services/api', () => ({
  authAPI: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  },
}))

import { authAPI } from '../services/api'

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
)

const mockUser = { id: '1', email: 'test@test.com', name: 'Test', createdAt: '2024-01-01' }
const mockAuthResponse = { token: 'access-token', refreshToken: 'refresh-token', user: mockUser }

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
})

describe('useAuth — login', () => {
  it('stores tokens and user in context on success', async () => {
    vi.mocked(authAPI.login).mockResolvedValue(mockAuthResponse)

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.login('test@test.com', 'password')
    })

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.user?.email).toBe('test@test.com')
    expect(localStorage.getItem('token')).toBe('access-token')
    expect(localStorage.getItem('refreshToken')).toBe('refresh-token')
  })

  it('returns true on success', async () => {
    vi.mocked(authAPI.login).mockResolvedValue(mockAuthResponse)
    const { result } = renderHook(() => useAuth(), { wrapper })

    let success: boolean
    await act(async () => {
      success = await result.current.login('test@test.com', 'password')
    })

    expect(success!).toBe(true)
  })

  it('sets error and returns false on failure', async () => {
    vi.mocked(authAPI.login).mockRejectedValue({
      response: { data: { error: 'Invalid email or password' } },
    })

    const { result } = renderHook(() => useAuth(), { wrapper })

    let success: boolean
    await act(async () => {
      success = await result.current.login('bad@test.com', 'wrong')
    })

    expect(success!).toBe(false)
    expect(result.current.error).toBe('Invalid email or password')
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('clears error after clearError()', async () => {
    vi.mocked(authAPI.login).mockRejectedValue({ response: { data: { error: 'fail' } } })
    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => { await result.current.login('x', 'y') })
    expect(result.current.error).toBeTruthy()

    act(() => { result.current.clearError() })
    expect(result.current.error).toBeNull()
  })

  it('sets isLoading true during login and false after', async () => {
    let resolveLogin!: (v: typeof mockAuthResponse) => void
    vi.mocked(authAPI.login).mockReturnValue(new Promise(r => { resolveLogin = r }))

    const { result } = renderHook(() => useAuth(), { wrapper })

    act(() => { result.current.login('test@test.com', 'password') })
    expect(result.current.isLoading).toBe(true)

    await act(async () => { resolveLogin(mockAuthResponse) })
    expect(result.current.isLoading).toBe(false)
  })
})

describe('useAuth — register', () => {
  it('stores session on successful register', async () => {
    vi.mocked(authAPI.register).mockResolvedValue(mockAuthResponse)
    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.register({ email: 'new@test.com', password: 'pass123', name: 'New User' })
    })

    expect(result.current.isAuthenticated).toBe(true)
    expect(localStorage.getItem('token')).toBe('access-token')
  })

  it('sets error on duplicate email', async () => {
    vi.mocked(authAPI.register).mockRejectedValue({
      response: { data: { error: 'An account with this email already exists' } },
    })
    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.register({ email: 'dupe@test.com', password: 'pass', name: 'X' })
    })

    expect(result.current.error).toContain('already exists')
  })
})

describe('useAuth — logout', () => {
  it('clears context and localStorage', async () => {
    vi.mocked(authAPI.login).mockResolvedValue(mockAuthResponse)
    vi.mocked(authAPI.logout).mockResolvedValue(undefined)

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => { await result.current.login('test@test.com', 'password') })
    expect(result.current.isAuthenticated).toBe(true)

    await act(async () => { await result.current.logout() })

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('refreshToken')).toBeNull()
  })

  it('calls authAPI.logout with the stored refreshToken', async () => {
    vi.mocked(authAPI.login).mockResolvedValue(mockAuthResponse)
    vi.mocked(authAPI.logout).mockResolvedValue(undefined)

    const { result } = renderHook(() => useAuth(), { wrapper })
    await act(async () => { await result.current.login('test@test.com', 'password') })
    await act(async () => { await result.current.logout() })

    expect(authAPI.logout).toHaveBeenCalledWith('refresh-token')
  })

  it('still clears session even if API logout fails', async () => {
    vi.mocked(authAPI.login).mockResolvedValue(mockAuthResponse)
    vi.mocked(authAPI.logout).mockRejectedValue(new Error('network'))

    const { result } = renderHook(() => useAuth(), { wrapper })
    await act(async () => { await result.current.login('test@test.com', 'password') })
    await act(async () => { await result.current.logout() })

    expect(result.current.isAuthenticated).toBe(false)
  })
})

describe('useAuth — hydrates from localStorage', () => {
  it('restores session from localStorage on mount', () => {
    localStorage.setItem('token', 'stored-token')
    localStorage.setItem('refreshToken', 'stored-refresh')
    localStorage.setItem('user', JSON.stringify(mockUser))

    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.user?.email).toBe('test@test.com')
  })
})
