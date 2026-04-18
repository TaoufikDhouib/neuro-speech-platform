import { useParams, useNavigate } from 'react-router-dom'
import { useReducer, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { sessionsAPI, analysisAPI } from '../services/api'
import type { GameState, GamePhase, ExerciseResult } from '../types'
import Mascot from '../components/Mascot'
import HeartBar from '../components/HeartBar'
import ExerciseCard from '../components/ExerciseCard'
import AudioRecorder from '../components/AudioRecorder'

// ─── Reducer ────────────────────────────────────────────────────────────────

type Action =
  | { type: 'SESSION_LOADED'; payload: { session: GameState['session']; exercises: GameState['exercises'] } }
  | { type: 'START_RECORDING'; payload: { startTime: number } }
  | { type: 'STOP_RECORDING' }
  | { type: 'SET_PROCESSING' }
  | { type: 'EXERCISE_RESULT'; payload: ExerciseResult }
  | { type: 'NEXT_EXERCISE' }
  | { type: 'SESSION_COMPLETE'; payload: { leveledUp: boolean; newLevel: number } }
  | { type: 'GAME_OVER' }
  | { type: 'SET_PHASE'; payload: GamePhase }

const initialState: GameState = {
  phase: 'loading',
  session: null,
  exercises: [],
  currentIndex: 0,
  results: [],
  startTime: null,
  sessionXP: 0,
  leveledUp: false,
  newLevel: 1,
}

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'SESSION_LOADED':
      return { ...state, phase: 'intro', session: action.payload.session, exercises: action.payload.exercises }
    case 'START_RECORDING':
      return { ...state, phase: 'recording', startTime: action.payload.startTime }
    case 'STOP_RECORDING':
      return { ...state, phase: 'processing' }
    case 'SET_PROCESSING':
      return { ...state, phase: 'processing' }
    case 'EXERCISE_RESULT':
      return { ...state, phase: 'feedback', results: [...state.results, action.payload], sessionXP: state.sessionXP + action.payload.xpEarned }
    case 'NEXT_EXERCISE':
      return { ...state, phase: 'exercise', currentIndex: state.currentIndex + 1, startTime: null }
    case 'SESSION_COMPLETE':
      return { ...state, phase: 'complete', leveledUp: action.payload.leveledUp, newLevel: action.payload.newLevel }
    case 'GAME_OVER':
      return { ...state, phase: 'game_over' }
    case 'SET_PHASE':
      return { ...state, phase: action.payload }
    default:
      return state
  }
}

// ─── Score helpers ───────────────────────────────────────────────────────────

function scoreToStars(avg: number) {
  if (avg >= 85) return 3
  if (avg >= 55) return 2
  return 1
}

