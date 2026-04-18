import { SpeechAnalysis, NeuralRiskDomains } from '../types';
import { getAgeSpeakingNorms } from './speechAnalysis';

type ExerciseWithAnalysis = {
  type: string;
  analysis: SpeechAnalysis;
};

function average(nums: number[]): number {
  if (nums.length === 0) return 75; // Default to "normal" if no data
  return nums.reduce((sum, n) => sum + n, 0) / nums.length;
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

// ─── Domain computation ───────────────────────────────────────────────────

export function computeRiskDomains(
  exercises: ExerciseWithAnalysis[]
): NeuralRiskDomains {
  // ── Articulation ──
  const articulationExercises = exercises.filter(
    (e) => e.type === 'PICTURE_NAMING' || e.type === 'WORD_REPETITION'
  );
  const articulation = clamp(
    Math.round(average(articulationExercises.map((e) => e.analysis.articulationScore)))
  );

  // ── Fluency ──
  // Invert repetition+filler rates
  const fluencyScores = exercises.map((e) => e.analysis.fluencyScore);
  const fluency = clamp(Math.round(average(fluencyScores)));

  // ── Phonological Awareness ──
  const phonoExercises = exercises.filter(
    (e) => e.type === 'RHYME_DETECTION' || e.type === 'PHONEME_ISOLATION'
  );
  const phonologicalAwareness = clamp(
    Math.round(average(phonoExercises.map((e) => e.analysis.phonologicalScore)))
  );

  // ── Vocabulary ──
  const vocabExercises = exercises.filter(
    (e) => e.type === 'PICTURE_NAMING' || e.type === 'SENTENCE_COMPLETION'
  );
  const vocabulary = clamp(
    Math.round(average(vocabExercises.map((e) => e.analysis.accuracy)))
  );

  // ── Processing Speed ──
  // Based on latency relative to age norms — calculated from available analyses
  const latencies = exercises
    .filter((e) => e.analysis.latencyMs > 0)
    .map((e) => e.analysis.latencyMs);

  let processingSpeed = 75; // default
  if (latencies.length > 0) {
    const avgLatency = average(latencies);
    // Use age 6 as default norm if not specified; real call sites pass childAge separately
    const norms = getAgeSpeakingNorms(6);
    if (avgLatency <= norms.maxLatencyMs) {
      const ratio = avgLatency / norms.maxLatencyMs;
      processingSpeed = clamp(Math.round(100 - ratio * 50));
    } else {
      const overage = (avgLatency - norms.maxLatencyMs) / norms.maxLatencyMs;
      processingSpeed = clamp(Math.round(50 - overage * 50));
    }
  }

  // ── Working Memory ──
  const memoryExercises = exercises.filter(
    (e) => e.type === 'STORY_RETELLING' || e.type === 'WORD_REPETITION'
  );
  const workingMemory = clamp(
    Math.round(average(memoryExercises.map((e) => e.analysis.accuracy)))
  );

  return {
    articulation,
    fluency,
    phonologicalAwareness,
    vocabulary,
    processingSpeed,
    workingMemory,
  };
}

export function computeRiskDomainsWithAge(
  exercises: ExerciseWithAnalysis[],
  childAge: number
): NeuralRiskDomains {
  const domains = computeRiskDomains(exercises);

  // Override processingSpeed with age-appropriate norms
  const latencies = exercises
    .filter((e) => e.analysis.latencyMs > 0)
    .map((e) => e.analysis.latencyMs);

  if (latencies.length > 0) {
    const avgLatency = average(latencies);
    const norms = getAgeSpeakingNorms(childAge);
    if (avgLatency <= norms.maxLatencyMs) {
      const ratio = avgLatency / norms.maxLatencyMs;
      domains.processingSpeed = clamp(Math.round(100 - ratio * 50));
    } else {
      const overage = (avgLatency - norms.maxLatencyMs) / norms.maxLatencyMs;
      domains.processingSpeed = clamp(Math.round(50 - overage * 50));
    }
  }

  return domains;
}

// ─── Risk level assessment ────────────────────────────────────────────────

export function assessRiskLevel(domains: NeuralRiskDomains): string {
  const scores = Object.values(domains);
  const minScore = Math.min(...scores);
  const avgScore = average(scores);

  if (minScore < 30) return 'REFER';
  if (minScore < 50) return 'HIGH';
  if (minScore < 75 || avgScore < 70) return 'MODERATE';
  return 'LOW';
}

// ─── Flag identification ──────────────────────────────────────────────────

export function identifyFlags(
  domains: NeuralRiskDomains,
  exercises: ExerciseWithAnalysis[],
  childAge: number
): string[] {
  const flags: string[] = [];
  const norms = getAgeSpeakingNorms(childAge);

  // Articulation flags
  if (domains.articulation < 30) {
    flags.push('Severe articulation difficulties — significant sound substitutions or omissions detected');
  } else if (domains.articulation < 50) {
    flags.push('Moderate articulation errors — difficulty producing multi-syllabic words accurately');
  } else if (domains.articulation < 70) {
    flags.push('Mild articulation concerns — some consonant errors noted (possible /r/, /l/, /s/ difficulties)');
  }

  // Fluency flags
  const totalWords = exercises.reduce((sum, e) => sum + e.analysis.wordCount, 0);
  const totalRepetitions = exercises.reduce((sum, e) => sum + e.analysis.repetitions, 0);
  const totalFillers = exercises.reduce((sum, e) => sum + e.analysis.fillers, 0);

  if (totalWords > 0) {
    const repetitionRate = totalRepetitions / totalWords;
    const fillerRate = totalFillers / totalWords;

    if (repetitionRate > 0.05) {
      flags.push(`High word repetition rate detected (${Math.round(repetitionRate * 100)}%) — possible fluency disorder or stuttering`);
    } else if (repetitionRate > 0.03) {
      flags.push(`Elevated repetition rate (${Math.round(repetitionRate * 100)}%) — monitor for fluency patterns`);
    }

    if (fillerRate > 0.1) {
      flags.push(`Frequent filler words detected (${Math.round(fillerRate * 100)}%) — may indicate word-finding difficulties`);
    }
  }

  if (domains.fluency < 50) {
    flags.push('Fluency significantly below age expectations — recommend speech-language evaluation');
  }

  // Phonological awareness flags
  if (domains.phonologicalAwareness < 40) {
    flags.push('Phonological awareness markedly below age norms — risk factor for reading/spelling difficulties');
  } else if (domains.phonologicalAwareness < 60) {
    flags.push('Phonological awareness below expected range — monitor literacy development');
  }

  // Vocabulary flags
  if (domains.vocabulary < 50) {
    flags.push('Vocabulary knowledge significantly below age norms — possible language delay');
  } else if (domains.vocabulary < 70) {
    flags.push('Vocabulary slightly below expected range for age');
  }

  // Processing speed flags
  const slowExercises = exercises.filter(
    (e) => e.analysis.latencyMs > norms.maxLatencyMs
  );
  const slowPct = exercises.length > 0 ? slowExercises.length / exercises.length : 0;

  if (slowPct >= 0.7) {
    flags.push(`Slow processing speed across ${Math.round(slowPct * 100)}% of tasks — may indicate processing speed deficit`);
  } else if (domains.processingSpeed < 50) {
    flags.push('Processing speed below age norms — extended response latency observed');
  }

  // Working memory flags
  if (domains.workingMemory < 50) {
    flags.push('Working memory difficulties — poor retention on sentence and story recall tasks');
  } else if (domains.workingMemory < 70) {
    flags.push('Working memory slightly below average — monitor on complex recall tasks');
  }

  // Overall risk summary flags
  const domainValues = Object.values(domains);
  const lowDomains = domainValues.filter((v) => v < 70).length;
  if (lowDomains >= 4) {
    flags.push('Multiple speech-language domains affected — comprehensive evaluation recommended');
  }

  // Age-specific flags
  if (childAge >= 7 && domains.phonologicalAwareness < 70) {
    flags.push('Phonological awareness below expectations for school-age child — literacy support recommended');
  }

  if (childAge <= 5 && domains.articulation < 60) {
    flags.push('Articulation below developmental norms for age — early intervention may be beneficial');
  }

  return flags;
}

// ─── Aggregate across multiple sessions ───────────────────────────────────

export function aggregateDomains(
  domainsList: NeuralRiskDomains[]
): NeuralRiskDomains {
  if (domainsList.length === 0) {
    return {
      articulation: 75,
      fluency: 75,
      phonologicalAwareness: 75,
      vocabulary: 75,
      processingSpeed: 75,
      workingMemory: 75,
    };
  }

  return {
    articulation: clamp(Math.round(average(domainsList.map((d) => d.articulation)))),
    fluency: clamp(Math.round(average(domainsList.map((d) => d.fluency)))),
    phonologicalAwareness: clamp(Math.round(average(domainsList.map((d) => d.phonologicalAwareness)))),
    vocabulary: clamp(Math.round(average(domainsList.map((d) => d.vocabulary)))),
    processingSpeed: clamp(Math.round(average(domainsList.map((d) => d.processingSpeed)))),
    workingMemory: clamp(Math.round(average(domainsList.map((d) => d.workingMemory)))),
  };
}
