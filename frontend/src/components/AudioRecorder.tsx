import { motion, AnimatePresence } from 'framer-motion'
import { useAudioRecorder } from '../hooks/useAudioRecorder'
import { useEffect } from 'react'

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob, durationMs: number) => void
  disabled?: boolean
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const tenths = Math.floor((ms % 1000) / 100)
  return `${seconds}.${tenths}s`
}

export default function AudioRecorder({ onRecordingComplete, disabled = false }: AudioRecorderProps) {
  const {
    isRecording,
    audioBlob,
    startRecording,
    stopRecording,
    recordingDuration,
    audioLevel,
    error,
  } = useAudioRecorder()

  useEffect(() => {
    if (audioBlob && recordingDuration > 0) {
      onRecordingComplete(audioBlob, recordingDuration)
    }
  }, [audioBlob, recordingDuration, onRecordingComplete])

  const handleClick = () => {
    if (disabled) return
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  const BAR_COUNT = 20

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Waveform bars */}
      <div className="flex items-center justify-center gap-1 h-16">
        {Array.from({ length: BAR_COUNT }).map((_, i) => {
          const isCenter = Math.abs(i - BAR_COUNT / 2) < BAR_COUNT / 4
          const maxHeight = isCenter ? 48 : 24
          const baseHeight = isRecording
            ? Math.max(
                6,
                maxHeight * audioLevel * (0.5 + Math.random() * 0.5)
              )
            : 6

          return (
            <motion.div
              key={i}
              className={`w-2 rounded-full ${
                isRecording
                  ? 'bg-[#FF4B4B]'
                  : audioBlob
                    ? 'bg-brand-500'
                    : 'bg-gray-200'
              }`}
              animate={{
                height: isRecording
                  ? [
                      6,
                      Math.max(6, maxHeight * audioLevel),
                      6,
                    ]
                  : 6,
              }}
              transition={
                isRecording
                  ? {
                      duration: 0.15 + Math.random() * 0.15,
                      repeat: Infinity,
                      repeatType: 'reverse',
                      delay: i * 0.03,
                    }
                  : { duration: 0.3 }
              }
              style={{ minHeight: '6px' }}
            />
          )
        })}
      </div>

      {/* Timer */}
      <AnimatePresence mode="wait">
        {isRecording && (
          <motion.div
            key="timer"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2"
          >
            <motion.div
              className="w-3 h-3 rounded-full bg-red-500"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
            <span className="font-black text-red-600 text-xl tabular-nums">
              {formatDuration(recordingDuration)}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mic button */}
      <div className="relative">
        {isRecording && (
          <>
            <motion.div
              className="absolute inset-0 rounded-full bg-red-400"
              animate={{ scale: [1, 1.6], opacity: [0.5, 0] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <motion.div
              className="absolute inset-0 rounded-full bg-red-300"
              animate={{ scale: [1, 2.0], opacity: [0.3, 0] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
            />
          </>
        )}
        <motion.button
          onClick={handleClick}
          disabled={disabled}
          whileHover={{ scale: disabled ? 1 : 1.05 }}
          whileTap={{ scale: disabled ? 1 : 0.95 }}
          className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
            isRecording ? 'bg-[#FF4B4B]' : 'bg-brand-500'
          }`}
          style={{ boxShadow: isRecording ? '0 4px 0 #CC3333' : '0 4px 0 #46A302' }}
        >
          <span className="text-4xl" role="img" aria-label={isRecording ? 'Stop recording' : 'Start recording'}>
            {isRecording ? '⏹️' : '🎙️'}
          </span>
        </motion.button>
      </div>

      {/* Label */}
      <p className="text-gray-500 font-bold text-sm text-center">
        {disabled
          ? 'Processing...'
          : isRecording
            ? 'Tap to stop recording'
            : audioBlob
              ? '✅ Recording saved!'
              : 'Tap to start speaking'}
      </p>

      {/* Error */}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[#FF4B4B] font-bold text-sm text-center bg-[#FFE9E9] rounded-xl px-4 py-2"
        >
          ⚠️ {error}
        </motion.p>
      )}
    </div>
  )
}
