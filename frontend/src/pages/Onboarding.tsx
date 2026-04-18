import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import Logo from '../components/Logo'
import { authAPI, childrenAPI } from '../services/api'

// ── Avatar options ────────────────────────────────────────────────────────────
const AVATARS = [
  { seed: 'lion',     emoji: '🦁' },
  { seed: 'panda',    emoji: '🐼' },
  { seed: 'fox',      emoji: '🦊' },
  { seed: 'frog',     emoji: '🐸' },
  { seed: 'unicorn',  emoji: '🦄' },
  { seed: 'penguin',  emoji: '🐧' },
  { seed: 'dolphin',  emoji: '🐬' },
  { seed: 'dragon',   emoji: '🐲' },
]

const STEP_COUNT = 4

// ── Slide variants ────────────────────────────────────────────────────────────
const slide = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center:               { x: 0, opacity: 1 },
  exit:  (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
}

export default function Onboarding() {
  const navigate = useNavigate()
  const [step, setStep]     = useState(0)
  const [dir,  setDir]      = useState(1)
  const [loading, setLoading] = useState(false)

  // Step 1 — account
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')

  // Step 2 — child
  const [childName,   setChildName]   = useState('')
  const [childAge,    setChildAge]    = useState(5)
  const [avatarSeed,  setAvatarSeed]  = useState('lion')

  function go(next: number) {
    setDir(next > step ? 1 : -1)
    setStep(next)
  }

  // ── Submit account + child ────────────────────────────────────────────────
  async function handleFinish() {
    if (!childName.trim()) { toast.error('Give your child a name!'); return }
    setLoading(true)
    try {
      const { token } = await authAPI.register({ email, password, name })
      localStorage.setItem('token', token)
      await childrenAPI.create({ name: childName, age: childAge, avatarSeed })
      go(3)
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateAccount() {
    if (!name.trim() || !email.trim() || !password.trim()) {
      toast.error('Fill in all fields')
      return
    }
    if (password.length < 6) { toast.error('Password needs 6+ characters'); return }
    go(2)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0a1e] via-[#1a0f3c] to-[#0d1f2d] flex flex-col items-center justify-center p-4">

      {/* Progress dots */}
      {step > 0 && step < 3 && (
        <div className="flex gap-2 mb-8">
          {Array.from({ length: STEP_COUNT - 1 }).map((_, i) => (
            <div key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i < step ? 'w-8 bg-brand-500' : i === step - 1 ? 'w-8 bg-brand-400' : 'w-2 bg-white/20'
              }`}
            />
          ))}
        </div>
      )}

      <AnimatePresence mode="wait" custom={dir}>
        {/* ── Step 0: Welcome ───────────────────────────────────────────── */}
        {step === 0 && (
          <motion.div key="welcome"
            custom={dir} variants={slide} initial="enter" animate="center" exit="exit"
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="flex flex-col items-center text-center max-w-sm w-full"
          >
            <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1, type: 'spring' }}>
              <Logo size="xl" showText={false} className="justify-center mb-6" />
            </motion.div>

            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25 }}>
              <h1 className="text-5xl font-black text-white mb-2">
                Neuro<span className="text-brand-400">Bright</span>
              </h1>
              <p className="text-white/60 text-lg mb-2">Early detection. Joyful learning.</p>
              <p className="text-white/40 text-sm mb-10 leading-relaxed">
                Fun speech games that help detect neurological differences in children — early, accurately, and without stress.
              </p>
            </motion.div>

            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
              className="w-full space-y-3">
              <button onClick={() => go(1)}
                className="w-full py-4 bg-brand-500 hover:bg-brand-600 text-white font-black text-lg rounded-2xl shadow-lg shadow-brand-500/30 transition-all active:scale-95">
                Get Started →
              </button>
              <button onClick={() => navigate('/login')}
                className="w-full py-3 text-white/50 hover:text-white/80 font-semibold text-sm transition-colors">
                Already have an account? Sign in
              </button>
            </motion.div>

            {/* How it works pills */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
              className="flex gap-3 mt-10 flex-wrap justify-center">
              {[
                { icon: '🎮', label: 'Play games' },
                { icon: '🧠', label: 'AI analysis' },
                { icon: '📊', label: 'Parent reports' },
              ].map(({ icon, label }) => (
                <div key={label} className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1.5 text-white/70 text-xs font-semibold">
                  <span>{icon}</span><span>{label}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>
        )}

        {/* ── Step 1: Create account ───────────────────────────────────── */}
        {step === 1 && (
          <motion.div key="account"
            custom={dir} variants={slide} initial="enter" animate="center" exit="exit"
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="w-full max-w-sm"
          >
            <Logo size="sm" className="mb-6" />
            <h2 className="text-3xl font-black text-white mb-1">Create your account</h2>
            <p className="text-white/50 text-sm mb-6">You're the parent or therapist.</p>

            <div className="space-y-3">
              <div>
                <label className="text-white/60 text-xs font-bold uppercase tracking-wider mb-1 block">Your name</label>
                <input value={name} onChange={e => setName(e.target.value)}
                  placeholder="Sarah Johnson"
                  className="w-full bg-white/10 border border-white/20 text-white placeholder-white/30 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-400 transition-colors font-semibold"/>
              </div>
              <div>
                <label className="text-white/60 text-xs font-bold uppercase tracking-wider mb-1 block">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="sarah@example.com"
                  className="w-full bg-white/10 border border-white/20 text-white placeholder-white/30 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-400 transition-colors font-semibold"/>
              </div>
              <div>
                <label className="text-white/60 text-xs font-bold uppercase tracking-wider mb-1 block">Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="6+ characters"
                  className="w-full bg-white/10 border border-white/20 text-white placeholder-white/30 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-400 transition-colors font-semibold"/>
              </div>
            </div>

            <button onClick={handleCreateAccount}
              className="w-full mt-6 py-4 bg-brand-500 hover:bg-brand-600 text-white font-black text-lg rounded-2xl shadow-lg transition-all active:scale-95">
              Continue →
            </button>
            <button onClick={() => go(0)} className="w-full mt-3 text-white/40 hover:text-white/60 text-sm font-semibold transition-colors">
              ← Back
            </button>
          </motion.div>
        )}

        {/* ── Step 2: Add child ─────────────────────────────────────────── */}
        {step === 2 && (
          <motion.div key="child"
            custom={dir} variants={slide} initial="enter" animate="center" exit="exit"
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="w-full max-w-sm"
          >
            <Logo size="sm" className="mb-6" />
            <h2 className="text-3xl font-black text-white mb-1">Add your child</h2>
            <p className="text-white/50 text-sm mb-6">You can add more later.</p>

            {/* Avatar picker */}
            <div className="mb-5">
              <label className="text-white/60 text-xs font-bold uppercase tracking-wider mb-2 block">Pick an avatar</label>
              <div className="grid grid-cols-4 gap-2">
                {AVATARS.map(({ seed, emoji }) => (
                  <button key={seed} onClick={() => setAvatarSeed(seed)}
                    className={`text-3xl p-2 rounded-xl border-2 transition-all ${
                      avatarSeed === seed
                        ? 'border-brand-400 bg-brand-500/20 scale-110'
                        : 'border-white/10 bg-white/5 hover:border-white/30'
                    }`}>
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-white/60 text-xs font-bold uppercase tracking-wider mb-1 block">Child's name</label>
                <input value={childName} onChange={e => setChildName(e.target.value)}
                  placeholder="e.g. Emma"
                  className="w-full bg-white/10 border border-white/20 text-white placeholder-white/30 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-400 transition-colors font-semibold"/>
              </div>
              <div>
                <label className="text-white/60 text-xs font-bold uppercase tracking-wider mb-1 block">
                  Age — <span className="text-brand-400 font-black">{childAge} years old</span>
                </label>
                <input type="range" min={3} max={12} value={childAge} onChange={e => setChildAge(+e.target.value)}
                  className="w-full accent-brand-500 cursor-pointer"/>
                <div className="flex justify-between text-white/30 text-xs mt-1">
                  <span>3</span><span>12</span>
                </div>
              </div>
            </div>

            <button onClick={handleFinish} disabled={loading}
              className="w-full mt-6 py-4 bg-primary-500 hover:bg-primary-600 disabled:opacity-60 text-white font-black text-lg rounded-2xl shadow-lg shadow-primary-500/30 transition-all active:scale-95 flex items-center justify-center gap-2">
              {loading ? (
                <><span className="animate-spin">⚡</span> Creating profile...</>
              ) : (
                <>Let's go! 🚀</>
              )}
            </button>
            <button onClick={() => go(1)} className="w-full mt-3 text-white/40 hover:text-white/60 text-sm font-semibold transition-colors">
              ← Back
            </button>
          </motion.div>
        )}

        {/* ── Step 3: Done! ─────────────────────────────────────────────── */}
        {step === 3 && (
          <motion.div key="done"
            custom={dir} variants={slide} initial="enter" animate="center" exit="exit"
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="flex flex-col items-center text-center max-w-sm w-full"
          >
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 12 }}
              className="text-8xl mb-6"
            >
              {AVATARS.find(a => a.seed === avatarSeed)?.emoji ?? '🎉'}
            </motion.div>

            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
              <h2 className="text-4xl font-black text-white mb-2">
                {childName} is ready! 🎉
              </h2>
              <p className="text-white/50 mb-2">Age {childAge} · NeuroBright profile created</p>
              <p className="text-white/40 text-sm mb-8 leading-relaxed">
                Start a session to begin speech analysis. Each session takes about 5 minutes and is designed to feel like a game.
              </p>
            </motion.div>

            {/* Floating particles */}
            {['⚡', '✨', '🌟', '💫', '⭐'].map((s, i) => (
              <motion.span key={i} className="absolute text-2xl pointer-events-none"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 1, 0], scale: [0, 1.2, 0], x: (i - 2) * 80, y: -60 - i * 20 }}
                transition={{ delay: 0.1 * i, duration: 1.2 }}>
                {s}
              </motion.span>
            ))}

            <motion.button
              initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
              onClick={() => navigate('/dashboard')}
              className="w-full py-4 bg-primary-500 hover:bg-primary-600 text-white font-black text-xl rounded-2xl shadow-lg shadow-primary-500/30 transition-all active:scale-95">
              Go to Dashboard →
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
