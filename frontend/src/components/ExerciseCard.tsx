import { motion } from 'framer-motion'
import type { Exercise } from '../types'
import {
  EXERCISE_TYPE_LABELS,
  EXERCISE_TYPE_COLORS,
  EXERCISE_TYPE_EMOJIS,
} from '../types'

interface ExerciseCardProps {
  exercise: Exercise
  exerciseIndex: number
  totalExercises: number
}

const PROMPT_EMOJIS: Record<string, string> = {
  cat: '🐱', dog: '🐶', bird: '🐦', fish: '🐟', apple: '🍎', banana: '🍌',
  sun: '☀️', moon: '🌙', star: '⭐', house: '🏠', car: '🚗', tree: '🌳',
  book: '📚', ball: '⚽', flower: '🌸', rain: '🌧️', snow: '❄️', fire: '🔥',
  water: '💧', food: '🍕', happy: '😊', sad: '😢', big: '🐘', small: '🐭',
  red: '🔴', blue: '🔵', green: '🟢', yellow: '🟡',
}

function getPromptEmoji(prompt: string, type: string): string {
  const lower = prompt.toLowerCase()
  for (const [key, emoji] of Object.entries(PROMPT_EMOJIS)) {
    if (lower.includes(key)) return emoji
  }
  return EXERCISE_TYPE_EMOJIS[type] ?? '💬'
}

export default function ExerciseCard({
  exercise,
  exerciseIndex,
  totalExercises,
}: ExerciseCardProps) {
  const typeLabel = EXERCISE_TYPE_LABELS[exercise.type] ?? exercise.type
  const typeColor = EXERCISE_TYPE_COLORS[exercise.type] ?? 'bg-gray-100 text-gray-600'
  const promptEmoji = getPromptEmoji(exercise.prompt, exercise.type)

  return (
    <motion.div
      key={exercise.id}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -30, scale: 0.95 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="bg-white rounded-2xl border-2 border-[#E5E5E5] overflow-hidden"
    >
      {/* Card header — flat light green tint */}
      <div className="bg-brand-100 px-6 py-4 flex items-center justify-between border-b-2 border-[#E5E5E5]">
        <span className={`badge ${typeColor} text-sm`}>
          {EXERCISE_TYPE_EMOJIS[exercise.type] ?? '💬'} {typeLabel}
        </span>
        <span className="text-sm font-black text-gray-400">
          {exerciseIndex + 1} of {totalExercises}
        </span>
      </div>

      {/* Main content */}
      <div className="p-8 flex flex-col items-center gap-6">
        {/* Big emoji — flat tinted bg */}
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
          className="w-28 h-28 bg-brand-100 rounded-2xl flex items-center justify-center"
        >
          <span className="text-6xl" role="img">
            {promptEmoji}
          </span>
        </motion.div>

        {/* Instruction */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-gray-500 font-bold text-base text-center"
        >
          {exercise.prompt}
        </motion.p>

        {/* Target word — flat green bubble (no gradient) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, type: 'spring', stiffness: 200, damping: 20 }}
          className="bg-brand-500 rounded-2xl px-8 py-5 max-w-full"
          style={{ boxShadow: '0 4px 0 #46A302' }}
        >
          <p className="text-white font-black text-2xl text-center leading-snug">
            {exercise.targetResponse}
          </p>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-gray-400 font-semibold text-sm flex items-center gap-2"
        >
          <span>👆</span> Read it, then record yourself saying it
        </motion.p>
      </div>
    </motion.div>
  )
}
