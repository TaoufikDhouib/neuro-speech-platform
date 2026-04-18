

// ─── XP Calculation ───────────────────────────────────────────────────────

/**
 * Calculate XP earned for a single exercise
 * - Base: 10 XP
 * - Score multiplier: score/100 * 1.5 (max 1.5x)
 * - Perfect score bonus: +5 XP
 * - Streak multiplier applied at session level
 */
export function calculateXP(score: number, _exerciseType: string): number {
  const base = 10;
  const scoreMultiplier = Math.min(1.5, (score / 100) * 1.5);
  const perfectBonus = score >= 95 ? 5 : 0;

  return Math.round(base * scoreMultiplier + perfectBonus);
}

/**
 * Apply streak multiplier to XP earned
 */
export function applyStreakMultiplier(xp: number, streak: number): number {
  const multiplier = Math.min(2.0, streak / 10 + 1);
  return Math.round(xp * multiplier);
}

// ─── Level Calculation ────────────────────────────────────────────────────

/**
 * Calculate level from total XP
 * level = floor(sqrt(totalXP / 100)) + 1
 */
export function calculateLevel(totalXP: number): number {
  return Math.floor(Math.sqrt(Math.max(0, totalXP) / 100)) + 1;
}

/**
 * Calculate XP required to reach a given level
 */
export function xpForLevel(level: number): number {
  return Math.pow(level - 1, 2) * 100;
}

/**
 * XP progress within current level (0-100%)
 */
export function xpProgressInLevel(totalXP: number): {
  current: number;
  required: number;
  percentage: number;
} {
  const level = calculateLevel(totalXP);
  const currentLevelXP = xpForLevel(level);
  const nextLevelXP = xpForLevel(level + 1);
  const range = nextLevelXP - currentLevelXP;
  const current = totalXP - currentLevelXP;

  return {
    current,
    required: range,
    percentage: range > 0 ? Math.round((current / range) * 100) : 100,
  };
}

// ─── Level-up detection ───────────────────────────────────────────────────

export function checkLevelUp(oldXP: number, newXP: number): boolean {
  return calculateLevel(newXP) > calculateLevel(oldXP);
}

// ─── Streak tracking ──────────────────────────────────────────────────────

/**
 * Check if the streak is maintained or should be reset.
 * Streak is maintained if:
 *   - Last active was today (already counted) → no change
 *   - Last active was yesterday → increment
 * Otherwise reset to 1.
 */
export function updateStreak(
  lastActive: Date | null,
  currentStreak: number = 0
): { newStreak: number; maintained: boolean } {
  if (!lastActive) {
    return { newStreak: 1, maintained: true };
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const lastDate = new Date(
    lastActive.getFullYear(),
    lastActive.getMonth(),
    lastActive.getDate()
  );

  const diffMs = today.getTime() - lastDate.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    // Already played today, streak unchanged
    return { newStreak: currentStreak, maintained: true };
  }

  if (diffDays === 1) {
    // Played yesterday, increment streak
    return { newStreak: currentStreak + 1, maintained: true };
  }

  // Missed a day or more, reset streak
  return { newStreak: 1, maintained: false };
}

// ─── Session XP calculation ───────────────────────────────────────────────

export function calculateSessionXP(
  exerciseScores: Array<{ score: number; type: string }>,
  streak: number
): { totalXP: number; breakdown: number[] } {
  const breakdown = exerciseScores.map((e) => calculateXP(e.score, e.type));
  const rawTotal = breakdown.reduce((sum, xp) => sum + xp, 0);
  const totalXP = applyStreakMultiplier(rawTotal, streak);

  return { totalXP, breakdown };
}

// ─── Hearts system ────────────────────────────────────────────────────────

export const MAX_HEARTS = 5;

export function loseHeart(currentHearts: number): number {
  return Math.max(0, currentHearts - 1);
}

export function gainHeart(currentHearts: number): number {
  return Math.min(MAX_HEARTS, currentHearts + 1);
}

export function refillHearts(): number {
  return MAX_HEARTS;
}

// ─── Badges / achievements (future use) ──────────────────────────────────

export interface Badge {
  id: string;
  name: string;
  description: string;
  condition: string;
}

export const BADGES: Badge[] = [
  {
    id: 'first_session',
    name: 'First Steps',
    description: 'Complete your first session',
    condition: 'sessions >= 1',
  },
  {
    id: 'streak_7',
    name: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    condition: 'streak >= 7',
  },
  {
    id: 'perfect_score',
    name: 'Superstar',
    description: 'Score 100% on any exercise',
    condition: 'anyScore == 100',
  },
  {
    id: 'level_5',
    name: 'Rising Star',
    description: 'Reach level 5',
    condition: 'level >= 5',
  },
  {
    id: 'level_10',
    name: 'Speech Champion',
    description: 'Reach level 10',
    condition: 'level >= 10',
  },
];
