import 'dotenv/config';
import express from 'express';
import http from 'http';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';

import { config } from './config';
import authRouter from './routes/auth';
import childrenRouter from './routes/children';
import sessionsRouter from './routes/sessions';
import analysisRouter from './routes/analysis';
import reportsRouter from './routes/reports';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { JwtPayload } from './types';
import { prisma } from './lib/prisma';

// ─── App setup ────────────────────────────────────────────────────────────

const app = express();
const httpServer = http.createServer(app);

// ─── Socket.io ────────────────────────────────────────────────────────────

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: config.corsOrigins,
    credentials: true,
  },
});

// Socket auth middleware
io.use((socket, next) => {
  const token =
    (socket.handshake.auth['token'] as string | undefined) ??
    (socket.handshake.headers['authorization'] as string | undefined)?.replace('Bearer ', '');

  if (!token) {
    return next(new Error('Authentication token required'));
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret) as JwtPayload;
    socket.data['user'] = payload;
    return next();
  } catch {
    return next(new Error('Invalid or expired token'));
  }
});

io.on('connection', (socket) => {
  const user = socket.data['user'] as JwtPayload;
  console.log(`[Socket.io] Client connected: ${user.userId}`);

  // Join user-specific room for targeted messages
  socket.join(`user:${user.userId}`);

  // Client can join a session room to receive live exercise feedback
  socket.on('join:session', (sessionId: string) => {
    socket.join(`session:${sessionId}`);
    socket.emit('session:joined', { sessionId });
  });

  socket.on('leave:session', (sessionId: string) => {
    socket.leave(`session:${sessionId}`);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.io] Client disconnected: ${user.userId}`);
  });
});

// Export io for use in route handlers
export { io };

// ─── Security middleware ──────────────────────────────────────────────────

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow serving uploads
  })
);

app.use(
  cors({
    origin: config.corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─── Body parsers ─────────────────────────────────────────────────────────

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ─── Request logging ──────────────────────────────────────────────────────

app.use((req, _res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// ─── Static files (audio uploads) ────────────────────────────────────────

const uploadPath = path.resolve(config.uploadDir);
app.use(`/${config.uploadDir}`, express.static(uploadPath));

// ─── Health check ─────────────────────────────────────────────────────────

app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      env: config.nodeEnv,
      db: 'connected',
    });
  } catch {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      db: 'disconnected',
    });
  }
});

// ─── API routes ───────────────────────────────────────────────────────────

app.use('/api/auth', authRouter);
app.use('/api/children', childrenRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/analysis', analysisRouter);
app.use('/api/reports', reportsRouter);

// ─── 404 + Error handlers ─────────────────────────────────────────────────

app.use(notFoundHandler);
app.use(errorHandler);

// ─── Start server ─────────────────────────────────────────────────────────

async function start() {
  // ── Validate critical environment variables ──────────────────────────────
  const missing: string[] = [];
  if (!config.groqApiKey || config.groqApiKey === 'your-groq-api-key-here') {
    missing.push('GROQ_API_KEY');
  }
  if (!config.jwtSecret || config.jwtSecret.length < 16) {
    missing.push('JWT_SECRET (must be ≥16 chars)');
  }

  if (missing.length > 0) {
    console.warn(`
⚠️  Missing or default environment variables:
   ${missing.map(k => `→ ${k}`).join('\n   ')}
   Set them in .env before going to production.
    `);
    if (config.nodeEnv === 'production') {
      console.error('[Startup] Refusing to start in production with missing env vars.');
      process.exit(1);
    }
  }

  try {
    await prisma.$connect();
    console.log('[DB] SQLite connected via Prisma');

    httpServer.listen(config.port, () => {
      console.log(`
╔═══════════════════════════════════════════════════╗
║  Neuro Speech Platform — Backend                  ║
║  Running on http://localhost:${config.port}               ║
║  Environment: ${config.nodeEnv.padEnd(34)}║
╚═══════════════════════════════════════════════════╝
      `);
    });
  } catch (err) {
    console.error('[Startup] Failed to connect to database:', err);
    process.exit(1);
  }
}

// ─── Graceful shutdown ────────────────────────────────────────────────────

process.on('SIGTERM', async () => {
  console.log('[Shutdown] SIGTERM received, closing connections...');
  await prisma.$disconnect();
  httpServer.close(() => {
    console.log('[Shutdown] Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('[Shutdown] SIGINT received, closing connections...');
  await prisma.$disconnect();
  process.exit(0);
});

start();
