export interface User {
  id: string
  email: string
  name: string
  createdAt: string
}

export interface Child {
  id: string
  name: string
  age: number
  avatarSeed: string
  xp: number
  level: number
  streak: number
  hearts: number
  lastActive: string | null
  createdAt: string
}

export interface Exercise {
  id: string
  type: string
  prompt: string
  targetResponse: string
  score?: number
  transcript?: string
  analysis?: ExerciseAnalysis
  xpEarned?: number
}

export interface ExerciseAnalysis {
  fluency?: number
  articulation?: number
  accuracy?: number
  phonemes?: string[]
  errors?: string[]
  confidence?: number
  processingSpeed?: number
  notes?: string
}

export interface Session {
  id: string
  childId: string
  exercises: Exercise[]
  score?: number
  xpEarned?: number
  startedAt: string
  completedAt?: string
}

export interface NeuralRiskDomains {
  articulation: number
  fluency: number
  phonologicalAwareness: number
  vocabulary: number
  processingSpeed: number
  workingMemory: number
}

export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'REFER'

export interface NeuroReport {
  id: string
  childId: string
  riskLevel: RiskLevel
  flags: string[]
  domains: NeuralRiskDomains
  summary: string
  generatedAt: string
}

export interface AuthResponse {
  token: string
  refreshToken: string
  user: User
}

export interface ExerciseResult {
  exerciseId: string
  score: number
  transcript: string
  xpEarned: number
  latencyMs: number
  durationMs: number
  analysis: ExerciseAnalysis | null
}

export type GamePhase =
  | 'loading'
  | 'intro'
  | 'exercise'
  | 'recording'
  | 'processing'
  | 'feedback'
  | 'complete'
  | 'game_over'

export interface GameState {
  phase: GamePhase
  session: Session | null
  exercises: Exercise[]
  currentIndex: number
  results: ExerciseResult[]
  startTime: number | null
  sessionXP: number
  leveledUp: boolean
  newLevel: number
}

export type ExerciseType =
  | 'REPEAT_WORD'
  | 'REPEAT_SENTENCE'
  | 'NAME_PICTURE'
  | 'RHYME'
  | 'PHONEME'
  | 'STORY'
  | 'COUNT'

export const EXERCISE_TYPE_LABELS: Record<string, string> = {
  REPEAT_WORD: 'Repeat Word',
  REPEAT_SENTENCE: 'Repeat Sentence',
  NAME_PICTURE: 'Name the Picture',
  RHYME: 'Rhyming',
  PHONEME: 'Sound Play',
  STORY: 'Tell a Story',
  COUNT: 'Counting',
}

export const EXERCISE_TYPE_COLORS: Record<string, string> = {
  REPEAT_WORD: 'bg-brand-100 text-brand-700',
  REPEAT_SENTENCE: 'bg-blue-100 text-blue-700',
  NAME_PICTURE: 'bg-accent-100 text-accent-700',
  RHYME: 'bg-pink-100 text-pink-700',
  PHONEME: 'bg-yellow-100 text-yellow-700',
  STORY: 'bg-orange-100 text-orange-700',
  COUNT: 'bg-primary-100 text-primary-700',
}

export const EXERCISE_TYPE_EMOJIS: Record<string, string> = {
  REPEAT_WORD: '🔤',
  REPEAT_SENTENCE: '💬',
  NAME_PICTURE: '🖼️',
  RHYME: '🎵',
  PHONEME: '🔊',
  STORY: '📖',
  COUNT: '🔢',
}
