import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'

// We test the interceptor logic directly by creating a fresh axios instance
// that mirrors what api.ts does, avoiding module-level side effects.

function buildAxiosWithInterceptors() {
  const instance = axios.create({ baseURL: '/api' })

  let isRefreshing = false
  let failedQueue: Array<{ resolve: (t: string) => void; reject: (e: unknown) => void }> = []

  function processQueue(error: unknown, token: string | null) {
    failedQueue.forEach(({ resolve, reject }) => {
      if (error || !token) reject(error)
      else resolve(token)
    })
    failedQueue = []
  }

  instance.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  })

  instance.interceptors.response.use(
    (r) => r,
    async (error) => {
      const orig = error.config as typeof error.config & { _retry?: boolean }
      const is401 = error.response?.status === 401
      const isRefreshCall = orig?.url?.includes('/auth/refresh')

      if (!is401 || isRefreshCall || orig?._retry) return Promise.reject(error)

      const storedRefresh = localStorage.getItem('refreshToken')
      if (!storedRefresh) {
        localStorage.clear()
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((newToken) => {
          orig.headers.Authorization = `Bearer ${newToken}`
          return instance(orig)
        })
      }

      isRefreshing = true
      orig._retry = true

      try {
        const { data } = await instance.post('/auth/refresh', { refreshToken: storedRefresh })
        localStorage.setItem('token', data.token)
        localStorage.setItem('refreshToken', data.refreshToken)
        orig.headers.Authorization = `Bearer ${data.token}`
        processQueue(null, data.token)
        return instance(orig)
      } catch (err) {
        processQueue(err, null)
        localStorage.clear()
        return Promise.reject(err)
      } finally {
        isRefreshing = false
      }
    }
  )

  return instance
}

describe('401 interceptor', () => {
  let mock: MockAdapter
  let api: ReturnType<typeof buildAxiosWithInterceptors>

  beforeEach(() => {
    api = buildAxiosWithInterceptors()
    mock = new MockAdapter(api)
    localStorage.clear()
    vi.stubGlobal('location', { href: '' })
  })

  afterEach(() => {
    mock.restore()
    vi.unstubAllGlobals()
  })

  it('retries original request with new token after successful refresh', async () => {
    localStorage.setItem('token', 'expired-token')
    localStorage.setItem('refreshToken', 'valid-refresh')

    mock.onGet('/protected').replyOnce(401)
    mock.onPost('/auth/refresh').replyOnce(200, {
      token: 'new-access',
      refreshToken: 'new-refresh',
      user: { id: '1', email: 'x@x.com', name: 'X', createdAt: '' },
    })
    mock.onGet('/protected').replyOnce(200, { data: 'secret' })

    const response = await api.get('/protected')
    expect(response.data).toEqual({ data: 'secret' })
    expect(localStorage.getItem('token')).toBe('new-access')
    expect(localStorage.getItem('refreshToken')).toBe('new-refresh')
  })

  it('clears storage when no refreshToken is present', async () => {
    localStorage.setItem('token', 'expired-token')
    // no refreshToken set

    mock.onGet('/protected').replyOnce(401)

    await expect(api.get('/protected')).rejects.toBeTruthy()
    expect(localStorage.getItem('token')).toBeNull()
  })

  it('clears storage when refresh endpoint itself fails', async () => {
    localStorage.setItem('token', 'expired')
    localStorage.setItem('refreshToken', 'bad-refresh')

    mock.onGet('/protected').replyOnce(401)
    mock.onPost('/auth/refresh').replyOnce(401, { error: 'Refresh token expired' })

    await expect(api.get('/protected')).rejects.toBeTruthy()
    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('refreshToken')).toBeNull()
  })

  it('does not retry the refresh endpoint on 401 (no infinite loop)', async () => {
    localStorage.setItem('refreshToken', 'bad')

    mock.onPost('/auth/refresh').replyOnce(401)

    await expect(api.post('/auth/refresh', { refreshToken: 'bad' })).rejects.toBeTruthy()
    // Only one call was made — no retry loop
    expect(mock.history.post.length).toBe(1)
  })

  it('queues concurrent 401 requests and retries all after refresh', async () => {
    localStorage.setItem('token', 'expired')
    localStorage.setItem('refreshToken', 'valid-refresh')

    mock.onGet('/a').replyOnce(401)
    mock.onGet('/b').replyOnce(401)
    mock.onPost('/auth/refresh').replyOnce(200, {
      token: 'new-token',
      refreshToken: 'new-refresh',
      user: { id: '1', email: 'x@x.com', name: 'X', createdAt: '' },
    })
    mock.onGet('/a').replyOnce(200, { from: 'a' })
    mock.onGet('/b').replyOnce(200, { from: 'b' })

    const [resA, resB] = await Promise.all([api.get('/a'), api.get('/b')])
    expect(resA.data).toEqual({ from: 'a' })
    expect(resB.data).toEqual({ from: 'b' })
    // Refresh should only have been called once
    expect(mock.history.post.filter(r => r.url === '/auth/refresh').length).toBe(1)
  })

  it('passes through non-401 errors unchanged', async () => {
    mock.onGet('/server-error').replyOnce(500, { error: 'Internal Server Error' })

    await expect(api.get('/server-error')).rejects.toMatchObject({
      response: { status: 500 },
    })
  })
})
