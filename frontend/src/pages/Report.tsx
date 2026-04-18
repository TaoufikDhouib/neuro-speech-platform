import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { childrenAPI, reportsAPI } from '../services/api'
import Layout from '../components/Layout'
import NeuroChart from '../components/NeuroChart'
import RiskBadge from '../components/RiskBadge'
import type { NeuralRiskDomains, NeuroReport } from '../types'

const DOMAIN_LABELS: Record<keyof NeuralRiskDomains, string> = {
  articulation: 'Articulation',
  fluency: 'Fluency',
  phonologicalAwareness: 'Phonological Awareness',
  vocabulary: 'Vocabulary',
  processingSpeed: 'Processing Speed',
  workingMemory: 'Working Memory',
}

const DOMAIN_EMOJIS: Record<keyof NeuralRiskDomains, string> = {
  articulation: '🗣️',
  fluency: '🌊',
  phonologicalAwareness: '🔊',
  vocabulary: '📚',
  processingSpeed: '⚡',
  workingMemory: '🧠',
}

function getDomainInterpretation(score: number) {
  if (score > 80) return { text: 'Excellent — no concerns', color: 'text-brand-600', bg: 'bg-brand-100', bar: 'bg-brand-500' }
  if (score >= 60) return { text: 'Good — minor areas to watch', color: 'text-accent-700', bg: 'bg-accent-100', bar: 'bg-accent-500' }
  if (score >= 40) return { text: 'Moderate — recommend monitoring', color: 'text-[#B07800]', bg: 'bg-[#FFF4D1]', bar: 'bg-[#FFC800]' }
  return { text: 'Concern — professional evaluation recommended', color: 'text-[#FF4B4B]', bg: 'bg-[#FFE9E9]', bar: 'bg-[#FF4B4B]' }
}

