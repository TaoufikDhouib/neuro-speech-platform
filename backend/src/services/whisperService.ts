import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { config } from '../config';

// Groq uses OpenAI-compatible SDK — just swap the baseURL
let groqClient: OpenAI | null = null;

function getGroq(): OpenAI {
  if (!groqClient) {
    if (!config.groqApiKey) {
      throw new Error('GROQ_API_KEY is not configured');
    }
    groqClient = new OpenAI({
      apiKey: config.groqApiKey,
      baseURL: 'https://api.groq.com/openai/v1',
    });
  }
  return groqClient;
}

export interface TranscriptionResult {
  text: string;
  words?: Array<{ word: string; start: number; end: number }>;
  duration?: number;
}

/**
 * Transcribe audio using Groq Whisper (free, 14 400 req/day).
 * Model: whisper-large-v3-turbo
 */
export async function transcribeAudio(filePath: string): Promise<TranscriptionResult> {
  const absolutePath = path.resolve(filePath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Audio file not found: ${absolutePath}`);
  }

  const groq = getGroq();

  try {
    const audioStream = fs.createReadStream(absolutePath);

    const response = await groq.audio.transcriptions.create({
      file: audioStream,
      model: 'whisper-large-v3-turbo',
      response_format: 'json',
      language: 'en',
    });

    return {
      text: response.text ?? '',
    };
  } catch (err: unknown) {
    const error = err as Error & { status?: number; code?: string };
    if (error.status === 401) throw new Error('Invalid GROQ_API_KEY');
    if (error.status === 429) throw new Error('Groq rate limit exceeded. Try again shortly.');
    if (error.code === 'ENOENT') throw new Error(`Audio file not found: ${filePath}`);
    throw new Error(`Transcription failed: ${error.message}`);
  }
}

/**
 * Generate clinical summary using Groq Llama 3.3 (free).
 */
export async function generateClinicalSummary(params: {
  childName: string;
  childAge: number;
  domains: Record<string, number>;
  riskLevel: string;
  flags: string[];
  sessionCount: number;
}): Promise<string> {
  const { childName, childAge, domains, riskLevel, flags, sessionCount } = params;
  const groq = getGroq();

  const domainText = Object.entries(domains)
    .map(([k, v]) => `${k}: ${v}/100`)
    .join(', ');

  const flagText = flags.length > 0
    ? `Identified concerns: ${flags.join('; ')}`
    : 'No significant concerns identified.';

  const prompt = `You are a pediatric speech-language pathologist writing a clinical progress note.

Child: ${childName}, Age: ${childAge} years
Sessions analyzed: ${sessionCount}
Overall risk level: ${riskLevel}
Domain scores: ${domainText}
${flagText}

Write a professional 3-4 sentence clinical summary paragraph that:
1. Summarizes the child's speech and language performance objectively
2. Notes any areas of concern with appropriate clinical language
3. Makes clear, actionable recommendations appropriate for the risk level
4. Uses language accessible to parents while remaining clinically accurate

Write in flowing paragraph form only. Be empathetic and constructive.`;

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 400,
      temperature: 0.4,
    });

    return completion.choices[0]?.message?.content?.trim() ?? 'Summary generation failed.';
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    throw new Error(`Groq summary generation failed: ${error.message}`);
  }
}
