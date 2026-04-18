import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  await prisma.badge.deleteMany();
  await prisma.neuroReport.deleteMany();
  await prisma.exercise.deleteMany();
  await prisma.session.deleteMany();
  await prisma.child.deleteMany();
  await prisma.user.deleteMany();

  const parentPassword = await bcrypt.hash('password123', 10);
  const therapistPassword = await bcrypt.hash('therapist123', 10);

  const parent = await prisma.user.create({
    data: { email: 'parent@demo.com', password: parentPassword, name: 'Sarah Johnson', role: 'PARENT' },
  });

  const therapist = await prisma.user.create({
    data: { email: 'therapist@demo.com', password: therapistPassword, name: 'Dr. Emily Chen', role: 'THERAPIST' },
  });

  console.log(`✅ Created users: ${parent.email}, ${therapist.email}`);

  const childElla = await prisma.child.create({
    data: {
      name: 'Ella', age: 5, avatarSeed: 'ella-butterfly', parentId: parent.id,
      xp: 340, level: 2, streak: 3, hearts: 5,
      lastActive: new Date(Date.now() - 86400000),
    },
  });

  const childLiam = await prisma.child.create({
    data: {
      name: 'Liam', age: 7, avatarSeed: 'liam-rocket', parentId: parent.id,
      xp: 820, level: 3, streak: 7, hearts: 4,
      lastActive: new Date(Date.now() - 86400000),
    },
  });

  console.log(`✅ Created children: ${childElla.name}, ${childLiam.name}`);

  const session1 = await prisma.session.create({
    data: {
      childId: childElla.id, xpEarned: 45, score: 78,
      startedAt: new Date(Date.now() - 2 * 86400000),
      completedAt: new Date(Date.now() - 2 * 86400000 + 600000),
    },
  });

  await prisma.exercise.createMany({
    data: [
      {
        sessionId: session1.id, type: 'PICTURE_NAMING',
        prompt: 'What is this? 🐱', targetResponse: 'cat', transcript: 'cat',
        score: 95, xpEarned: 14, latencyMs: 1200, durationMs: 800,
        analysis: JSON.stringify({ transcript: 'cat', targetResponse: 'cat', exerciseType: 'PICTURE_NAMING', latencyMs: 1200, durationMs: 800, wordCount: 1, speakingRateWPM: 75, accuracy: 100, articulationScore: 100, fluencyScore: 100, prosodyScore: 80, phonologicalScore: 100, repetitions: 0, fillers: 0, pauseCount: 0, overallScore: 95 }),
      },
      {
        sessionId: session1.id, type: 'WORD_REPETITION',
        prompt: "Say this word: 'butterfly'", targetResponse: 'butterfly', transcript: 'butterfly',
        score: 88, xpEarned: 12, latencyMs: 1800, durationMs: 1200,
        analysis: JSON.stringify({ transcript: 'butterfly', targetResponse: 'butterfly', exerciseType: 'WORD_REPETITION', latencyMs: 1800, durationMs: 1200, wordCount: 1, speakingRateWPM: 50, accuracy: 100, articulationScore: 88, fluencyScore: 100, prosodyScore: 70, phonologicalScore: 100, repetitions: 0, fillers: 0, pauseCount: 0, overallScore: 88 }),
      },
      {
        sessionId: session1.id, type: 'RHYME_DETECTION',
        prompt: "Do 'cat' and 'bat' rhyme? Say yes or no.", targetResponse: 'yes', transcript: 'yes',
        score: 100, xpEarned: 15, latencyMs: 900, durationMs: 400,
        analysis: JSON.stringify({ transcript: 'yes', targetResponse: 'yes', exerciseType: 'RHYME_DETECTION', latencyMs: 900, durationMs: 400, wordCount: 1, speakingRateWPM: 150, accuracy: 100, articulationScore: 100, fluencyScore: 100, prosodyScore: 90, phonologicalScore: 100, repetitions: 0, fillers: 0, pauseCount: 0, overallScore: 100 }),
      },
      {
        sessionId: session1.id, type: 'SENTENCE_COMPLETION',
        prompt: 'The cat sat on the ___', targetResponse: 'mat', transcript: 'mat',
        score: 85, xpEarned: 12, latencyMs: 2100, durationMs: 600,
        analysis: JSON.stringify({ transcript: 'mat', targetResponse: 'mat', exerciseType: 'SENTENCE_COMPLETION', latencyMs: 2100, durationMs: 600, wordCount: 1, speakingRateWPM: 100, accuracy: 100, articulationScore: 85, fluencyScore: 100, prosodyScore: 75, phonologicalScore: 100, repetitions: 0, fillers: 0, pauseCount: 0, overallScore: 85 }),
      },
      {
        sessionId: session1.id, type: 'PICTURE_NAMING',
        prompt: 'What is this? 🐶', targetResponse: 'dog', transcript: 'doggy',
        score: 72, xpEarned: 10, latencyMs: 1500, durationMs: 700,
        analysis: JSON.stringify({ transcript: 'doggy', targetResponse: 'dog', exerciseType: 'PICTURE_NAMING', latencyMs: 1500, durationMs: 700, wordCount: 1, speakingRateWPM: 86, accuracy: 80, articulationScore: 75, fluencyScore: 100, prosodyScore: 85, phonologicalScore: 80, repetitions: 0, fillers: 0, pauseCount: 0, overallScore: 72 }),
      },
    ],
  });

  await prisma.neuroReport.create({
    data: {
      childId: childElla.id,
      riskLevel: 'LOW',
      flags: JSON.stringify([]),
      domains: JSON.stringify({ articulation: 88, fluency: 95, phonologicalAwareness: 92, vocabulary: 85, processingSpeed: 82, workingMemory: 80 }),
      summary: "Ella is performing within age-appropriate ranges across all assessed speech and language domains. Her phonological awareness and fluency scores are particularly strong, with articulation well within expected norms for a 5-year-old. No areas of clinical concern were identified at this time. Continued regular practice sessions are encouraged to maintain her developmental trajectory.",
      generatedAt: new Date(Date.now() - 86400000),
    },
  });

  const session2 = await prisma.session.create({
    data: {
      childId: childLiam.id, xpEarned: 62, score: 82,
      startedAt: new Date(Date.now() - 86400000),
      completedAt: new Date(Date.now() - 86400000 + 900000),
    },
  });

  await prisma.exercise.createMany({
    data: [
      {
        sessionId: session2.id, type: 'STORY_RETELLING',
        prompt: "I will tell you a story. A little girl named Lily found a red ball in the park. She kicked it and it rolled away. She ran after it and caught it. Now you tell me what happened.",
        targetResponse: 'lily found red ball park kicked rolled ran caught',
        transcript: 'um lily found a red ball in the park she kicked it and it rolled away she ran and caught it',
        score: 78, xpEarned: 11, latencyMs: 2800, durationMs: 5200,
        analysis: JSON.stringify({ transcript: 'um lily found a red ball in the park she kicked it and it rolled away she ran and caught it', targetResponse: 'lily found red ball park kicked rolled ran caught', exerciseType: 'STORY_RETELLING', latencyMs: 2800, durationMs: 5200, wordCount: 20, speakingRateWPM: 115, accuracy: 85, articulationScore: 82, fluencyScore: 88, prosodyScore: 80, phonologicalScore: 85, repetitions: 0, fillers: 1, pauseCount: 2, overallScore: 78 }),
      },
      {
        sessionId: session2.id, type: 'RAPID_NAMING',
        prompt: 'Name all the animals you see: 🐶🐱🐸🦊', targetResponse: 'dog cat frog fox',
        transcript: 'dog cat frog fox', score: 92, xpEarned: 14, latencyMs: 800, durationMs: 2000,
        analysis: JSON.stringify({ transcript: 'dog cat frog fox', targetResponse: 'dog cat frog fox', exerciseType: 'RAPID_NAMING', latencyMs: 800, durationMs: 2000, wordCount: 4, speakingRateWPM: 120, accuracy: 100, articulationScore: 92, fluencyScore: 95, prosodyScore: 88, phonologicalScore: 100, repetitions: 0, fillers: 0, pauseCount: 0, overallScore: 92 }),
      },
      {
        sessionId: session2.id, type: 'PHONEME_ISOLATION',
        prompt: "What is the first sound in 'sun'?", targetResponse: 's', transcript: 's',
        score: 100, xpEarned: 15, latencyMs: 700, durationMs: 300,
        analysis: JSON.stringify({ transcript: 's', targetResponse: 's', exerciseType: 'PHONEME_ISOLATION', latencyMs: 700, durationMs: 300, wordCount: 1, speakingRateWPM: 200, accuracy: 100, articulationScore: 100, fluencyScore: 100, prosodyScore: 100, phonologicalScore: 100, repetitions: 0, fillers: 0, pauseCount: 0, overallScore: 100 }),
      },
    ],
  });

  await prisma.badge.createMany({
    data: [
      { childId: childElla.id, type: 'FIRST_SESSION', earnedAt: new Date(Date.now() - 2 * 86400000) },
      { childId: childElla.id, type: 'PERFECT_SCORE', earnedAt: new Date(Date.now() - 2 * 86400000) },
      { childId: childLiam.id, type: 'FIRST_SESSION', earnedAt: new Date(Date.now() - 86400000) },
      { childId: childLiam.id, type: '7_DAY_STREAK', earnedAt: new Date(Date.now() - 86400000) },
    ],
  });

  console.log('✅ Created demo sessions, exercises, and badges');
  console.log('\n📋 Demo credentials:');
  console.log('   Parent:    parent@demo.com    / password123');
  console.log('   Therapist: therapist@demo.com / therapist123');
  console.log('\n✨ Seed complete!');
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
