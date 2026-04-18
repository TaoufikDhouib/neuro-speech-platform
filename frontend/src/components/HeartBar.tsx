import { motion, AnimatePresence } from 'framer-motion'

interface HeartBarProps {
  hearts: number
  maxHearts?: number
}

export default function HeartBar({ hearts, maxHearts = 5 }: HeartBarProps) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: maxHearts }).map((_, i) => (
        <AnimatePresence key={i} mode="wait">
          {i < hearts ? (
            <motion.span
              key="full"
              initial={{ scale: 1 }}
              exit={{ scale: 0, rotate: -20 }}
              transition={{ duration: 0.3 }}
              className="text-2xl leading-none"
            >
              ❤️
            </motion.span>
          ) : (
            <motion.span
              key="empty"
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.3 }}
              className="text-2xl leading-none opacity-30"
            >
              🖤
            </motion.span>
          )}
        </AnimatePresence>
      ))}
    </div>
  )
}
