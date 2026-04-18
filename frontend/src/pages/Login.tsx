import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'
import Logo from '../components/Logo'

export default function Login() {
  const navigate = useNavigate()
  const { login, isLoading, error, isAuthenticated, clearError } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard')
  }, [isAuthenticated, navigate])

  useEffect(() => {
    if (error) { toast.error(error); clearError() }
  }, [error, clearError])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) { toast.error('Please fill in all fields'); return }
    const success = await login(email, password)
    if (success) { toast.success('Welcome back! 🎉'); navigate('/dashboard') }
  }

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
            <h1 className="font-black text-2xl text-gray-800">Welcome back!</h1>
            <p className="text-gray-500 font-semibold mt-1 text-center text-sm">
              Sign in to continue your child's journey
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
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
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 font-bold text-sm"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
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
                  Signing in...
                </span>
              ) : (
                '🚀 Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 text-center space-y-3">
            <p className="text-gray-500 font-semibold text-sm">
              Don't have an account?{' '}
              <Link to="/register" className="text-brand-600 font-bold hover:underline">
                Sign up free
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
