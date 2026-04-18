import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'
import Logo from '../components/Logo'

export default function Register() {
  const navigate = useNavigate()
  const { register, isLoading, error, isAuthenticated, clearError } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard')
  }, [isAuthenticated, navigate])

  useEffect(() => {
    if (error) { toast.error(error); clearError() }
  }, [error, clearError])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !password || !confirm) { toast.error('Please fill in all fields'); return }
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return }
    if (password !== confirm) { toast.error('Passwords do not match'); return }
    const success = await register({ name, email, password })
    if (success) { toast.success("Welcome to NeuroBright! 🎉 Let's get started!"); navigate('/dashboard') }
  }

  const passwordStrength = () => {
    if (!password) return null
    if (password.length < 6)  return { level: 1, label: 'Too short',   color: 'bg-[#FF4B4B]' }
    if (password.length < 8)  return { level: 2, label: 'Weak',        color: 'bg-[#FFC800]' }
    if (password.match(/[A-Z]/) && password.match(/[0-9]/)) {
      return { level: 4, label: 'Strong 💪', color: 'bg-[#58CC02]' }
    }
    return { level: 3, label: 'Good', color: 'bg-[#1CB0F6]' }
  }

  const strength = passwordStrength()

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        {/* Card — flat border, no shadow */}
        <div className="bg-white rounded-2xl border-2 border-[#E5E5E5] p-8">

          {/* Header */}
          <div className="flex flex-col items-center mb-8">
            <Logo size="md" className="mb-4" />
            <h1 className="font-black text-2xl text-gray-800">Create account</h1>
            <p className="text-gray-500 font-semibold mt-1 text-center text-sm">
              Start your child's speech journey for free
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-bold text-gray-700 mb-1.5 text-xs uppercase tracking-wider">
                Your name (parent / guardian)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
                placeholder="Jane Smith"
                required
                autoComplete="name"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1.5 text-xs uppercase tracking-wider">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1.5 text-xs uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-12"
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 font-bold text-sm"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>

              {strength && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                          i <= strength.level ? strength.color : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs font-bold text-gray-500">{strength.label}</p>
                </div>
              )}
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1.5 text-xs uppercase tracking-wider">
                Confirm password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={`input-field ${
                  confirm && confirm !== password ? '!border-[#FF4B4B]' :
                  confirm && confirm === password  ? '!border-[#58CC02]' : ''
                }`}
                placeholder="••••••••"
                required
                autoComplete="new-password"
              />
              {confirm && confirm === password && (
                <p className="text-xs font-bold text-brand-600 mt-1">✅ Passwords match</p>
              )}
              {confirm && confirm !== password && (
                <p className="text-xs font-bold text-[#FF4B4B] mt-1">❌ Passwords don't match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-4 text-base mt-2"
            >
              {isLoading ? (
                <span className="flex items-center gap-2 justify-center">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  />
                  Creating account...
                </span>
              ) : (
                '🎉 Create My Account'
              )}
            </button>

            <p className="text-xs text-gray-400 font-semibold text-center">
              By signing up, you agree to our Terms of Service.
            </p>
          </form>

          <div className="mt-6 text-center space-y-2">
            <p className="text-gray-500 font-semibold text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-brand-600 font-bold hover:underline">
                Sign in
              </Link>
            </p>
            <Link to="/" className="text-gray-400 font-semibold text-sm hover:text-gray-600 block">
              ← Back to home
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
