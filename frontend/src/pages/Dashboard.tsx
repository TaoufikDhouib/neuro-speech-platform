import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { childrenAPI } from '../services/api'
import Layout from '../components/Layout'
import ChildCard from '../components/ChildCard'
import { useAuth } from '../hooks/useAuth'

const AVATAR_SEEDS = ['star', 'moon', 'sun', 'cloud', 'rainbow', 'comet', 'planet', 'galaxy']

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl p-5 border-2 border-[#E5E5E5]">
      <div className="flex items-start gap-4 mb-4">
        <div className="skeleton w-16 h-16 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-5 w-24 rounded" />
          <div className="skeleton h-4 w-16 rounded" />
          <div className="skeleton h-5 w-16 rounded-full" />
        </div>
      </div>
      <div className="skeleton h-3 w-full rounded-full" />
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ name: '', age: '', avatarSeed: AVATAR_SEEDS[0] })
  const [formError, setFormError] = useState<string | null>(null)

  const { data: children = [], isLoading } = useQuery({
    queryKey: ['children'],
    queryFn: childrenAPI.getAll,
  })

  const createMutation = useMutation({
    mutationFn: childrenAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['children'] })
      setModalOpen(false)
      setForm({ name: '', age: '', avatarSeed: AVATAR_SEEDS[0] })
      toast.success('Child profile created! 🎉')
    },
    onError: () => toast.error('Failed to create profile. Please try again.'),
  })

  const handleCreateChild = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    if (!form.name.trim()) { setFormError('Please enter a name'); return }
    const age = parseInt(form.age)
    if (!form.age || isNaN(age) || age < 1 || age > 12) {
      setFormError('Please enter a valid age (1–12)')
      return
    }
    createMutation.mutate({ name: form.name.trim(), age, avatarSeed: form.avatarSeed })
  }

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-800">
              {greeting()}, {user?.name?.split(' ')[0]}! 👋
            </h1>
            <p className="text-gray-500 font-semibold mt-1">
              {children.length === 0
                ? "Let's add your first child to get started!"
                : `Managing ${children.length} ${children.length === 1 ? 'child' : 'children'}`}
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="btn-primary self-start sm:self-auto"
          >
            ➕ Add Child
          </button>
        </div>

        {/* Children grid */}
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : children.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-[#E5E5E5]"
          >
            <div className="text-6xl mb-4">👶</div>
            <h3 className="text-xl font-black text-gray-700 mb-2">No children yet</h3>
            <p className="text-gray-500 font-semibold mb-6">
              Add your first child profile to start speech exercises
            </p>
            <button onClick={() => setModalOpen(true)} className="btn-primary">
              ➕ Add First Child
            </button>
          </motion.div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {children.map((child, i) => (
              <motion.div
                key={child.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
              >
                <ChildCard child={child} onClick={() => navigate(`/dashboard/${child.id}`)} />
              </motion.div>
            ))}
          </div>
        )}

        {/* Stats row — flat colored boxes, no gradients */}
        {children.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mt-8 grid grid-cols-3 gap-4"
          >
            {[
              {
                label: 'Total XP',
                value: children.reduce((s, c) => s + c.xp, 0).toLocaleString(),
                emoji: '⚡',
                bg: 'bg-brand-100',
                text: 'text-brand-700',
              },
              {
                label: 'Avg Level',
                value: children.length
                  ? Math.round(children.reduce((s, c) => s + c.level, 0) / children.length)
                  : 0,
                emoji: '🏆',
                bg: 'bg-accent-100',
                text: 'text-accent-700',
              },
              {
                label: 'Best Streak',
                value: children.length ? Math.max(...children.map((c) => c.streak)) : 0,
                emoji: '🔥',
                bg: 'bg-[#FFF4D1]',
                text: 'text-[#B07800]',
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className={`${stat.bg} rounded-2xl p-4 text-center border-2 border-[#E5E5E5]`}
              >
                <div className="text-2xl mb-1">{stat.emoji}</div>
                <div className={`font-black text-2xl ${stat.text}`}>{stat.value}</div>
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        )}
      </motion.div>

      {/* Add Child Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4"
            onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.93, y: 16, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.93, y: 16, opacity: 0 }}
              transition={{ type: 'spring', damping: 22, stiffness: 320 }}
              className="bg-white rounded-2xl border-2 border-[#E5E5E5] p-8 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-gray-800">Add a child 👶</h2>
                <button
                  onClick={() => setModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-500 transition-colors"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateChild} className="space-y-5">
                <div>
                  <label className="block font-bold text-gray-700 mb-1.5 text-xs uppercase tracking-wider">
                    Child's name
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="input-field"
                    placeholder="e.g. Emma"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1.5 text-xs uppercase tracking-wider">
                    Age (1–12)
                  </label>
                  <input
                    type="number"
                    value={form.age}
                    onChange={(e) => setForm({ ...form, age: e.target.value })}
                    className="input-field"
                    placeholder="e.g. 5"
                    min={1}
                    max={12}
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-2 text-xs uppercase tracking-wider">
                    Choose avatar
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {AVATAR_SEEDS.map((seed) => (
                      <button
                        key={seed}
                        type="button"
                        onClick={() => setForm({ ...form, avatarSeed: seed })}
                        className={`px-3 py-1.5 rounded-xl text-sm font-bold transition-all duration-150 ${
                          form.avatarSeed === seed
                            ? 'bg-brand-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        style={form.avatarSeed === seed ? { boxShadow: '0 3px 0 #46A302' } : {}}
                      >
                        {seed}
                      </button>
                    ))}
                  </div>
                </div>

                {formError && (
                  <p className="text-[#FF4B4B] font-bold text-sm bg-[#FFE9E9] rounded-xl px-4 py-2">
                    ⚠️ {formError}
                  </p>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="btn-ghost flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="btn-primary flex-1"
                  >
                    {createMutation.isPending ? (
                      <span className="flex items-center gap-2 justify-center">
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                        />
                        Creating...
                      </span>
                    ) : (
                      '🎉 Add Child'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  )
}
