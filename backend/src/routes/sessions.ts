import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { AuthRequest } from '../types';
import { getExercisesForAge } from '../services/exerciseBank';
import {
  calculateLevel,
  calculateSessionXP,
  checkLevelUp,
  updateStreak,
  xpProgressInLevel,
} from '../services/gamification';
const router = Router();

// ─── Validation schemas ───────────────────────────────────────────────────

const createSessionSchema = z.object({
  childId: z.string().uuid('Invalid child ID'),
});

// ─── POST /api/sessions ───────────────────────────────────────────────────

router.post('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const body = createSessionSchema.parse(req.body);

    // Verify child belongs to user
    const child = await prisma.child.findFirst({
      where: { id: body.childId, parentId: userId },
    });

    if (!child) {
      res.status(404).json({ error: 'Child not found' });
      return;
    }

    // Generate exercises based on child's age
    const templates = getExercisesForAge(child.age, 5);

    // Create session with exercises
    const session = await prisma.session.create({
      data: {
        childId: child.id,
        exercises: {
          create: templates.map((t) => ({
            type: t.type,
            prompt: t.prompt,
            targetResponse: t.targetResponse,
          })),
        },
      },
      include: {
        exercises: {
          orderBy: { completedAt: 'asc' },
        },
      },
    });

    res.status(201).json({ session });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: err.errors });
      return;
    }
    console.error('[sessions/create]', err);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// ─── GET /api/sessions/:id ────────────────────────────────────────────────

router.get('/:id', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const session = await prisma.session.findUnique({
      where: { id },
      include: {
        child: true,
        exercises: {
          orderBy: { completedAt: 'asc' },
        },
      },
    });

    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    // Verify access — session belongs to user's child
    if (session.child.parentId !== userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    res.json({ session });
  } catch (err) {
    console.error('[sessions/get]', err);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// ─── GET /api/sessions (list for a child) ────────────────────────────────

router.get('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { childId, limit = '20', offset = '0' } = req.query as Record<string, string>;

    if (!childId) {
      res.status(400).json({ error: 'childId query parameter is required' });
      return;
    }

    // Verify child belongs to user
    const child = await prisma.child.findFirst({
      where: { id: childId, parentId: userId },
    });

    if (!child) {
      res.status(404).json({ error: 'Child not found' });
      return;
    }

    const sessions = await prisma.session.findMany({
      where: { childId },
      orderBy: { startedAt: 'desc' },
      take: Math.min(parseInt(limit, 10), 100),
      skip: parseInt(offset, 10),
      include: {
        exercises: {
          select: {
            id: true,
            type: true,
            score: true,
            xpEarned: true,
          },
        },
      },
    });

    const total = await prisma.session.count({ where: { childId } });

    res.json({ sessions, total });
  } catch (err) {
    console.error('[sessions/list]', err);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// ─── POST /api/sessions/:id/complete ─────────────────────────────────────

router.post('/:id/complete', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const session = await prisma.session.findUnique({
      where: { id },
      include: {
        child: true,
        exercises: true,
      },
    });

    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    if (session.child.parentId !== userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    if (session.completedAt) {
      res.status(409).json({ error: 'Session already completed' });
      return;
    }

    const child = session.child;

    // Calculate session score from completed exercises
    const scoredExercises = session.exercises.filter(
      (e) => e.score !== null
    );

    const sessionScore =
      scoredExercises.length > 0
        ? scoredExercises.reduce((sum, e) => sum + (e.score ?? 0), 0) /
          scoredExercises.length
        : 0;

    // Calculate XP with streak multiplier
    const exerciseScores = scoredExercises.map((e) => ({
      score: e.score ?? 0,
      type: e.type,
    }));

    const { totalXP } = calculateSessionXP(exerciseScores, child.streak);

    const oldXP = child.xp;
    const newXP = oldXP + totalXP;
    const newLevel = calculateLevel(newXP);
    const leveledUp = checkLevelUp(oldXP, newXP);

    // Update streak
    const { newStreak } = updateStreak(child.lastActive, child.streak);

    // Atomically complete session + update child — both succeed or both roll back
    const [updatedSession] = await prisma.$transaction([
      prisma.session.update({
        where: { id },
        data: {
          completedAt: new Date(),
          score: Math.round(sessionScore),
          xpEarned: totalXP,
        },
        include: { exercises: true },
      }),
      prisma.child.update({
        where: { id: child.id },
        data: {
          xp: newXP,
          level: newLevel,
          streak: newStreak,
          lastActive: new Date(),
        },
      }),
    ]);

    res.json({
      session: updatedSession,
      xpEarned: totalXP,
      levelUp: leveledUp,
      newLevel,
      xpProgress: xpProgressInLevel(newXP),
      streak: newStreak,
    });
  } catch (err) {
    console.error('[sessions/complete]', err);
    res.status(500).json({ error: 'Failed to complete session' });
  }
});

export default router;
