import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  calculateXP,
  applyStreakMultiplier,
  calculateLevel,
  xpForLevel,
  xpProgressInLevel,
  checkLevelUp,
  updateStreak,
  calculateSessionXP,
  loseHeart,
  gainHeart,
  refillHearts,
  MAX_HEARTS,
} from '../services/gamification';

// ─── calculateXP ─────────────────────────────────────────────────────────────

describe('calculateXP', () => {
  it('returns 0 for score 0', () => {
    // base=10, multiplier=0, perfectBonus=0  → 0
    expect(calculateXP(0, 'PICTURE_NAMING')).toBe(0);
  });

  it('returns correct XP for score 100', () => {
    // base=10, multiplier=1.5, perfectBonus=5 → 10*1.5+5 = 20
    expect(calculateXP(100, 'PICTURE_NAMING')).toBe(20);
  });

  it('awards perfect bonus for score >= 95', () => {
    const at94 = calculateXP(94, 'PICTURE_NAMING');
    const at95 = calculateXP(95, 'PICTURE_NAMING');
    expect(at95).toBe(at94 + 5);
  });

  it('caps score multiplier at 1.5 (score > 100 clamped)', () => {
    expect(calculateXP(100, 'WORD_REPETITION')).toBe(calculateXP(110, 'WORD_REPETITION'));
  });

  it('type parameter does not affect XP (ignored)', () => {
    expect(calculateXP(80, 'PICTURE_NAMING')).toBe(calculateXP(80, 'STORY_RETELLING'));
  });

  it('returns round number', () => {
    const xp = calculateXP(73, 'RAPID_NAMING');
    expect(Number.isInteger(xp)).toBe(true);
  });
});

// ─── applyStreakMultiplier ────────────────────────────────────────────────────

describe('applyStreakMultiplier', () => {
  it('streak 0 → multiplier 1.0 (no bonus)', () => {
    expect(applyStreakMultiplier(10, 0)).toBe(10);
  });

  it('streak 5 → multiplier 1.5', () => {
    // 5/10 + 1 = 1.5
    expect(applyStreakMultiplier(10, 5)).toBe(15);
  });

  it('streak 10 → multiplier 2.0', () => {
    expect(applyStreakMultiplier(10, 10)).toBe(20);
  });

  it('streak beyond 10 is capped at 2.0x', () => {
    expect(applyStreakMultiplier(10, 20)).toBe(20);
    expect(applyStreakMultiplier(10, 100)).toBe(20);
  });

  it('returns round number', () => {
    const result = applyStreakMultiplier(7, 3);
    expect(Number.isInteger(result)).toBe(true);
  });
});

// ─── calculateLevel ──────────────────────────────────────────────────────────

describe('calculateLevel', () => {
  it('level 1 at 0 XP', () => {
    expect(calculateLevel(0)).toBe(1);
  });

  it('level 1 just before threshold', () => {
    // xpForLevel(2) = (2-1)^2 * 100 = 100 → need 100 XP for level 2
    expect(calculateLevel(99)).toBe(1);
  });

  it('level 2 at exactly 100 XP', () => {
    expect(calculateLevel(100)).toBe(2);
  });

  it('level 3 at 400 XP', () => {
    // xpForLevel(3) = (3-1)^2 * 100 = 400
    expect(calculateLevel(400)).toBe(3);
  });

  it('level 5 at 1600 XP', () => {
    // xpForLevel(5) = (5-1)^2 * 100 = 1600
    expect(calculateLevel(1600)).toBe(5);
  });

  it('handles negative XP (clamp to 0)', () => {
    expect(calculateLevel(-50)).toBe(1);
  });
});

// ─── xpForLevel ──────────────────────────────────────────────────────────────

describe('xpForLevel', () => {
  it('level 1 requires 0 XP', () => {
    expect(xpForLevel(1)).toBe(0);
  });

  it('level 2 requires 100 XP', () => {
    expect(xpForLevel(2)).toBe(100);
  });

  it('level 5 requires 1600 XP', () => {
    expect(xpForLevel(5)).toBe(1600);
  });

  it('xpForLevel and calculateLevel are inverses', () => {
    for (const level of [1, 2, 3, 4, 5, 6, 10]) {
      expect(calculateLevel(xpForLevel(level))).toBe(level);
    }
  });
});

// ─── xpProgressInLevel ───────────────────────────────────────────────────────

