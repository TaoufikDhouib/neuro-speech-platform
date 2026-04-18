import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { childrenAPI, reportsAPI } from '../services/api'
import Layout from '../components/Layout'
import XPBar from '../components/XPBar'
import RiskBadge from '../components/RiskBadge'
import { getAvatar, getAvatarBg } from '../components/ChildCard'

function SkeletonDetail() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="bg-white rounded-2xl border-2 border-[#E5E5E5] p-6 flex items-center gap-5">
        <div className="skeleton w-20 h-20 rounded-2xl" />
        <div className="flex-1 space-y-3">
          <div className="skeleton h-7 w-40 rounded" />
          <div className="skeleton h-4 w-24 rounded" />
          <div className="skeleton h-3 w-full rounded-full" />
        </div>
      </div>
      <div className="skeleton h-40 rounded-2xl" />
      <div className="skeleton h-52 rounded-2xl" />
    </div>
  )
}

export default function ChildDetail() {
  const { childId } = useParams<{ childId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: child, isLoading: childLoading, error: childError } = useQuery({
    queryKey: ['child', childId],
    queryFn: () => childrenAPI.get(childId!),
    enabled: !!childId,
  })

  const { data: reports = [], isLoading: reportsLoading } = useQuery({
    queryKey: ['reports', childId],
    queryFn: () => reportsAPI.getAll(childId!),
    enabled: !!childId,
  })

  const generateReportMutation = useMutation({
    mutationFn: () => reportsAPI.generate(childId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports', childId] })
      toast.success('Neural report generated! 🧠')
    },
    onError: () => toast.error('Failed to generate report. Please try again.'),
  })

  if (childLoading) return <Layout><SkeletonDetail /></Layout>

  if (childError || !child) {
    return (
      <Layout>
        <div className="text-center py-20">
          <div className="text-5xl mb-4">😔</div>
          <h2 className="text-xl font-black text-gray-700 mb-4">Child not found</h2>
          <Link to="/dashboard" className="btn-primary">← Back to Dashboard</Link>
        </div>
      </Layout>
    )
  }

  const avatar = getAvatar(child.avatarSeed || child.name)
  const avatarBg = getAvatarBg(child.avatarSeed || child.name)
  const latestReport = reports[0] ?? null

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="space-y-6"
      >
        {/* Back */}
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-gray-500 font-bold hover:text-brand-600 transition-colors"
        >
          ← Back to Dashboard
        </Link>

        {/* Child Header Card — flat */}
        <div className="bg-white rounded-2xl border-2 border-[#E5E5E5] p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl flex-shrink-0"
              style={{ background: avatarBg }}
            >
              {avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-1">
                <h1 className="text-3xl font-black text-gray-800">{child.name}</h1>
                <span className="pill pill-xp">Level {child.level}</span>
              </div>
              <p className="text-gray-500 font-semibold mb-3">
                Age {child.age}
                {child.streak > 0 && (
                  <span className="ml-3 font-bold" style={{ color: '#B07800' }}>
                    🔥 {child.streak} day streak
                  </span>
                )}
              </p>
              <XPBar xp={child.xp} level={child.level} />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3 mt-6">
            <button
              onClick={() => navigate(`/game/${child.id}`)}
              className="btn-primary flex-1 sm:flex-none px-8 py-4 text-lg"
            >
              🎮 Play Now
            </button>
            <Link
              to={`/reports/${child.id}`}
              className="btn-secondary flex-1 sm:flex-none px-6 py-4 text-center"
            >
              📊 View Reports
            </Link>
          </div>
        </div>

        {/* Stats Row — flat colored cells */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total XP', value: child.xp.toLocaleString(), emoji: '⚡',  bg: 'bg-brand-100',   text: 'text-brand-700' },
            { label: 'Hearts',   value: `${child.hearts}/5`,        emoji: '❤️', bg: 'bg-[#FFE9E9]',  text: 'text-[#FF4B4B]' },
            { label: 'Streak',   value: child.streak,               emoji: '🔥', bg: 'bg-[#FFF4D1]',  text: 'text-[#B07800]' },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`${stat.bg} rounded-2xl p-4 text-center border-2 border-[#E5E5E5]`}
            >
              <div className="text-2xl mb-1">{stat.emoji}</div>
              <div className={`font-black text-xl ${stat.text}`}>{stat.value}</div>
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Neural Report Card */}
        <div className="bg-white rounded-2xl border-2 border-[#E5E5E5] p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-black text-gray-800">🧠 Neural Report</h2>
            <button
              onClick={() => generateReportMutation.mutate()}
              disabled={generateReportMutation.isPending}
              className="btn-primary py-2 px-4 text-sm"
            >
              {generateReportMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full"
                  />
                  Generating...
                </span>
              ) : (
                '⚡ Generate Report'
              )}
            </button>
          </div>

          {reportsLoading ? (
            <div className="space-y-3">
              <div className="skeleton h-10 w-32 rounded-full" />
              <div className="skeleton h-4 w-full rounded" />
              <div className="skeleton h-4 w-3/4 rounded" />
            </div>
          ) : latestReport ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="flex items-center gap-3">
                <RiskBadge riskLevel={latestReport.riskLevel} size="md" />
                <span className="text-sm font-semibold text-gray-400">
                  {new Date(latestReport.generatedAt).toLocaleDateString('en-US', {
                    month: 'long', day: 'numeric', year: 'numeric',
                  })}
                </span>
              </div>

              <p className="text-gray-600 font-semibold text-sm leading-relaxed line-clamp-3">
                {latestReport.summary}
              </p>

              {latestReport.flags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {latestReport.flags.slice(0, 3).map((flag) => (
                    <span key={flag} className="badge bg-orange-100 text-orange-700 text-xs">
                      ⚠️ {flag}
                    </span>
                  ))}
                  {latestReport.flags.length > 3 && (
                    <span className="badge bg-gray-100 text-gray-600 text-xs">
                      +{latestReport.flags.length - 3} more
                    </span>
                  )}
                </div>
              )}

              <Link
                to={`/reports/${child.id}`}
                className="inline-flex items-center gap-2 text-brand-600 font-bold text-sm hover:underline"
              >
                View full report →
              </Link>
            </motion.div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">📋</div>
              <p className="text-gray-500 font-semibold">No reports yet.</p>
              <p className="text-gray-400 font-semibold text-sm mt-1">
                Play some exercises first, then generate a report.
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </Layout>
  )
}
