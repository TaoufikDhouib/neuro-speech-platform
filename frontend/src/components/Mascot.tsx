import { motion } from 'framer-motion'

interface MascotProps {
  mood?: 'idle' | 'happy' | 'thinking' | 'celebrating' | 'encouraging'
  size?: 'sm' | 'md' | 'lg'
  message?: string
}

const sizeMap = {
  sm: { container: 'w-16 h-16', face: 'text-3xl', bubble: 'text-xs max-w-[140px]' },
  md: { container: 'w-24 h-24', face: 'text-5xl', bubble: 'text-sm max-w-[180px]' },
  lg: { container: 'w-32 h-32', face: 'text-6xl', bubble: 'text-base max-w-[220px]' },
}

const moodAnimations = {
  idle:        { animate: { y: [0, -6, 0] },                            transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' } },
  happy:       { animate: { scale: [1, 1.12, 1], rotate: [0, -4, 4, 0] }, transition: { duration: 0.7, repeat: Infinity, repeatDelay: 2 } },
  thinking:    { animate: { rotate: [-10, 10, -10] },                   transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' } },
  celebrating: { animate: { scale: [1, 1.25, 0.95, 1.15, 1], rotate: [0, -8, 8, -8, 0] }, transition: { duration: 0.5, repeat: Infinity, repeatDelay: 0.3 } },
  encouraging: { animate: { y: [0, -4, 0], rotate: [0, -3, 3, 0] },   transition: { duration: 1.4, repeat: Infinity, ease: 'easeInOut' } },
}

const moodBg: Record<string, string> = {
  idle:        '#58CC02',
  happy:       '#1CB0F6',
  thinking:    '#CE82FF',
  celebrating: '#FFC800',
  encouraging: '#FF9600',
}

// Sparky — a robot brain character
const moodFace = {
  idle:        '🤖',
  happy:       '😄',
  thinking:    '🤔',
  celebrating: '🥳',
  encouraging: '💪',
}

export default function Mascot({ mood = 'idle', size = 'md', message }: MascotProps) {
  const s = sizeMap[size]
  const anim = moodAnimations[mood]
  const bg = moodBg[mood]
  const face = moodFace[mood]

  return (
    <div className="flex flex-col items-center gap-3">
      <motion.div className={`${s.container} relative`} animate={anim.animate} transition={anim.transition}>
        <div className="w-full h-full rounded-2xl flex items-center justify-center" style={{ background: bg }}>
          <span className={s.face} role="img" aria-label="Sparky mascot">{face}</span>
        </div>

        {/* Lightning bolts on celebrate */}
        {mood === 'celebrating' && (
          <>
            <motion.span className="absolute -top-2 -right-1 text-xl"
              animate={{ y: [-4, -14], opacity: [1, 0] }}
              transition={{ duration: 0.9, repeat: Infinity, repeatDelay: 0.4 }}>⚡</motion.span>
            <motion.span className="absolute -top-1 -left-2 text-lg"
              animate={{ y: [-4, -14], opacity: [1, 0] }}
              transition={{ duration: 0.9, repeat: Infinity, repeatDelay: 0.4, delay: 0.3 }}>✨</motion.span>
          </>
        )}
        {mood === 'thinking' && (
          <motion.span className="absolute -top-1 -right-1 text-lg"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity }}>💭</motion.span>
        )}
      </motion.div>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8 }}
          className={`${s.bubble} bg-white border-2 border-[#E5E5E5] rounded-2xl px-4 py-2 text-center font-bold text-gray-700`}
        >
          {message}
        </motion.div>
      )}
    </div>
  )
}