function scoreLabel(score: number) {
  if (score > 70) return {
    label: '🎉 Excellent!',
    bg: 'bg-[#DDF4B7]',
    border: 'border-[#58CC02]',
    color: 'text-[#3C8500]',
  }
  if (score > 40) return {
    label: '👍 Good try!',
    bg: 'bg-[#FFF4D1]',
    border: 'border-[#FFC800]',
    color: 'text-[#B07800]',
  }
  return {
    label: '💪 Keep going!',
    bg: 'bg-[#FFE9E9]',
    border: 'border-[#FF4B4B]',
    color: 'text-[#B03030]',
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function Game() {
  const { childId } = useParams<{ childId: string }>()
  const navigate = useNavigate()
  const [state, dispatch] = useReducer(reducer, initialState)

  const { phase, exercises, currentIndex, results, sessionXP, session, leveledUp, newLevel } = state
  const currentExercise = exercises[currentIndex]
  const totalExercises = exercises.length || 5

  useEffect(() => {
    if (!childId) return
    sessionsAPI
      .create(childId)
      .then(({ session, exercises }) => dispatch({ type: 'SESSION_LOADED', payload: { session, exercises } }))
      .catch(() => { toast.error('Failed to start session.'); navigate(`/dashboard/${childId}`) })
  }, [childId, navigate])

  const handleRecordingComplete = useCallback(
    async (blob: Blob, durationMs: number) => {
      if (!currentExercise) return
      const latencyMs = state.startTime ? Date.now() - state.startTime : 0
      dispatch({ type: 'SET_PROCESSING' })
      try {
        const { transcript } = await analysisAPI.transcribe(blob, currentExercise.id)
        const { score, xpEarned, analysis } = await analysisAPI.evaluate({
          exerciseId: currentExercise.id, transcript, latencyMs, durationMs,
        })
        const result: ExerciseResult = { exerciseId: currentExercise.id, score, transcript, xpEarned, latencyMs, durationMs, analysis }
        dispatch({ type: 'EXERCISE_RESULT', payload: result })
        const heartsLost = state.results.filter((r) => r.score < 40).length + (score < 40 ? 1 : 0)
        if (5 - heartsLost <= 0) setTimeout(() => dispatch({ type: 'GAME_OVER' }), 1800)
      } catch {
        toast.error('Analysis failed. Moving to next exercise.')
        dispatch({ type: 'EXERCISE_RESULT', payload: { exerciseId: currentExercise.id, score: 0, transcript: '(analysis failed)', xpEarned: 0, latencyMs, durationMs, analysis: null } })
        const heartsLost = state.results.filter((r) => r.score < 40).length + 1
        if (5 - heartsLost <= 0) setTimeout(() => dispatch({ type: 'GAME_OVER' }), 1800)
      }
    },
    [currentExercise, state.startTime, state.results]
  )

  const handleNext = useCallback(async () => {
    const isLast = currentIndex >= exercises.length - 1
    if (isLast) {
      if (session) {
        try {
          const { levelUp, newLevel: nl } = await sessionsAPI.complete(session.id)
          dispatch({ type: 'SESSION_COMPLETE', payload: { leveledUp: levelUp, newLevel: nl } })
        } catch {
          dispatch({ type: 'SESSION_COMPLETE', payload: { leveledUp: false, newLevel: 1 } })
        }
      } else {
        dispatch({ type: 'SESSION_COMPLETE', payload: { leveledUp: false, newLevel: 1 } })
      }
    } else {
      dispatch({ type: 'NEXT_EXERCISE' })
    }
  }, [currentIndex, exercises.length, session])

  const latestResult = results[results.length - 1]
  const avgScore = results.length > 0
    ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length)
    : 0
  const stars = scoreToStars(avgScore)
  const heartsLost = results.filter((r) => r.score < 40).length
  const hearts = Math.max(0, 5 - heartsLost)

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* ── Top HUD bar ── */}
      <AnimatePresence>
        {(['exercise', 'recording', 'processing', 'feedback'] as GamePhase[]).includes(phase) && (
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            className="bg-white border-b-2 border-[#E5E5E5] px-4 py-3 sticky top-0 z-10"
          >
            <div className="max-w-xl mx-auto flex items-center justify-between gap-4">
              <button
                onClick={() => navigate(`/dashboard/${childId}`)}
                className="text-gray-400 hover:text-gray-600 font-black text-lg w-8 h-8 flex items-center justify-center"
              >
                ✕
              </button>

              {/* Duolingo-style progress bar */}
              <div className="flex-1 progress">
                <div
                  className="progress-fill transition-all duration-500"
                  style={{ width: `${((currentIndex) / totalExercises) * 100}%` }}
                />
              </div>

              <HeartBar hearts={hearts} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main content ── */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-xl">
          <AnimatePresence mode="wait">

            {/* LOADING */}
            {phase === 'loading' && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-6"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                  className="w-16 h-16 rounded-full border-4 border-brand-100 border-t-brand-500"
                />
                <p className="text-gray-500 font-bold text-lg">Setting up your session...</p>
              </motion.div>
            )}

            {/* INTRO */}
            {phase === 'intro' && (
              <motion.div key="intro" initial={{ opacity: 0, scale: 0.93 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.93 }}
                className="flex flex-col items-center gap-8 text-center"
              >
                <Mascot mood="happy" size="lg" message="Let's do some fun speech exercises! 🎤" />
                <div>
                  <h1 className="text-3xl font-black text-gray-800 mb-3">Ready to play?</h1>
                  <p className="text-gray-500 font-semibold text-lg">
                    You have {totalExercises} exercises today.<br />Do your best — every word counts! 🌟
                  </p>
                </div>
                <div className="flex gap-3 w-full">
                  <button onClick={() => navigate(`/dashboard/${childId}`)} className="btn-ghost flex-1">
                    ← Back
                  </button>
                  <button
                    onClick={() => dispatch({ type: 'SET_PHASE', payload: 'exercise' })}
                    className="btn-primary flex-1 py-4 text-lg"
                  >
                    🚀 Let's Go!
                  </button>
                </div>
              </motion.div>
            )}

            {/* EXERCISE */}
            {(phase === 'exercise' || phase === 'recording') && currentExercise && (
              <motion.div
                key={`exercise-${currentIndex}`}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center px-1">
                  <Mascot mood={phase === 'recording' ? 'thinking' : 'encouraging'} size="sm"
                    message={phase === 'recording' ? "I'm listening! 🎧" : undefined} />
                  <span className="text-sm font-black text-gray-400">
                    Exercise {currentIndex + 1} of {totalExercises}
                  </span>
                </div>
                <ExerciseCard exercise={currentExercise} exerciseIndex={currentIndex} totalExercises={totalExercises} />
                <AudioRecorder onRecordingComplete={handleRecordingComplete} disabled={false} />
              </motion.div>
            )}

            {/* PROCESSING */}
            {phase === 'processing' && (
              <motion.div key="processing" initial={{ opacity: 0, scale: 0.93 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-8 text-center"
              >
                <Mascot mood="thinking" size="lg" message="Analyzing your speech... 🧠" />
                <div className="space-y-2">
                  <div className="flex justify-center gap-2">
                    {['Transcribing...', 'Analyzing...', 'Scoring...'].map((step, i) => (
                      <motion.div
                        key={step}
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
                        className="px-3 py-1 bg-brand-100 text-brand-700 rounded-full text-sm font-bold"
                      >
                        {step}
                      </motion.div>
                    ))}
                  </div>
                  <p className="text-gray-400 font-semibold text-sm">This takes just a moment...</p>
                </div>
              </motion.div>
            )}

            {/* FEEDBACK */}
            {phase === 'feedback' && latestResult && (
              <motion.div key="feedback" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }}
                className="space-y-5"
              >
                {(() => {
                  const { label, bg, border, color } = scoreLabel(latestResult.score)
                  const isGood = latestResult.score > 70
                  return (
                    <>
                      {/* Score flash — Duolingo choice card style */}
                      <motion.div
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', damping: 14, stiffness: 220 }}
                        className={`rounded-2xl border-2 ${border} border-b-4 p-6 text-center ${bg} animate-correct-flash`}
                      >
                        <div className="text-5xl mb-2">
                          {isGood ? '🎉' : latestResult.score > 40 ? '👍' : '💪'}
                        </div>
                        <p className={`text-2xl font-black ${color}`}>{label}</p>
                        <div className="flex items-center justify-center gap-3 mt-3">
                          <span className="text-4xl font-black text-gray-800">{latestResult.score}</span>
                          <span className="text-gray-400 font-bold text-lg">/100</span>
                        </div>
                      </motion.div>

                      <div className="flex justify-center">
                        <Mascot
                          mood={isGood ? 'celebrating' : 'encouraging'}
                          size="md"
                          message={isGood ? 'Amazing job! 🌟' : 'You can do it! Try again next time! 💪'}
                        />
                      </div>

                      {/* Transcript */}
                      <div className="bg-white rounded-2xl border-2 border-[#E5E5E5] p-4">
                        <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">I heard:</p>
                        <p className="text-gray-700 font-bold text-base italic">
                          "{latestResult.transcript || '(no speech detected)'}"
                        </p>
                      </div>

                      {/* XP earned — Duolingo gold pill */}
                      {latestResult.xpEarned > 0 && (
                        <motion.div
                          initial={{ scale: 0, y: 8 }}
                          animate={{ scale: 1, y: 0 }}
                          transition={{ delay: 0.25, type: 'spring' }}
                          className="flex items-center justify-center gap-2 pill pill-xp mx-auto text-lg py-3 px-6"
                        >
                          <span>⚡</span>
                          <span className="font-black">+{latestResult.xpEarned} XP</span>
                        </motion.div>
                      )}

                      {/* Next — primary CTA */}
                      <button onClick={handleNext} className="btn-primary w-full py-4 text-lg">
                        {currentIndex >= exercises.length - 1 ? '🏁 Finish Session' : 'Next Exercise →'}
                      </button>
                    </>
                  )
                })()}
              </motion.div>
            )}

            {/* GAME OVER */}
            {phase === 'game_over' && (
              <motion.div key="game_over" initial={{ opacity: 0, scale: 0.93 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-6 text-center"
              >
                <Mascot mood="encouraging" size="lg" message="Don't give up! You can do it! 💪" />
                <div>
                  <h1 className="text-4xl font-black text-gray-800 mb-2">Out of Hearts!</h1>
                  <p className="text-gray-500 font-semibold text-lg">
                    No more hearts left. Take a break and try again!
                  </p>
                </div>
                <div className="flex gap-3 w-full">
                  <button onClick={() => navigate(`/dashboard/${childId}`)} className="btn-ghost flex-1">
                    🏠 Dashboard
                  </button>
                  <button onClick={() => window.location.reload()} className="btn-primary flex-1">
                    🔄 Try Again
                  </button>
                </div>
              </motion.div>
            )}

            {/* COMPLETE */}
            {phase === 'complete' && (
              <motion.div key="complete" initial={{ opacity: 0, scale: 0.93 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-6 text-center"
              >
                <Mascot mood="celebrating" size="lg" />

                <div>
                  <motion.h1 initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}
                    className="text-4xl font-black text-gray-800 mb-2"
                  >
                    Session Complete! 🎊
                  </motion.h1>

                  {leveledUp && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3, type: 'spring', damping: 12 }}
                      className="inline-flex items-center gap-2 bg-[#FFF4D1] text-[#B07800] font-black px-6 py-2 rounded-full text-lg border-2 border-[#FFC800] mb-4"
                    >
                      🆙 Level Up! Now Level {newLevel}
                    </motion.div>
                  )}
                </div>

                {/* Stars */}
                <div className="flex gap-3 justify-center">
                  {[1, 2, 3].map((star) => (
                    <motion.span
                      key={star}
                      initial={{ scale: 0, rotate: -30 }}
                      animate={{ scale: star <= stars ? 1 : 0.6, rotate: 0 }}
                      transition={{ delay: 0.15 + star * 0.12, type: 'spring', damping: 12 }}
                      className={`text-5xl ${star <= stars ? '' : 'opacity-25'}`}
                    >
                      ⭐
                    </motion.span>
                  ))}
                </div>

                {/* Score summary card */}
                <div className="bg-white rounded-2xl border-2 border-[#E5E5E5] p-6 w-full space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-3xl font-black text-gray-800">{avgScore}%</p>
                      <p className="text-sm font-bold text-gray-400 uppercase tracking-wide">Avg Score</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-black text-brand-600">+{sessionXP}</p>
                      <p className="text-sm font-bold text-gray-400 uppercase tracking-wide">XP Earned</p>
                    </div>
                  </div>

                  {/* Per-exercise results */}
                  <div className="space-y-2 pt-2 border-t-2 border-[#E5E5E5]">
                    {results.map((r, i) => {
                      const ex = exercises.find((e) => e.id === r.exerciseId)
                      return (
                        <div key={i} className="flex items-center justify-between">
                          <span className="text-sm font-bold text-gray-600 truncate flex-1">
                            {ex?.targetResponse ?? `Exercise ${i + 1}`}
                          </span>
                          <span className={`text-sm font-black ml-2 ${
                            r.score > 70 ? 'text-brand-600' :
                            r.score > 40 ? 'text-[#B07800]' : 'text-[#FF4B4B]'
                          }`}>
                            {r.score}%
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="flex gap-3 w-full">
                  <button onClick={() => navigate(`/dashboard/${childId}`)} className="btn-ghost flex-1">
                    🏠 Dashboard
                  </button>
                  <button onClick={() => navigate(`/reports/${childId}`)} className="btn-primary flex-1">
                    📊 View Report
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
