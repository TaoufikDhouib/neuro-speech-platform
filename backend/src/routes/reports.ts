import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { AuthRequest, SpeechAnalysis, NeuralRiskDomains } from '../types';
import {
  computeRiskDomainsWithAge,
  assessRiskLevel,
  identifyFlags,
  aggregateDomains,
} from '../services/neuralScoring';
import { generateClinicalSummary } from '../services/whisperService';

const router = Router();

// ─── Helpers ──────────────────────────────────────────────────────────────

async function verifyChildAccess(childId: string, userId: string) {
  return prisma.child.findFirst({
    where: { id: childId, parentId: userId },
  });
}

// ─── GET /api/reports/:childId ────────────────────────────────────────────

router.get('/:childId', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { childId } = req.params;

    const child = await verifyChildAccess(childId, userId);
    if (!child) {
      res.status(404).json({ error: 'Child not found' });
      return;
    }

    const reports = await prisma.neuroReport.findMany({
      where: { childId },
      orderBy: { generatedAt: 'desc' },
    });

    res.json({ reports });
  } catch (err) {
    console.error('[reports/list]', err);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// ─── GET /api/reports/:childId/:reportId ─────────────────────────────────

router.get('/:childId/:reportId', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { childId, reportId } = req.params;

    const child = await verifyChildAccess(childId, userId);
    if (!child) {
      res.status(404).json({ error: 'Child not found' });
      return;
    }

    const report = await prisma.neuroReport.findFirst({
      where: { id: reportId, childId },
    });

    if (!report) {
      res.status(404).json({ error: 'Report not found' });
      return;
    }

    res.json({ report });
  } catch (err) {
    console.error('[reports/get]', err);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

// ─── POST /api/reports/:childId/generate ─────────────────────────────────

router.post(
  '/:childId/generate',
  requireAuth,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const { childId } = req.params;

      const child = await verifyChildAccess(childId, userId);
      if (!child) {
        res.status(404).json({ error: 'Child not found' });
        return;
      }

      // Fetch last 20 completed sessions with exercises and analyses
      const sessions = await prisma.session.findMany({
        where: {
          childId,
          completedAt: { not: null },
        },
        orderBy: { startedAt: 'desc' },
        take: 20,
        include: {
          exercises: {
            where: { analysis: { not: null } },
          },
        },
      });

      if (sessions.length === 0) {
        res.status(400).json({
          error: 'No completed sessions found. Complete at least one session to generate a report.',
        });
        return;
      }

      // Collect all exercises with valid analyses
      const allExercises: Array<{ type: string; analysis: SpeechAnalysis }> = [];

      for (const session of sessions) {
        for (const exercise of session.exercises) {
          if (exercise.analysis) {
            allExercises.push({
              type: exercise.type,
              analysis: JSON.parse(exercise.analysis as string) as SpeechAnalysis,
            });
          }
        }
      }

      if (allExercises.length === 0) {
        res.status(400).json({
          error: 'No analyzed exercises found. Complete exercises with speech analysis to generate a report.',
        });
        return;
      }

      // Compute domain scores per session, then aggregate
      const sessionDomains: NeuralRiskDomains[] = sessions.map((session) => {
        const sessionExercises = session.exercises
          .filter((e) => e.analysis !== null)
          .map((e) => ({
            type: e.type,
            analysis: JSON.parse(e.analysis as string) as SpeechAnalysis,
          }));

        if (sessionExercises.length === 0) {
          return {
            articulation: 75,
            fluency: 75,
            phonologicalAwareness: 75,
            vocabulary: 75,
            processingSpeed: 75,
            workingMemory: 75,
          };
        }

        return computeRiskDomainsWithAge(sessionExercises, child.age);
      });

      const aggregatedDomains = aggregateDomains(sessionDomains);

      // Assess overall risk level
      const riskLevel = assessRiskLevel(aggregatedDomains);

      // Identify specific flags
      const flags = identifyFlags(aggregatedDomains, allExercises, child.age);

      // Generate GPT-4o clinical summary
      let summary: string | null = null;
      try {
        summary = await generateClinicalSummary({
          childName: child.name,
          childAge: child.age,
          domains: aggregatedDomains as unknown as Record<string, number>,
          riskLevel,
          flags,
          sessionCount: sessions.length,
        });
      } catch (gptErr) {
        console.warn('[reports/generate] GPT-4o summary skipped:', (gptErr as Error).message);
        // Fallback summary
        summary = buildFallbackSummary(child.name, riskLevel, flags, sessions.length);
      }

      // Save the report
      const report = await prisma.neuroReport.create({
        data: {
          childId,
          riskLevel,
          flags: JSON.stringify(flags),
          domains: JSON.stringify(aggregatedDomains),
          summary,
        },
      });

      res.status(201).json({ report });
    } catch (err) {
      console.error('[reports/generate]', err);
      res.status(500).json({ error: 'Failed to generate report' });
    }
  }
);

// ─── DELETE /api/reports/:childId/:reportId ───────────────────────────────

router.delete(
  '/:childId/:reportId',
  requireAuth,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const { childId, reportId } = req.params;

      const child = await verifyChildAccess(childId, userId);
      if (!child) {
        res.status(404).json({ error: 'Child not found' });
        return;
      }

      const report = await prisma.neuroReport.findFirst({
        where: { id: reportId, childId },
      });

      if (!report) {
        res.status(404).json({ error: 'Report not found' });
        return;
      }

      await prisma.neuroReport.delete({ where: { id: reportId } });

      res.json({ message: 'Report deleted successfully' });
    } catch (err) {
      console.error('[reports/delete]', err);
      res.status(500).json({ error: 'Failed to delete report' });
    }
  }
);

// ─── Fallback summary (when OpenAI is unavailable) ────────────────────────

function buildFallbackSummary(
  childName: string,
  riskLevel: string,
  flags: string[],
  sessionCount: number
): string {
  const riskDescriptions: Record<string, string> = {
    LOW: 'performing within age-appropriate ranges across all assessed speech and language domains',
    MODERATE: 'showing some areas that warrant monitoring and targeted support',
    HIGH: 'demonstrating notable difficulties in multiple speech and language areas that require professional attention',
    REFER: 'showing significant concerns across multiple domains that require prompt evaluation by a licensed speech-language pathologist',
  };

  const desc = riskDescriptions[riskLevel] ?? 'showing mixed performance across domains';
  const flagSummary =
    flags.length > 0
      ? ` Key observations include: ${flags.slice(0, 3).join('; ')}.`
      : '';

  return (
    `Based on analysis of ${sessionCount} completed session${sessionCount !== 1 ? 's' : ''}, ` +
    `${childName} is ${desc}.${flagSummary} ` +
    `Continued practice and monitoring is recommended to track progress over time.`
  );
}

export default router;
