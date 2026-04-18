# Neuro Speech Platform — Backend

Node.js + TypeScript backend for a children's speech analysis platform that detects early neurological problems through gamified speech exercises.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 18+ |
| Language | TypeScript 5 |
| Framework | Express 4 |
| Database | PostgreSQL 14+ |
| ORM | Prisma 5 |
| AI | OpenAI Whisper (transcription) + GPT-4o (reports) |
| Auth | JWT (7-day expiry) |
| File uploads | Multer (audio, 10MB max) |
| Real-time | Socket.io 4 |
| Validation | Zod |

---

## Prerequisites

- Node.js 18+
- PostgreSQL 14+ running locally (or connection string to hosted DB)
- OpenAI API key

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/neuro_speech"
JWT_SECRET="change-this-to-a-long-random-string"
OPENAI_API_KEY="sk-..."
PORT=3001
UPLOAD_DIR="uploads"
NODE_ENV="development"
```

### 3. Create the database

```bash
# Via psql
createdb neuro_speech

# Or in psql shell
CREATE DATABASE neuro_speech;
```

### 4. Run Prisma migrations

```bash
npm run db:generate   # generate Prisma client
npm run db:migrate    # run migrations (creates tables)
```

Or for a quick push without migration history:

```bash
npm run db:push
```

### 5. Seed demo data

```bash
npm run db:seed
```

Demo accounts created:
- **Parent**: `parent@demo.com` / `password123`
- **Therapist**: `therapist@demo.com` / `therapist123`

### 6. Start development server

```bash
npm run dev
```

Server starts at `http://localhost:3001`.

---

## API Endpoints

### Authentication

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new account |
| POST | `/api/auth/login` | Login, receive JWT |
| GET | `/api/auth/me` | Get current user (auth required) |
| POST | `/api/auth/refresh` | Refresh JWT token |

### Children

| Method | Path | Description |
|---|---|---|
| GET | `/api/children` | List all children for current parent |
| POST | `/api/children` | Create child profile |
| GET | `/api/children/:id` | Get child with sessions + latest report |
| PATCH | `/api/children/:id` | Update child profile |
| DELETE | `/api/children/:id` | Delete child profile |
| GET | `/api/children/:id/stats` | Get stats/progress data |

### Sessions

| Method | Path | Description |
|---|---|---|
| POST | `/api/sessions` | Create new session (generates 5 exercises) |
| GET | `/api/sessions` | List sessions for child (`?childId=`) |
| GET | `/api/sessions/:id` | Get session with all exercises |
| POST | `/api/sessions/:id/complete` | Complete session, calculate XP |

### Analysis

| Method | Path | Description |
|---|---|---|
| POST | `/api/analysis/transcribe` | Upload audio + get Whisper transcript |
| POST | `/api/analysis/evaluate` | Evaluate transcript against target |
| GET | `/api/analysis/exercise/:id` | Get exercise with analysis |

**Transcribe** — multipart form upload:
```
POST /api/analysis/transcribe
Content-Type: multipart/form-data

audio: <audio file>
exerciseId: <uuid>
```

**Evaluate** — JSON body:
```json
{
  "exerciseId": "uuid",
  "transcript": "the child's response",
  "latencyMs": 1200,
  "durationMs": 3400,
  "childAge": 5
}
```

### Reports

| Method | Path | Description |
|---|---|---|
| GET | `/api/reports/:childId` | List all reports for child |
| GET | `/api/reports/:childId/:reportId` | Get specific report |
| POST | `/api/reports/:childId/generate` | Generate new neuro report |
| DELETE | `/api/reports/:childId/:reportId` | Delete report |

### Other

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Health check (DB ping) |

---

## Socket.io Events

Connect with:
```javascript
const socket = io('http://localhost:3001', {
  auth: { token: 'your-jwt-token' }
});
```

### Client → Server

| Event | Payload | Description |
|---|---|---|
| `join:session` | `sessionId: string` | Join session room for live feedback |
| `leave:session` | `sessionId: string` | Leave session room |

### Server → Client

| Event | Payload | Description |
|---|---|---|
| `session:joined` | `{ sessionId }` | Confirmed joining session room |

---

## Analysis System

### Speech Features Extracted

- **Accuracy** — fuzzy word match against target response (Levenshtein-based)
- **Articulation** — character-level similarity between transcript and target
- **Fluency** — repetitions, fillers (um/uh/ah), pause estimation
- **Prosody** — speaking rate (WPM) vs age-appropriate norms
- **Phonological** — binary correct/incorrect for rhyme/phoneme tasks

### Neural Risk Domains

| Domain | Source Exercises |
|---|---|
| Articulation | PICTURE_NAMING + WORD_REPETITION |
| Fluency | All exercises (repetition/filler rates) |
| Phonological Awareness | RHYME_DETECTION + PHONEME_ISOLATION |
| Vocabulary | PICTURE_NAMING + SENTENCE_COMPLETION |
| Processing Speed | Latency vs age norms across all tasks |
| Working Memory | STORY_RETELLING + WORD_REPETITION (sentences) |

### Risk Levels

| Level | Condition |
|---|---|
| LOW | All domains > 75 |
| MODERATE | Any domain 50–75 |
| HIGH | Any domain 30–50 |
| REFER | Any domain < 30 |

---

## Gamification

- **XP per exercise**: `base(10) × scoreMultiplier(0–1.5) + perfectBonus(5 if score≥95)`
- **Streak multiplier**: `min(2.0, streak/10 + 1)` applied to session total
- **Level**: `floor(sqrt(totalXP / 100)) + 1`
- **Hearts**: start at 5, lost on skipped/failed exercises

---

## Exercise Bank

50+ exercises across 7 types and ages 3–10:

- `PICTURE_NAMING` — emoji-based vocabulary identification
- `WORD_REPETITION` — single words and sentences to repeat
- `RHYME_DETECTION` — yes/no rhyme judgements
- `PHONEME_ISOLATION` — first/last/middle sound identification
- `SENTENCE_COMPLETION` — fill-in-the-blank
- `RAPID_NAMING` — name multiple items quickly
- `STORY_RETELLING` — recall short narratives

Age-appropriate difficulty is automatically selected when creating sessions.

---

## Project Structure

```
src/
├── index.ts              # App entry point, Express + Socket.io setup
├── config.ts             # Environment variable config
├── lib/
│   └── prisma.ts         # Prisma client singleton
├── middleware/
│   ├── auth.ts           # JWT authentication middleware
│   ├── upload.ts         # Multer audio upload config
│   └── errorHandler.ts   # Global error handler
├── routes/
│   ├── auth.ts           # /api/auth/*
│   ├── children.ts       # /api/children/*
│   ├── sessions.ts       # /api/sessions/*
│   ├── analysis.ts       # /api/analysis/*
│   └── reports.ts        # /api/reports/*
├── services/
│   ├── exerciseBank.ts   # 50+ exercise templates + age-based selection
│   ├── speechAnalysis.ts # Feature extraction from transcripts
│   ├── neuralScoring.ts  # Domain scoring + risk assessment
│   ├── gamification.ts   # XP, levels, streaks
│   └── whisperService.ts # OpenAI Whisper + GPT-4o integration
└── types/
    └── index.ts          # Shared TypeScript interfaces
prisma/
├── schema.prisma         # Database schema
└── seed.ts               # Demo data seed script
uploads/                  # Audio file storage (gitignored)
```

---

## Production Build

```bash
npm run build   # Compiles TypeScript → dist/
npm start       # Runs compiled JS
```
