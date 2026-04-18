import { describe, it, expect } from 'vitest';
import { analyzeSpeech, getAgeSpeakingNorms } from '../services/speechAnalysis';

// ─── getAgeSpeakingNorms ─────────────────────────────────────────────────────

describe('getAgeSpeakingNorms', () => {
  it('returns correct norms for age 5', () => {
    const norms = getAgeSpeakingNorms(5);
    expect(norms.minWPM).toBe(80);
    expect(norms.maxWPM).toBe(160);
    expect(norms.typicalAccuracy).toBe(80);
  });

  it('returns correct norms for age 7', () => {
    const norms = getAgeSpeakingNorms(7);
    expect(norms.minWPM).toBe(100);
    expect(norms.maxWPM).toBe(180);
  });

  it('clamps ages below 3 to age-3 norms', () => {
    expect(getAgeSpeakingNorms(1)).toEqual(getAgeSpeakingNorms(3));
    expect(getAgeSpeakingNorms(2)).toEqual(getAgeSpeakingNorms(3));
  });

  it('clamps ages above 10 to age-10 norms', () => {
    expect(getAgeSpeakingNorms(12)).toEqual(getAgeSpeakingNorms(10));
  });
});

// ─── analyzeSpeech — perfect match ──────────────────────────────────────────

describe('analyzeSpeech — perfect match', () => {
  it('gives high scores when transcript exactly matches target', () => {
    const result = analyzeSpeech({
      transcript: 'cat',
      targetResponse: 'cat',
      exerciseType: 'PICTURE_NAMING',
      latencyMs: 1000,
      durationMs: 800,
      childAge: 5,
    });

    expect(result.accuracy).toBe(100);
    expect(result.articulationScore).toBe(100);
    expect(result.overallScore).toBeGreaterThanOrEqual(90);
    expect(result.wordCount).toBe(1);
  });

  it('computes speakingRateWPM from durationMs', () => {
    // 4 words in 2000ms = 2 sec = 1/30 min → 120 WPM
    const result = analyzeSpeech({
      transcript: 'dog cat frog fox',
      targetResponse: 'dog cat frog fox',
      exerciseType: 'RAPID_NAMING',
      latencyMs: 800,
      durationMs: 2000,
      childAge: 7,
    });
    expect(result.speakingRateWPM).toBe(120);
    expect(result.wordCount).toBe(4);
    expect(result.accuracy).toBe(100);
  });
});

// ─── analyzeSpeech — approximate match ──────────────────────────────────────

describe('analyzeSpeech — approximate / fuzzy match', () => {
  it('accepts near-match like "doggy" for target "dog" with reduced score', () => {
    const result = analyzeSpeech({
      transcript: 'doggy',
      targetResponse: 'dog',
      exerciseType: 'PICTURE_NAMING',
      latencyMs: 1500,
      durationMs: 700,
      childAge: 5,
    });

    // Fuzzy similarity 3/5 = 0.6 — below 0.75 threshold so accuracy = 0
    // But articulation (char-level) will still be high
    expect(result.accuracy).toBeLessThan(100);
    expect(result.overallScore).toBeGreaterThan(0);
  });

  it('multi-word: gives credit for partially matching story retell', () => {
    const result = analyzeSpeech({
      transcript: 'lily found a red ball in the park she kicked it and it rolled away she ran and caught it',
      targetResponse: 'lily found red ball park kicked rolled ran caught',
      exerciseType: 'STORY_RETELLING',
      latencyMs: 2800,
      durationMs: 5200,
      childAge: 7,
    });

    expect(result.accuracy).toBeGreaterThan(70);
    expect(result.overallScore).toBeGreaterThan(60);
    expect(result.wordCount).toBe(20);
  });
});

// ─── analyzeSpeech — RHYME_DETECTION ────────────────────────────────────────

describe('analyzeSpeech — RHYME_DETECTION / PHONEME_ISOLATION', () => {
  it('phonologicalScore = 100 for exact match', () => {
    const result = analyzeSpeech({
      transcript: 'yes',
      targetResponse: 'yes',
      exerciseType: 'RHYME_DETECTION',
      latencyMs: 900,
      durationMs: 400,
      childAge: 5,
    });
    expect(result.phonologicalScore).toBe(100);
    expect(result.overallScore).toBeGreaterThanOrEqual(85);
  });

  it('phonologicalScore = 0 for wrong answer', () => {
    const result = analyzeSpeech({
      transcript: 'no',
      targetResponse: 'yes',
      exerciseType: 'RHYME_DETECTION',
      latencyMs: 900,
      durationMs: 400,
      childAge: 5,
    });
    expect(result.phonologicalScore).toBe(0);
  });

  it('PHONEME_ISOLATION: exact phoneme returns 100', () => {
    const result = analyzeSpeech({
      transcript: 's',
      targetResponse: 's',
      exerciseType: 'PHONEME_ISOLATION',
      latencyMs: 700,
      durationMs: 300,
      childAge: 6,
    });
    expect(result.phonologicalScore).toBe(100);
  });
});

// ─── analyzeSpeech — fluency markers ────────────────────────────────────────

describe('analyzeSpeech — fluency markers', () => {
  it('detects filler words in transcript', () => {
    const result = analyzeSpeech({
      transcript: 'um the dog um sat on the mat',
      targetResponse: 'the dog sat on the mat',
      exerciseType: 'SENTENCE_COMPLETION',
      latencyMs: 2000,
      durationMs: 2500,
      childAge: 6,
    });
    expect(result.fillers).toBe(2);
    expect(result.fluencyScore).toBeLessThan(100);
  });

  it('detects consecutive word repetitions', () => {
    const result = analyzeSpeech({
      transcript: 'the the cat sat sat on the mat',
      targetResponse: 'the cat sat on the mat',
      exerciseType: 'SENTENCE_COMPLETION',
      latencyMs: 1800,
      durationMs: 2000,
      childAge: 6,
    });
    expect(result.repetitions).toBe(2);
    expect(result.fluencyScore).toBeLessThan(100);
  });

  it('clean transcript has no fillers or repetitions', () => {
    const result = analyzeSpeech({
      transcript: 'butterfly',
      targetResponse: 'butterfly',
      exerciseType: 'WORD_REPETITION',
      latencyMs: 1800,
      durationMs: 1200,
      childAge: 5,
    });
    expect(result.fillers).toBe(0);
    expect(result.repetitions).toBe(0);
  });
});

// ─── analyzeSpeech — output shape ────────────────────────────────────────────

describe('analyzeSpeech — output shape', () => {
  it('returns all required fields', () => {
    const result = analyzeSpeech({
      transcript: 'cat',
      targetResponse: 'cat',
      exerciseType: 'PICTURE_NAMING',
      latencyMs: 1000,
      durationMs: 800,
    });

    const requiredFields = [
      'transcript', 'targetResponse', 'exerciseType',
      'latencyMs', 'durationMs', 'wordCount', 'speakingRateWPM',
      'accuracy', 'articulationScore', 'fluencyScore', 'prosodyScore',
      'phonologicalScore', 'repetitions', 'fillers', 'pauseCount',
      'overallScore',
    ];
    for (const field of requiredFields) {
      expect(result).toHaveProperty(field);
    }
  });

  it('overallScore is clamped to 0–100', () => {
    const result = analyzeSpeech({
      transcript: '',
      targetResponse: 'some target that wont match',
      exerciseType: 'PICTURE_NAMING',
      latencyMs: 5000,
      durationMs: 0,
    });
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });
});
