import dotenv from 'dotenv';

dotenv.config();

function requireEnv(name: string, defaultValue?: string): string {
  const value = process.env[name] ?? defaultValue;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  port: parseInt(process.env['PORT'] ?? '3001', 10),
  nodeEnv: process.env['NODE_ENV'] ?? 'development',
  databaseUrl: requireEnv('DATABASE_URL', 'postgresql://user:password@localhost:5432/neuro_speech'),
  jwtSecret: requireEnv('JWT_SECRET', 'default-dev-secret-please-change-in-production'),
  jwtExpiresIn: '7d' as const,
  groqApiKey: process.env['GROQ_API_KEY'] ?? '',
  uploadDir: process.env['UPLOAD_DIR'] ?? 'uploads',
  maxFileSize: 10 * 1024 * 1024, // 10MB
  corsOrigins: process.env['CORS_ORIGINS']
    ? process.env['CORS_ORIGINS'].split(',')
    : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5174'],
  bcryptRounds: 10,
  defaultHearts: 5,
  exercisesPerSession: 5,
};

export default config;
