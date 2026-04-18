import { motion } from 'framer-motion'

interface XPBarProps {
  xp: number
  level: number
  showLabel?: boolean
  compact?: boolean
}

const XP_PER_LEVEL = 200

export default function XPBar({ xp, level, showLabel = true, compact = false }: XPBarProps) {
  const xpInCurrentLevel = xp % XP_PER_LEVEL
  const progressPercent = (xpInCurrentLevel / XP_PER_LEVEL) * 100

  return (
    <div className={`w-full ${compact ? 'space-y-1' : 'space-y-2'}`}>
      {showLabel && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Level badge — flat green circle */}
            <div
              className={`${compact ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm'} rounded-full bg-brand-500 flex items-center justify-center text-white font-black`}
            >
              {level}
            </div>
            <span className={`font-bold text-gray-600 ${compact ? 'text-xs' : 'text-sm'}`}>
              Level {level}
            </span>
          </div>
          <span className={`font-bold text-brand-600 ${compact ? 'text-xs' : 'text-sm'}`}>
            {xpInCurrentLevel}/{XP_PER_LEVEL} XP
          </span>
        </div>
      )}

      {/* Duolingo-style plump progress bar */}
      <div className={compact ? 'progress-sm' : 'progress'}>
        <motion.div
          className="progress-fill"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
        />
      </div>
    </div>
  )
}
