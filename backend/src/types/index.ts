import { Request } from 'express';

export interface JwtPayload {
  userId: string;
  role: string;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export interface SpeechAnalysis {
  transcript: string;
  targetResponse: string;
  exerciseType: string;
  latencyMs: number;
  durationMs: number;
  wordCount: number;
  speakingRateWPM: number;
  accuracy: number;          // 0-100: how close to expected
  articulationScore: number; // 0-100
  fluencyScore: number;      // 0-100: based on repetitions/pauses
  prosodyScore: number;      // 0-100: rate/rhythm normality
  phonologicalScore: number; // 0-100: for phoneme tasks
  repetitions: number;       // count of word repetitions (stutter marker)
  fillers: number;           // um, uh, ah count
  pauseCount: number;        // silence gaps
  overallScore: number;      // weighted average
}

export interface NeuralRiskDomains {
  articulation: number;           // 0-100 (100 = no concern)
  fluency: number;
  phonologicalAwareness: number;
  vocabulary: number;
  processingSpeed: number;
  workingMemory: number;
}

export interface AgeSpeakingNorms {
  minWPM: number;
  maxWPM: number;
  maxLatencyMs: number;
  minLatencyMs: number;
  typicalAccuracy: number;
}

export interface SessionCompletionResult {
  session: object;
  xpEarned: number;
  levelUp: boolean;
  newLevel: number;
}
