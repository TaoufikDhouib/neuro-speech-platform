import { SpeechAnalysis, AgeSpeakingNorms } from '../types';

// ─── Levenshtein distance ──────────────────────────────────────────────────
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

function stringSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  const dist = levenshtein(a.toLowerCase(), b.toLowerCase());
  return 1 - dist / maxLen;
}

// ─── Word tokenisation ────────────────────────────────────────────────────
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .split(/\s+/)
    .filter(Boolean);
}

// ─── Word accuracy ────────────────────────────────────────────────────────
function computeWordAccuracy(transcript: string, target: string): number {
  const transcriptWords = tokenize(transcript);
  const targetWords = tokenize(target);

  if (targetWords.length === 0) return 100;

  let matched = 0;
  const usedIndices = new Set<number>();

  for (const tw of transcriptWords) {
    let bestSim = 0;
    let bestIdx = -1;

    for (let i = 0; i < targetWords.length; i++) {
      if (usedIndices.has(i)) continue;
      const sim = stringSimilarity(tw, targetWords[i]);
      if (sim > bestSim && sim >= 0.75) {
        bestSim = sim;
        bestIdx = i;
      }
    }

    if (bestIdx !== -1) {
      matched += bestSim;
      usedIndices.add(bestIdx);
    }
  }

  return Math.min(100, Math.round((matched / targetWords.length) * 100));
}

// ─── Fluency markers ──────────────────────────────────────────────────────
const FILLER_WORDS = new Set(['um', 'uh', 'ah', 'er', 'hmm', 'like', 'uhh', 'umm', 'err']);

function detectFluencyMarkers(transcript: string): {
  repetitions: number;
  fillers: number;
} {
  const words = tokenize(transcript);
  let repetitions = 0;
  let fillers = 0;

  for (let i = 0; i < words.length; i++) {
    // Filler detection
    if (FILLER_WORDS.has(words[i])) {
      fillers++;
    }
    // Consecutive word repetition detection
    if (i > 0 && words[i] === words[i - 1] && !FILLER_WORDS.has(words[i])) {
      repetitions++;
    }
    // Part-word repetition heuristic (e.g. "b-b-ball" → already one word, skip)
  }

  return { repetitions, fillers };
}

// ─── Pause estimation ─────────────────────────────────────────────────────
function estimatePauseCount(wordCount: number, durationMs: number): number {
  if (wordCount === 0 || durationMs === 0) return 0;
  const durationSec = durationMs / 1000;
  const expectedSec = wordCount * 0.4; // ~0.4s per word at normal pace
  const extraSec = Math.max(0, durationSec - expectedSec);
  // Estimate one pause per 2 seconds of extra time
  return Math.round(extraSec / 2);
}

// ─── Articulation score ───────────────────────────────────────────────────
function computeArticulationScore(transcript: string, target: string): number {
  // Character-level similarity between cleaned strings
  const cleanTranscript = tokenize(transcript).join(' ');
  const cleanTarget = tokenize(target).join(' ');
  const sim = stringSimilarity(cleanTranscript, cleanTarget);
  return Math.round(sim * 100);
}

// ─── Prosody score ────────────────────────────────────────────────────────
function computeProsodyScore(wpm: number, age: number): number {
  const norms = getAgeSpeakingNorms(age);
  if (wpm === 0) return 50;

  if (wpm >= norms.minWPM && wpm <= norms.maxWPM) return 95;

  const deviation = wpm < norms.minWPM
    ? (norms.minWPM - wpm) / norms.minWPM
    : (wpm - norms.maxWPM) / norms.maxWPM;

  return Math.max(0, Math.round(100 - deviation * 100));
}

// ─── Phonological score ───────────────────────────────────────────────────
function computePhonologicalScore(
  transcript: string,
  target: string,
  exerciseType: string
): number {
  if (exerciseType === 'RHYME_DETECTION' || exerciseType === 'PHONEME_ISOLATION') {
    const t = transcript.toLowerCase().trim();
    const expected = target.toLowerCase().trim();

    if (t === expected) return 100;
    if (t.startsWith(expected) || expected.startsWith(t)) return 80;
    // Check if the answer is contained in response
    if (t.includes(expected)) return 70;

    return 0;
  }

  // For other types, use word accuracy as proxy
  return computeWordAccuracy(transcript, target);
}

// ─── Fluency score ────────────────────────────────────────────────────────
function computeFluencyScore(
  repetitions: number,
  fillers: number,
  wordCount: number,
  pauseCount: number
): number {
  if (wordCount === 0) return 50;

  const repetitionRate = repetitions / wordCount;
  const fillerRate = fillers / wordCount;
  const pausePenalty = Math.min(20, pauseCount * 2);

  const score =
    100 -
    Math.round(repetitionRate * 200) -
    Math.round(fillerRate * 150) -
    pausePenalty;

  return Math.max(0, Math.min(100, score));
}

