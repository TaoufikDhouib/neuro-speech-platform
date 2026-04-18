import { describe, it, expect } from 'vitest'
import type { ExerciseResult } from '../types'

// ─── Pure logic extracted from Game.tsx ──────────────────────────────────────
// These functions mirror what Game.tsx computes so we can test them in isolation
// without mounting the full component (which needs audio APIs and Router).

function deriveHearts(results: Pick<ExerciseResult, 'score'>[]): number {
  const lost = results.filter((r) => r.score < 40).length
  return Math.max(0, 5 - lost)
}

function isGameOver(results: Pick<ExerciseResult, 'score'>[]): boolean {
  return deriveHearts(results) === 0
}

function scoreToStars(avgScore: number): number {
  if (avgScore >= 85) return 3
  if (avgScore >= 55) return 2
  return 1
}

function avgScore(results: Pick<ExerciseResult, 'score'>[]): number {
  if (results.length === 0) return 0
  return Math.round(results.reduce((s, r) => s + r.score, 0) / results.length)
}

// ─── Hearts ──────────────────────────────────────────────────────────────────

describe('hearts system', () => {
  it('starts at 5 with no results', () => {
    expect(deriveHearts([])).toBe(5)
  })

  it('loses 1 heart per exercise scored below 40', () => {
    const results = [{ score: 35 }]
    expect(deriveHearts(results)).toBe(4)
  })

  it('does not lose a heart for a score of exactly 40', () => {
    expect(deriveHearts([{ score: 40 }])).toBe(5)
  })

  it('does not lose a heart for scores above 40', () => {
    expect(deriveHearts([{ score: 41 }, { score: 90 }, { score: 100 }])).toBe(5)
  })

  it('loses multiple hearts for multiple low scores', () => {
    const results = [{ score: 10 }, { score: 20 }, { score: 30 }]
    expect(deriveHearts(results)).toBe(2)
  })

  it('never goes below 0', () => {
    const results = Array.from({ length: 10 }, () => ({ score: 0 }))
    expect(deriveHearts(results)).toBe(0)
  })
})

// ─── Game over ───────────────────────────────────────────────────────────────

describe('game over trigger', () => {
  it('is not game over with fewer than 5 bad exercises', () => {
    const results = Array.from({ length: 4 }, () => ({ score: 0 }))
    expect(isGameOver(results)).toBe(false)
  })

  it('triggers game over after exactly 5 bad exercises', () => {
    const results = Array.from({ length: 5 }, () => ({ score: 0 }))
    expect(isGameOver(results)).toBe(true)
  })

  it('does not trigger game over when bad exercises are mixed with good ones', () => {
    const results = [
      { score: 0 }, { score: 0 }, { score: 0 }, { score: 0 },
      { score: 75 }, // 4 bad + 1 good → still 1 heart left
    ]
    expect(isGameOver(results)).toBe(false)
  })

  it('triggers game over when 5th bad score arrives', () => {
    const prev = [{ score: 0 }, { score: 0 }, { score: 0 }, { score: 0 }]
    const newResult = { score: 10 }
    expect(isGameOver([...prev, newResult])).toBe(true)
  })
})

// ─── Star rating ─────────────────────────────────────────────────────────────

describe('scoreToStars', () => {
  it('awards 3 stars for avgScore >= 85', () => {
    expect(scoreToStars(85)).toBe(3)
    expect(scoreToStars(100)).toBe(3)
  })

  it('awards 2 stars for avgScore 55–84', () => {
    expect(scoreToStars(55)).toBe(2)
    expect(scoreToStars(84)).toBe(2)
  })

  it('awards 1 star for avgScore below 55', () => {
    expect(scoreToStars(0)).toBe(1)
    expect(scoreToStars(54)).toBe(1)
  })
})

// ─── Average score ───────────────────────────────────────────────────────────

describe('avgScore', () => {
  it('returns 0 for empty results', () => {
    expect(avgScore([])).toBe(0)
  })

  it('calculates correct average and rounds', () => {
    expect(avgScore([{ score: 80 }, { score: 90 }])).toBe(85)
    expect(avgScore([{ score: 33 }, { score: 34 }])).toBe(34) // 33.5 rounds to 34
  })

  it('handles single result', () => {
    expect(avgScore([{ score: 72 }])).toBe(72)
  })
})
