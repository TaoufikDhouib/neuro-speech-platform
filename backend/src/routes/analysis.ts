import { Router, Response } from 'express';
import { z } from 'zod';
import path from 'path';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { uploadAudio } from '../middleware/upload';
import { AuthRequest } from '../types';
import { analyzeSpeech } from '../services/speechAnalysis';
import { transcribeAudio } from '../services/whisperService';
import { calculateXP } from '../services/gamification';
import { config } from '../config';

const router = Router();

// ─── Validation schemas ───────────────────────────────────────────────────

const evaluateSchema = z.object({
  exerciseId: z.string().uuid('Invalid exercise ID'),
  transcript: z.string().min(1, 'Transcript is required'),
  latencyMs: z.number().int().min(0).max(60000),
  durationMs: z.number().int().min(0).max(120000),
  childAge: z.number().int().min(2).max(12).optional(),
});

// ─── Helper: verify exercise access ──────────────────────────────────────

async function getExerciseWithAccess(exerciseId: string, userId: string) {
  const exercise = await prisma.exercise.findUnique({
    where: { id: exerciseId },
    include: {
      session: {
        include: {
          child: {
            select: { parentId: true, age: true, id: true },
          },
        },
      },
    },
  });

  if (!exercise) return null;
  if (exercise.session.child.parentId !== userId) return null;

  return exercise;
}

// ─── POST /api/analysis/transcribe ───────────────────────────────────────

router.post(
  '/transcribe',
  requireAuth,
  uploadAudio.single('audio'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    const startTime = Date.now();

    try {
      const userId = req.user!.userId;
      const file = req.file;
      const exerciseId = req.body.exerciseId as string;

      if (!file) {
        res.status(400).json({ error: 'Audio file is required' });
        return;
      }

      if (!exerciseId) {
        res.status(400).json({ error: 'exerciseId is required' });
        return;
      }

      // Validate exerciseId format
      if (!/^[0-9a-f-]{36}$/.test(exerciseId)) {
        res.status(400).json({ error: 'Invalid exerciseId format' });
        return;
      }

      const exercise = await getExerciseWithAccess(exerciseId, userId);
      if (!exercise) {
        res.status(404).json({ error: 'Exercise not found or access denied' });
        return;
      }

      // Transcribe via Whisper
      const filePath = file.path;
      const audioUrl = `/${config.uploadDir}/${path.basename(filePath)}`;

      let transcriptionResult: Awaited<ReturnType<typeof transcribeAudio>>;
      try {
        transcriptionResult = await transcribeAudio(filePath);
      } catch (transcribeErr) {
        console.error('[analysis/transcribe] Whisper error:', transcribeErr);
        res.status(502).json({
          error: 'Transcription service unavailable',
          details: (transcribeErr as Error).message,
        });
        return;
      }

      const latencyMs = Date.now() - startTime;

      // Update exercise with transcript and audio URL
      await prisma.exercise.update({
        where: { id: exerciseId },
        data: {
          transcript: transcriptionResult.text,
          audioUrl,
          latencyMs,
          durationMs: transcriptionResult.duration
            ? Math.round(transcriptionResult.duration * 1000)
            : undefined,
        },
      });

      res.json({
        transcript: transcriptionResult.text,
        audioUrl,
        latencyMs,
        durationMs: transcriptionResult.duration
          ? Math.round(transcriptionResult.duration * 1000)
          : null,
        words: transcriptionResult.words ?? [],
      });
    } catch (err) {
      console.error('[analysis/transcribe]', err);
      res.status(500).json({ error: 'Transcription failed' });
    }
  }
);

// ─── POST /api/analysis/evaluate ─────────────────────────────────────────

router.post('/evaluate', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const body = evaluateSchema.parse(req.body);

    const exercise = await getExerciseWithAccess(body.exerciseId, userId);
    if (!exercise) {
      res.status(404).json({ error: 'Exercise not found or access denied' });
      return;
    }

    const childAge = body.childAge ?? exercise.session.child.age;

    // Run speech analysis
    const analysis = analyzeSpeech({
      transcript: body.transcript,
      targetResponse: exercise.targetResponse,
      exerciseType: exercise.type,
      latencyMs: body.latencyMs,
      durationMs: body.durationMs,
      childAge,
    });

    // Calculate XP for this exercise
    const xpEarned = calculateXP(analysis.overallScore, exercise.type);

    // Persist analysis, score, latency, duration, XP
    const updatedExercise = await prisma.exercise.update({
      where: { id: exercise.id },
      data: {
        transcript: body.transcript,
        analysis: JSON.stringify(analysis),
        score: analysis.overallScore,
        xpEarned,
        latencyMs: body.latencyMs,
        durationMs: body.durationMs,
      },
    });

    res.json({
      analysis,
      score: analysis.overallScore,
      xpEarned,
      exercise: updatedExercise,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: err.errors });
      return;
    }
    console.error('[analysis/evaluate]', err);
    res.status(500).json({ error: 'Evaluation failed' });
  }
});

// ─── GET /api/analysis/exercise/:id ──────────────────────────────────────

router.get('/exercise/:id', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const exercise = await getExerciseWithAccess(id, userId);
    if (!exercise) {
      res.status(404).json({ error: 'Exercise not found or access denied' });
      return;
    }

    res.json({ exercise });
  } catch (err) {
    console.error('[analysis/exercise/get]', err);
    res.status(500).json({ error: 'Failed to fetch exercise' });
  }
});

export default router;
