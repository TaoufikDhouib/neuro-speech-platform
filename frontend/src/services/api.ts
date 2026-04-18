import axios, { type InternalAxiosRequestConfig } from 'axios'
import type {
  AuthResponse,
  Child,
  Exercise,
  ExerciseAnalysis,
  NeuroReport,
  Session,
  User,
} from '../types'

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  headers: { 'Content-Type': 'application/json' },
})

// ─── Request interceptor: attach JWT ─────────────────────────────────────────

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ─── Response interceptor: auto-refresh on 401 ───────────────────────────────

let isRefreshing = false
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = []

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error || !token) reject(error)
    else resolve(token)
  })
  failedQueue = []
}

function clearAuthAndRedirect() {
  localStorage.removeItem('token')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('user')
  window.location.href = '/login'
}

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalConfig = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    const is401 = error.response?.status === 401
    const isRefreshEndpoint = originalConfig?.url?.includes('/auth/refresh')
    const alreadyRetried = originalConfig?._retry

    if (!is401 || isRefreshEndpoint || alreadyRetried) {
      return Promise.reject(error)
    }

    const storedRefreshToken = localStorage.getItem('refreshToken')
    if (!storedRefreshToken) {
      clearAuthAndRedirect()
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then((newToken) => {
        originalConfig.headers.Authorization = `Bearer ${newToken}`
        return axiosInstance(originalConfig)
      })
    }

    isRefreshing = true
    originalConfig._retry = true

    try {
      const { data } = await axiosInstance.post<AuthResponse>('/auth/refresh', {
        refreshToken: storedRefreshToken,
      })
      localStorage.setItem('token', data.token)
      localStorage.setItem('refreshToken', data.refreshToken)
      localStorage.setItem('user', JSON.stringify(data.user))
      axiosInstance.defaults.headers.common.Authorization = `Bearer ${data.token}`
      originalConfig.headers.Authorization = `Bearer ${data.token}`
      processQueue(null, data.token)
      return axiosInstance(originalConfig)
    } catch (refreshError) {
      processQueue(refreshError, null)
      clearAuthAndRedirect()
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)

// ─── Auth API ─────────────────────────────────────────────────────────────────

export const authAPI = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const { data } = await axiosInstance.post<AuthResponse>('/auth/login', { email, password })
    return data
  },

  async register(registerData: { email: string; password: string; name: string }): Promise<AuthResponse> {
    const { data } = await axiosInstance.post<AuthResponse>('/auth/register', registerData)
    return data
  },

  async me(): Promise<User> {
    const { data } = await axiosInstance.get<{ user: User }>('/auth/me')
    return data.user
  },

  async logout(refreshToken: string): Promise<void> {
    await axiosInstance.post('/auth/logout', { refreshToken })
  },
}

// ─── Children API ─────────────────────────────────────────────────────────────

export const childrenAPI = {
  async getAll(): Promise<Child[]> {
    const { data } = await axiosInstance.get<{ children: Child[] }>('/children')
    return data.children
  },

  async get(id: string): Promise<Child> {
    const { data } = await axiosInstance.get<{ child: Child }>(`/children/${id}`)
    return data.child
  },

  async create(createData: { name: string; age: number; avatarSeed?: string }): Promise<Child> {
    const { data } = await axiosInstance.post<Child>('/children', createData)
    return data
  },

  async delete(id: string): Promise<void> {
    await axiosInstance.delete(`/children/${id}`)
  },

  async getBadges(childId: string): Promise<Badge[]> {
    const { data } = await axiosInstance.get<{ badges: Badge[] }>(`/children/${childId}/badges`)
    return data.badges
  },
}

// ─── Sessions API ─────────────────────────────────────────────────────────────

export const sessionsAPI = {
  async create(childId: string): Promise<{ session: Session; exercises: Exercise[] }> {
    const { data } = await axiosInstance.post<{ session: Session & { exercises: Exercise[] } }>(
      '/sessions',
      { childId }
    )
    const { exercises, ...session } = data.session
    return { session: session as Session, exercises: exercises ?? [] }
  },

  async get(id: string): Promise<Session> {
    const { data } = await axiosInstance.get<Session>(`/sessions/${id}`)
    return data
  },

  async complete(id: string): Promise<{ session: Session; xpEarned: number; levelUp: boolean; newLevel: number }> {
    const { data } = await axiosInstance.post<{
      session: Session; xpEarned: number; levelUp: boolean; newLevel: number
    }>(`/sessions/${id}/complete`)
    return data
  },
}

// ─── Analysis API ─────────────────────────────────────────────────────────────

export const analysisAPI = {
  async transcribe(audioBlob: Blob, exerciseId: string): Promise<{ transcript: string; latencyMs: number }> {
    const formData = new FormData()
    formData.append('audio', audioBlob, 'recording.webm')
    formData.append('exerciseId', exerciseId)
    const { data } = await axiosInstance.post<{ transcript: string; latencyMs: number }>(
      '/analysis/transcribe',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return data
  },

  async evaluate(params: {
    exerciseId: string
    transcript: string
    latencyMs: number
    durationMs: number
  }): Promise<{ analysis: ExerciseAnalysis; score: number; xpEarned: number }> {
    const { data } = await axiosInstance.post<{
      analysis: ExerciseAnalysis; score: number; xpEarned: number
    }>('/analysis/evaluate', params)
    return data
  },
}

// ─── Reports API ──────────────────────────────────────────────────────────────

function parseReport(r: NeuroReport & { flags: string | string[]; domains: string | object }): NeuroReport {
  return {
    ...r,
    flags: typeof r.flags === 'string' ? JSON.parse(r.flags) : r.flags,
    domains: typeof r.domains === 'string' ? JSON.parse(r.domains) : r.domains,
  } as NeuroReport
}

export const reportsAPI = {
  async getAll(childId: string): Promise<NeuroReport[]> {
    const { data } = await axiosInstance.get<{ reports: NeuroReport[] }>(`/reports/${childId}`)
    return data.reports.map(parseReport)
  },

  async generate(childId: string): Promise<NeuroReport> {
    const { data } = await axiosInstance.post<NeuroReport>(`/reports/${childId}/generate`)
    return parseReport(data as NeuroReport & { flags: string; domains: string })
  },
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Badge {
  id: string
  childId: string
  type: string
  earnedAt: string
}

export default axiosInstance
