import { useState, useRef, useCallback, useEffect } from 'react'

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [audioLevel, setAudioLevel] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const startTimeRef = useRef<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const stopLevelMonitoring = useCallback(() => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = null
    }
    setAudioLevel(0)
  }, [])

  const startLevelMonitoring = useCallback((stream: MediaStream) => {
    try {
      const audioCtx = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)()
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.8

      const source = audioCtx.createMediaStreamSource(stream)
      source.connect(analyser)

      audioContextRef.current = audioCtx
      analyserRef.current = analyser
      sourceRef.current = source

      const dataArray = new Uint8Array(analyser.frequencyBinCount)

      const tick = () => {
        analyser.getByteFrequencyData(dataArray)
        const sum = dataArray.reduce((a, b) => a + b, 0)
        const avg = sum / dataArray.length
        setAudioLevel(Math.min(avg / 128, 1))
        animFrameRef.current = requestAnimationFrame(tick)
      }

      animFrameRef.current = requestAnimationFrame(tick)
    } catch {
      // Audio context not available — silently skip
    }
  }, [])

  const cleanupAudioContext = useCallback(() => {
    stopLevelMonitoring()
    if (sourceRef.current) {
      sourceRef.current.disconnect()
      sourceRef.current = null
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {})
      audioContextRef.current = null
    }
    analyserRef.current = null
  }, [stopLevelMonitoring])

  const startRecording = useCallback(async () => {
    setError(null)
    setAudioBlob(null)
    setRecordingDuration(0)
    chunksRef.current = []

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/ogg'

      const recorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType })
        setAudioBlob(blob)
        stream.getTracks().forEach((t) => t.stop())
        streamRef.current = null
        cleanupAudioContext()
      }

      recorder.start(100)
      startTimeRef.current = Date.now()
      setIsRecording(true)

      startLevelMonitoring(stream)

      timerRef.current = setInterval(() => {
        if (startTimeRef.current !== null) {
          setRecordingDuration(Date.now() - startTimeRef.current)
        }
      }, 100)
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Could not access microphone. Please allow microphone access.'
      setError(msg)
    }
  }, [cleanupAudioContext, startLevelMonitoring])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      if (startTimeRef.current !== null) {
        setRecordingDuration(Date.now() - startTimeRef.current)
      }
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }, [isRecording])

  const resetRecording = useCallback(() => {
    if (isRecording) {
      stopRecording()
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    cleanupAudioContext()
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setAudioBlob(null)
    setRecordingDuration(0)
    setAudioLevel(0)
    setError(null)
    chunksRef.current = []
    startTimeRef.current = null
  }, [isRecording, stopRecording, cleanupAudioContext])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (streamRef.current)
        streamRef.current.getTracks().forEach((t) => t.stop())
      cleanupAudioContext()
    }
  }, [cleanupAudioContext])

  return {
    isRecording,
    audioBlob,
    startRecording,
    stopRecording,
    resetRecording,
    recordingDuration,
    audioLevel,
    error,
  }
}