// ─── Age-based speaking norms ─────────────────────────────────────────────
export function getAgeSpeakingNorms(age: number): AgeSpeakingNorms {
  // Based on clinical speech-language pathology norms
  const norms: Record<number, AgeSpeakingNorms> = {
    3:  { minWPM: 50,  maxWPM: 130, minLatencyMs: 500,  maxLatencyMs: 4000, typicalAccuracy: 70 },
    4:  { minWPM: 70,  maxWPM: 150, minLatencyMs: 400,  maxLatencyMs: 3500, typicalAccuracy: 75 },
    5:  { minWPM: 80,  maxWPM: 160, minLatencyMs: 300,  maxLatencyMs: 3000, typicalAccuracy: 80 },
    6:  { minWPM: 90,  maxWPM: 170, minLatencyMs: 300,  maxLatencyMs: 2500, typicalAccuracy: 85 },
    7:  { minWPM: 100, maxWPM: 180, minLatencyMs: 250,  maxLatencyMs: 2000, typicalAccuracy: 88 },
    8:  { minWPM: 110, maxWPM: 190, minLatencyMs: 200,  maxLatencyMs: 1800, typicalAccuracy: 90 },
    9:  { minWPM: 115, maxWPM: 195, minLatencyMs: 200,  maxLatencyMs: 1500, typicalAccuracy: 92 },
    10: { minWPM: 120, maxWPM: 200, minLatencyMs: 150,  maxLatencyMs: 1500, typicalAccuracy: 95 },
  };

  const clampedAge = Math.min(10, Math.max(3, age));
  return norms[clampedAge] ?? norms[5];
}

// ─── Overall score weights by exercise type ───────────────────────────────
function getWeightsForType(exerciseType: string): Record<string, number> {
  const weights: Record<string, Record<string, number>> = {
    PICTURE_NAMING: {
      accuracy: 0.5,
      articulationScore: 0.3,
      fluencyScore: 0.1,
      prosodyScore: 0.1,
    },
    WORD_REPETITION: {
      accuracy: 0.4,
      articulationScore: 0.4,
      fluencyScore: 0.1,
      prosodyScore: 0.1,
    },
    SENTENCE_COMPLETION: {
      accuracy: 0.6,
      articulationScore: 0.2,
      fluencyScore: 0.1,
      prosodyScore: 0.1,
    },
    RHYME_DETECTION: {
      phonologicalScore: 0.8,
      fluencyScore: 0.1,
      prosodyScore: 0.1,
    },
    PHONEME_ISOLATION: {
      phonologicalScore: 0.8,
      articulationScore: 0.1,
      fluencyScore: 0.1,
    },
    RAPID_NAMING: {
      accuracy: 0.4,
      articulationScore: 0.2,
      fluencyScore: 0.2,
      prosodyScore: 0.2,
    },
    STORY_RETELLING: {
      accuracy: 0.5,
      fluencyScore: 0.2,
      articulationScore: 0.2,
      prosodyScore: 0.1,
    },
  };

  return weights[exerciseType] ?? weights['PICTURE_NAMING'];
}

// ─── Main analysis function ───────────────────────────────────────────────
export function analyzeSpeech(params: {
  transcript: string;
  targetResponse: string;
  exerciseType: string;
  latencyMs: number;
  durationMs: number;
  childAge?: number;
}): SpeechAnalysis {
  const { transcript, targetResponse, exerciseType, latencyMs, durationMs, childAge = 6 } = params;

  const words = tokenize(transcript);
  const wordCount = words.length;

  // Speaking rate in WPM
  const durationMinutes = durationMs / 1000 / 60;
  const speakingRateWPM = durationMinutes > 0
    ? Math.round(wordCount / durationMinutes)
    : 0;

  const accuracy = computeWordAccuracy(transcript, targetResponse);
  const articulationScore = computeArticulationScore(transcript, targetResponse);
  const prosodyScore = computeProsodyScore(speakingRateWPM, childAge);
  const phonologicalScore = computePhonologicalScore(transcript, targetResponse, exerciseType);

  const { repetitions, fillers } = detectFluencyMarkers(transcript);
  const pauseCount = estimatePauseCount(wordCount, durationMs);
  const fluencyScore = computeFluencyScore(repetitions, fillers, wordCount, pauseCount);

  // Weighted overall score
  const weights = getWeightsForType(exerciseType);
  const scoreMap: Record<string, number> = {
    accuracy,
    articulationScore,
    fluencyScore,
    prosodyScore,
    phonologicalScore,
  };

  let overallScore = 0;
  for (const [key, weight] of Object.entries(weights)) {
    overallScore += (scoreMap[key] ?? 0) * weight;
  }
  overallScore = Math.round(overallScore);

  return {
    transcript,
    targetResponse,
    exerciseType,
    latencyMs,
    durationMs,
    wordCount,
    speakingRateWPM,
    accuracy,
    articulationScore,
    fluencyScore,
    prosodyScore,
    phonologicalScore,
    repetitions,
    fillers,
    pauseCount,
    overallScore,
  };
}
