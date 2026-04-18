import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { AuthRequest } from '../types';
import { calculateLevel, xpProgressInLevel } from '../services/gamification';

const router = Router();

// ─── Validation schemas ───────────────────────────────────────────────────

const createChildSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  age: z.number().int().min(2).max(12),
  avatarSeed: z.string().optional().default('default'),
});

const updateChildSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  age: z.number().int().min(2).max(12).optional(),
  avatarSeed: z.string().optional(),
});

// ─── GET /api/children ────────────────────────────────────────────────────

router.get('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const children = await prisma.child.findMany({
      where: { parentId: userId },
      include: {
        _count: { select: { sessions: true } },
        reports: {
          orderBy: { generatedAt: 'desc' },
          take: 1,
          select: { riskLevel: true, generatedAt: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const enriched = children.map((child) => ({
      ...child,
      level: calculateLevel(child.xp),
      xpProgress: xpProgressInLevel(child.xp),
      latestRiskLevel: child.reports[0]?.riskLevel ?? null,
    }));

    res.json({ children: enriched });
  } catch (err) {
    console.error('[children/list]', err);
    res.status(500).json({ error: 'Failed to fetch children' });
  }
});

// ─── POST /api/children ───────────────────────────────────────────────────

router.post('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const body = createChildSchema.parse(req.body);

    const child = await prisma.child.create({
      data: {
        name: body.name,
        age: body.age,
        avatarSeed: body.avatarSeed ?? 'default',
        parentId: userId,
      },
    });

    res.status(201).json({
      child: {
        ...child,
        level: calculateLevel(child.xp),
        xpProgress: xpProgressInLevel(child.xp),
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: err.errors });
      return;
    }
    console.error('[children/create]', err);
    res.status(500).json({ error: 'Failed to create child profile' });
  }
});

// ─── GET /api/children/:id ────────────────────────────────────────────────

router.get('/:id', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const child = await prisma.child.findFirst({
      where: { id, parentId: userId },
      include: {
        sessions: {
          orderBy: { startedAt: 'desc' },
          take: 10,
          include: {
            exercises: {
              select: {
                id: true,
                type: true,
                score: true,
                xpEarned: true,
                completedAt: true,
              },
            },
          },
        },
        reports: {
          orderBy: { generatedAt: 'desc' },
          take: 1,
        },
        _count: { select: { sessions: true } },
      },
    });

    if (!child) {
      res.status(404).json({ error: 'Child not found' });
      return;
    }

    const level = calculateLevel(child.xp);
    const xpProgress = xpProgressInLevel(child.xp);

    res.json({
      child: {
        ...child,
        level,
        xpProgress,
        latestReport: child.reports[0] ?? null,
      },
    });
  } catch (err) {
    console.error('[children/get]', err);
    res.status(500).json({ error: 'Failed to fetch child profile' });
  }
});

// ─── PATCH /api/children/:id ──────────────────────────────────────────────

router.patch('/:id', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const body = updateChildSchema.parse(req.body);

    const existing = await prisma.child.findFirst({
      where: { id, parentId: userId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Child not found' });
      return;
    }

    const updated = await prisma.child.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.age !== undefined && { age: body.age }),
        ...(body.avatarSeed && { avatarSeed: body.avatarSeed }),
      },
    });

    res.json({
      child: {
        ...updated,
        level: calculateLevel(updated.xp),
        xpProgress: xpProgressInLevel(updated.xp),
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: err.errors });
      return;
    }
    console.error('[children/update]', err);
    res.status(500).json({ error: 'Failed to update child profile' });
  }
});

// ─── DELETE /api/children/:id ─────────────────────────────────────────────

router.delete('/:id', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const existing = await prisma.child.findFirst({
      where: { id, parentId: userId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Child not found' });
      return;
    }

    await prisma.child.delete({ where: { id } });

    res.json({ message: 'Child profile deleted successfully' });
  } catch (err) {
    console.error('[children/delete]', err);
    res.status(500).json({ error: 'Failed to delete child profile' });
  }
});

// ─── GET /api/children/:id/stats ──────────────────────────────────────────

router.get('/:id/stats', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const child = await prisma.child.findFirst({
      where: { id, parentId: userId },
    });

    if (!child) {
      res.status(404).json({ error: 'Child not found' });
      return;
    }

    // Get all completed sessions with their exercise scores
    const sessions = await prisma.session.findMany({
      where: { childId: id, completedAt: { not: null } },
      include: {
        exercises: {
          select: { score: true, type: true, xpEarned: true, completedAt: true },
        },
      },
      orderBy: { startedAt: 'asc' },
    });

    const totalSessions = sessions.length;
    const totalExercises = sessions.reduce((sum, s) => sum + s.exercises.length, 0);

    const allScores = sessions
      .flatMap((s) => s.exercises)
      .filter((e) => e.score !== null)
      .map((e) => e.score as number);

    const averageScore =
      allScores.length > 0
        ? Math.round(allScores.reduce((sum, s) => sum + s, 0) / allScores.length)
        : 0;

    // Score trend — last 10 sessions
    const recentScores = sessions
      .slice(-10)
      .map((s) => ({
        date: s.startedAt,
        score: s.score ?? 0,
        xpEarned: s.xpEarned,
      }));

    res.json({
      stats: {
        totalSessions,
        totalExercises,
        averageScore,
        totalXP: child.xp,
        level: calculateLevel(child.xp),
        streak: child.streak,
        hearts: child.hearts,
        recentScores,
        xpProgress: xpProgressInLevel(child.xp),
      },
    });
  } catch (err) {
    console.error('[children/stats]', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ─── GET /api/children/:id/badges ────────────────────────────────────────────

router.get('/:id/badges', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const child = await prisma.child.findFirst({ where: { id, parentId: userId } });
    if (!child) {
      res.status(404).json({ error: 'Child not found' });
      return;
    }

    const badges = await prisma.badge.findMany({
      where: { childId: id },
      orderBy: { earnedAt: 'desc' },
    });

    res.json({ badges });
  } catch (err) {
    console.error('[children/badges]', err);
    res.status(500).json({ error: 'Failed to fetch badges' });
  }
});

export default router;