function DomainCard({ domainKey, score }: { domainKey: keyof NeuralRiskDomains; score: number }) {
  const interp = getDomainInterpretation(score)
  const label = DOMAIN_LABELS[domainKey]
  const emoji = DOMAIN_EMOJIS[domainKey]

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border-2 p-4 ${interp.bg} border-current`}
      style={{ borderColor: 'transparent' }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{emoji}</span>
          <span className="font-black text-gray-800 text-sm">{label}</span>
        </div>
        <span className={`font-black text-xl ${interp.color}`}>{score}</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full mb-2">
        <motion.div
          className={`h-full rounded-full ${interp.bar}`}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
        />
      </div>
      <p className={`text-xs font-bold ${interp.color}`}>{interp.text}</p>
    </motion.div>
  )
}

function ReportView({ report, childName }: { report: NeuroReport; childName: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Risk Level Banner */}
      <div className="bg-white rounded-2xl border-2 border-[#E5E5E5] p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-2">
              Neural Risk Assessment
            </p>
            <RiskBadge riskLevel={report.riskLevel} size="lg" />
            <p className="text-sm font-semibold text-gray-400 mt-2">
              Generated:{' '}
              {new Date(report.generatedAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-gray-400">Child</p>
            <p className="font-black text-2xl text-gray-800">{childName}</p>
          </div>
        </div>
      </div>

      {/* Radar Chart */}
      <div className="bg-white rounded-2xl border-2 border-[#E5E5E5] p-6">
        <h2 className="text-xl font-black text-gray-800 mb-2">Domain Overview</h2>
        <p className="text-sm font-semibold text-gray-400 mb-4">
          Scores across 6 neurological speech domains (0–100)
        </p>
        <NeuroChart domains={report.domains} riskLevel={report.riskLevel} />
      </div>

      {/* Domain Cards Grid */}
      <div>
        <h2 className="text-xl font-black text-gray-800 mb-4">Domain Breakdown</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {(Object.keys(DOMAIN_LABELS) as (keyof NeuralRiskDomains)[]).map((key) => (
            <DomainCard key={key} domainKey={key} score={report.domains[key]} />
          ))}
        </div>
      </div>

      {/* Flags */}
      {report.flags.length > 0 && (
        <div className="bg-white rounded-2xl border-2 border-[#E5E5E5] p-6">
          <h2 className="text-xl font-black text-gray-800 mb-4">⚠️ Flagged Areas</h2>
          <div className="space-y-2">
            {report.flags.map((flag, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-3 bg-[#FFF4D1] border-2 border-[#FFC800] rounded-2xl px-4 py-3"
              >
                <span className="text-lg mt-0.5">⚠️</span>
                <p className="text-[#B07800] font-bold text-sm">{flag}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* AI Summary */}
      <div className="bg-white rounded-2xl border-2 border-[#E5E5E5] p-6">
        <h2 className="text-xl font-black text-gray-800 mb-4">🤖 Clinical Summary</h2>
        <p className="text-gray-700 font-semibold leading-relaxed">{report.summary}</p>
      </div>

      {/* Recommendation box */}
      {(report.riskLevel === 'HIGH' || report.riskLevel === 'REFER') && (
        <motion.div
          initial={{ scale: 0.98, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-[#FFE9E9] border-2 border-[#FF4B4B] rounded-2xl p-6"
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl">🏥</span>
            <div>
              <h3 className="font-black text-[#FF4B4B] text-lg mb-1">Professional Evaluation Recommended</h3>
              <p className="text-[#CC3333] font-semibold text-sm leading-relaxed">
                Based on the analysis, we recommend scheduling an evaluation with a licensed Speech-Language Pathologist (SLP).
                Early intervention leads to significantly better outcomes.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

export default function Report() {
  const { childId } = useParams<{ childId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: child, isLoading: childLoading } = useQuery({
    queryKey: ['child', childId],
    queryFn: () => childrenAPI.get(childId!),
    enabled: !!childId,
  })

  const {
    data: reports = [],
    isLoading: reportsLoading,
  } = useQuery({
    queryKey: ['reports', childId],
    queryFn: () => reportsAPI.getAll(childId!),
    enabled: !!childId,
  })

  const generateMutation = useMutation({
    mutationFn: () => reportsAPI.generate(childId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports', childId] })
      toast.success('New report generated! 🧠')
    },
    onError: () => {
      toast.error('Failed to generate report. Ensure the child has completed some sessions.')
    },
  })

  const handlePrint = () => {
    window.print()
  }

  const isLoading = childLoading || reportsLoading
  const latestReport = reports[0] ?? null

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Back + header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link
              to={`/dashboard/${childId}`}
              className="inline-flex items-center gap-2 text-gray-500 font-bold hover:text-brand-600 transition-colors mb-2 block"
            >
              ← Back to {child?.name ?? 'Child'}
            </Link>
            <h1 className="text-3xl font-black text-gray-800">
              Neural Reports
              {child && (
                <span className="text-brand-500"> — {child.name}</span>
              )}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {latestReport && (
              <button
                onClick={handlePrint}
                className="btn-secondary py-2 px-4 text-sm flex items-center gap-2"
              >
                🖨️ Print
              </button>
            )}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
              className="btn-primary flex items-center gap-2"
            >
              {generateMutation.isPending ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 rounded-full"
                    style={{ border: '2px solid white', borderTopColor: 'transparent' }}
                  />
                  Generating...
                </>
              ) : (
                '⚡ New Report'
              )}
            </motion.button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-6 animate-pulse">
            <div className="skeleton h-32 rounded-2xl" />
            <div className="skeleton h-80 rounded-2xl" />
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="skeleton h-24 rounded-2xl" />
              ))}
            </div>
          </div>
        ) : latestReport ? (
          <>
            <ReportView report={latestReport} childName={child?.name ?? 'Child'} />

            {/* History */}
            {reports.length > 1 && (
              <div className="bg-white rounded-2xl border-2 border-[#E5E5E5] p-6">
                <h2 className="text-xl font-black text-gray-800 mb-4">Report History</h2>
                <div className="space-y-3">
                  {reports.map((r, i) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{i === 0 ? '📋' : '📄'}</span>
                        <div>
                          <p className="font-bold text-gray-700 text-sm">
                            {new Date(r.generatedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </p>
                          {i === 0 && (
                            <span className="text-xs font-black text-brand-600">Latest</span>
                          )}
                        </div>
                      </div>
                      <RiskBadge riskLevel={r.riskLevel} size="sm" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-[#E5E5E5]">
            <div className="text-6xl mb-4">🧠</div>
            <h3 className="text-xl font-black text-gray-700 mb-2">No reports yet</h3>
            <p className="text-gray-500 font-semibold mb-6 max-w-sm mx-auto">
              Complete some speech exercises first, then generate a neural analysis report.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => navigate(`/game/${childId}`)}
                className="btn-success"
              >
                🎮 Play Exercises
              </button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => generateMutation.mutate()}
                disabled={generateMutation.isPending}
                className="btn-primary"
              >
                ⚡ Generate Anyway
              </motion.button>
            </div>
          </div>
        )}
      </motion.div>
    </Layout>
  )
}
