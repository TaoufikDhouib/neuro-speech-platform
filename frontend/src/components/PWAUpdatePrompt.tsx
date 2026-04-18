import { useRegisterSW } from 'virtual:pwa-register/react'
import { motion, AnimatePresence } from 'framer-motion'

export function PWAUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      // Check for updates every 60 minutes
      r && setInterval(() => r.update(), 60 * 60 * 1000)
    },
  })

  return (
    <AnimatePresence>
      {needRefresh && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50"
        >
          <div className="bg-brand-600 text-white rounded-2xl shadow-xl p-4 flex items-center gap-3">
            <span className="text-2xl">⚡</span>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm">Update available!</p>
              <p className="text-xs text-purple-200">A new version of NeuroBright is ready.</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => setNeedRefresh(false)}
                className="text-xs text-purple-300 hover:text-white px-2 py-1"
              >
                Later
              </button>
              <button
                onClick={() => updateServiceWorker(true)}
                className="text-xs bg-white text-brand-600 font-bold px-3 py-1 rounded-full hover:bg-purple-50"
              >
                Update
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