describe('xpProgressInLevel', () => {
  it('returns 0% at start of level', () => {
    // At exactly xpForLevel(2) = 100 → 0% progress within level 2
    const progress = xpProgressInLevel(100);
    expect(progress.percentage).toBe(0);
    expect(progress.current).toBe(0);
  });

  it('returns 50% in the middle of a level', () => {
    // Level 2 spans xp 100–400 (range=300), midpoint=250
    const progress = xpProgressInLevel(250);
    expect(progress.percentage).toBe(50);
  });

  it('required equals next_level_xp - current_level_xp', () => {
    const progress = xpProgressInLevel(200);
    expect(progress.required).toBe(xpForLevel(3) - xpForLevel(2));
  });
});

// ─── checkLevelUp ────────────────────────────────────────────────────────────

describe('checkLevelUp', () => {
  it('returns true when crossing level threshold', () => {
    expect(checkLevelUp(95, 105)).toBe(true);  // level 1 → level 2 at 100
  });

  it('returns false when staying in same level', () => {
    expect(checkLevelUp(105, 150)).toBe(false);
  });

  it('returns false at same XP', () => {
    expect(checkLevelUp(200, 200)).toBe(false);
  });
});

// ─── updateStreak ────────────────────────────────────────────────────────────

describe('updateStreak', () => {
  it('returns streak 1 when lastActive is null (first session)', () => {
    const result = updateStreak(null, 0);
    expect(result.newStreak).toBe(1);
    expect(result.maintained).toBe(true);
  });

  it('increments streak when lastActive was yesterday', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const result = updateStreak(yesterday, 5);
    expect(result.newStreak).toBe(6);
    expect(result.maintained).toBe(true);
  });

  it('keeps streak unchanged when lastActive was today', () => {
    const today = new Date();
    const result = updateStreak(today, 3);
    expect(result.newStreak).toBe(3);
    expect(result.maintained).toBe(true);
  });

  it('resets streak to 1 when lastActive was 2+ days ago', () => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const result = updateStreak(twoDaysAgo, 10);
    expect(result.newStreak).toBe(1);
    expect(result.maintained).toBe(false);
  });

  it('resets streak to 1 when lastActive was a week ago', () => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const result = updateStreak(weekAgo, 7);
    expect(result.newStreak).toBe(1);
    expect(result.maintained).toBe(false);
  });
});

// ─── calculateSessionXP ──────────────────────────────────────────────────────

describe('calculateSessionXP', () => {
  it('sums up XP across exercises and applies streak multiplier', () => {
    const exercises = [
      { score: 100, type: 'PICTURE_NAMING' },   // 20 XP
      { score: 80,  type: 'WORD_REPETITION' },  // 12 XP
      { score: 0,   type: 'RHYME_DETECTION' },  // 0 XP
    ];

    const { totalXP, breakdown } = calculateSessionXP(exercises, 0);
    expect(breakdown).toHaveLength(3);
    expect(breakdown[0]).toBe(20);
    expect(breakdown[1]).toBe(12);
    expect(breakdown[2]).toBe(0);
    // streak=0 → multiplier=1.0, total = 32
    expect(totalXP).toBe(32);
  });

  it('applies streak multiplier to total', () => {
    const exercises = [{ score: 100, type: 'PICTURE_NAMING' }]; // 20 XP
    // streak=10 → 2.0x
    const { totalXP } = calculateSessionXP(exercises, 10);
    expect(totalXP).toBe(40);
  });

  it('empty exercise list returns 0 XP', () => {
    const { totalXP, breakdown } = calculateSessionXP([], 5);
    expect(totalXP).toBe(0);
    expect(breakdown).toHaveLength(0);
  });
});

// ─── Hearts system ────────────────────────────────────────────────────────────

describe('Hearts system', () => {
  it('MAX_HEARTS is 5', () => {
    expect(MAX_HEARTS).toBe(5);
  });

  it('loseHeart decrements by 1', () => {
    expect(loseHeart(5)).toBe(4);
    expect(loseHeart(1)).toBe(0);
  });

  it('loseHeart floors at 0', () => {
    expect(loseHeart(0)).toBe(0);
  });

  it('gainHeart increments by 1', () => {
    expect(gainHeart(3)).toBe(4);
  });

  it('gainHeart caps at MAX_HEARTS', () => {
    expect(gainHeart(5)).toBe(5);
    expect(gainHeart(10)).toBe(5);
  });

  it('refillHearts returns MAX_HEARTS', () => {
    expect(refillHearts()).toBe(MAX_HEARTS);
  });
});
