/**
 * Auth integration tests  (register → login → /me → refresh → logout)
 *
 * Uses a real SQLite test.db so the full auth middleware, bcrypt, JWT and
 * refresh-token rotation paths are exercised without mocking.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import supertest from 'supertest';
import express, { Express } from 'express';
import { execSync } from 'child_process';
import path from 'path';

// ── Build a minimal Express app with just the auth router ──────────────────
// We import after setup.ts has set DATABASE_URL / JWT_SECRET env vars.
// Dynamic imports ensure the Prisma singleton picks up the test env.

let app: Express;
let request: ReturnType<typeof supertest>;

// Captured between tests
let accessToken  = '';
let refreshToken = '';

const TEST_USER = {
  email:    `test-${Date.now()}@example.com`,
  password: 'TestPassword1!',
  name:     'Integration Tester',
  role:     'PARENT',
};

beforeAll(async () => {
  // Push schema to test.db (creates tables if they don't exist yet)
  const backendRoot = path.resolve(__dirname, '../../');
  try {
    execSync('npx prisma db push --force-reset --skip-generate', {
      cwd: backendRoot,
      env: { ...process.env, DATABASE_URL: 'file:./test.db' },
      stdio: 'pipe',
    });
  } catch {
    // db push may fail if schema is already up-to-date; ignore
  }

  // Build app — import lazily so env vars are set first
  const { default: authRouter } = await import('../routes/auth');
  app = express();
  app.use(express.json());
  app.use('/api/auth', authRouter);
  request = supertest(app);
});

afterAll(async () => {
  const { prisma } = await import('../lib/prisma');
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.$disconnect();
});

// ─── POST /api/auth/register ──────────────────────────────────────────────────

describe('POST /api/auth/register', () => {
  it('creates a new user and returns tokens', async () => {
    const res = await request.post('/api/auth/register').send(TEST_USER);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('refreshToken');
    expect(res.body.user.email).toBe(TEST_USER.email);
    expect(res.body.user.role).toBe('PARENT');
    expect(res.body.user).not.toHaveProperty('password');

    accessToken  = res.body.token as string;
    refreshToken = res.body.refreshToken as string;
  });

  it('rejects duplicate email with 409', async () => {
    const res = await request.post('/api/auth/register').send(TEST_USER);
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already exists/i);
  });

  it('rejects missing email with 400', async () => {
    const res = await request
      .post('/api/auth/register')
      .send({ password: 'pass123', name: 'No Email' });
    expect(res.status).toBe(400);
  });

  it('rejects short password with 400', async () => {
    const res = await request
      .post('/api/auth/register')
      .send({ email: 'other@test.com', password: '123', name: 'Short' });
    expect(res.status).toBe(400);
  });
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  it('returns tokens on correct credentials', async () => {
    const res = await request
      .post('/api/auth/login')
      .send({ email: TEST_USER.email, password: TEST_USER.password });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('refreshToken');
    expect(res.body.user.email).toBe(TEST_USER.email);

    // Update tokens for subsequent tests
    accessToken  = res.body.token as string;
    refreshToken = res.body.refreshToken as string;
  });

  it('returns 401 for wrong password', async () => {
    const res = await request
      .post('/api/auth/login')
      .send({ email: TEST_USER.email, password: 'wrongpassword' });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid/i);
  });

  it('returns 401 for non-existent email', async () => {
    const res = await request
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'anything' });
    expect(res.status).toBe(401);
  });

  it('returns 400 for missing fields', async () => {
    const res = await request.post('/api/auth/login').send({ email: 'x@y.com' });
    expect(res.status).toBe(400);
  });
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────

describe('GET /api/auth/me', () => {
  it('returns user profile with valid token', async () => {
    const res = await request
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(TEST_USER.email);
    expect(res.body.user).toHaveProperty('_count');
  });

  it('returns 401 without token', async () => {
    const res = await request.get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns 401 with a malformed token', async () => {
    const res = await request
      .get('/api/auth/me')
      .set('Authorization', 'Bearer not-a-real-token');
    expect(res.status).toBe(401);
  });
});

// ─── POST /api/auth/refresh ───────────────────────────────────────────────────

describe('POST /api/auth/refresh', () => {
  // Use a dedicated token pair for this describe block so there's no shared
  // state dependency with the login tests above.
  let currentRefreshToken = '';
  let consumedRefreshToken = '';

  beforeAll(async () => {
    const res = await request
      .post('/api/auth/login')
      .send({ email: TEST_USER.email, password: TEST_USER.password });
    currentRefreshToken = res.body.refreshToken as string;
  });

  it('rotates tokens and returns a new pair', async () => {
    consumedRefreshToken = currentRefreshToken;           // save old token
    const res = await request
      .post('/api/auth/refresh')
      .send({ refreshToken: currentRefreshToken });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('refreshToken');
    // Opaque refresh token is a new random hex — always different
    expect(res.body.refreshToken).not.toBe(consumedRefreshToken);

    currentRefreshToken = res.body.refreshToken as string;
  });

  it('old refresh token is invalid after rotation (theft detection)', async () => {
    const res = await request
      .post('/api/auth/refresh')
      .send({ refreshToken: consumedRefreshToken });     // the consumed token

    expect(res.status).toBe(401);
  });

  it('new refresh token is valid', async () => {
    const res = await request
      .post('/api/auth/refresh')
      .send({ refreshToken: currentRefreshToken });

    expect(res.status).toBe(200);
    // Hand the latest tokens to the logout describe
    refreshToken    = res.body.refreshToken as string;
    accessToken     = res.body.token as string;
    currentRefreshToken = refreshToken;
  });

  it('returns 401 for a completely bogus refresh token', async () => {
    const res = await request
      .post('/api/auth/refresh')
      .send({ refreshToken: 'fake-token-that-does-not-exist' });
    expect(res.status).toBe(401);
  });

  it('returns 400 when refreshToken field is missing', async () => {
    const res = await request.post('/api/auth/refresh').send({});
    expect(res.status).toBe(400);
  });
});

// ─── POST /api/auth/logout ────────────────────────────────────────────────────

describe('POST /api/auth/logout', () => {
  it('logs out and revokes the refresh token', async () => {
    const res = await request
      .post('/api/auth/logout')
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/logged out/i);
  });

  it('after logout, refresh token is no longer valid', async () => {
    const res = await request
      .post('/api/auth/refresh')
      .send({ refreshToken });        // revoked token

    expect(res.status).toBe(401);
  });

  it('returns 200 even with no refreshToken (no leak)', async () => {
    const res = await request.post('/api/auth/logout').send({});
    expect(res.status).toBe(200);
  });
});
