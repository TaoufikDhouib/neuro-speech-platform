import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Mascot from '../components/Mascot'
import Logo from '../components/Logo'

const features = [
  {
    emoji: '🎮',
    title: 'Gamified Learning',
    desc: 'XP rewards, streaks, levels and hearts make speech practice feel like a fun adventure every single day.',
  },
  {
    emoji: '🧠',
    title: 'Neural Analysis',
    desc: 'AI-powered speech analysis detects early signs of articulation, fluency and phonological challenges.',
  },
  {
    emoji: '📊',
    title: 'Parent Insights',
    desc: 'Detailed progress reports with risk-level indicators help parents and therapists act early.',
  },
]

const steps = [
  { num: '1', emoji: '👶', title: 'Add Your Child', desc: 'Create a profile with name, age, and choose a fun avatar.' },
  { num: '2', emoji: '🎙️', title: 'Play Speech Games', desc: 'Complete daily exercises: repeat words, name pictures, tell stories.' },
  { num: '3', emoji: '📋', title: 'Get Neural Reports', desc: 'Receive AI-generated reports with domain scores and risk assessments.' },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
}

export default function Home() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">

      {/* ── Hero — flat Duolingo green ── */}
      <div className="bg-brand-500">
        {/* Navbar */}
        <nav className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <Logo size="md" className="[&_span]:text-white [&_.text-brand-600]:text-white [&_.text-gray-800]:text-white" />
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-5 py-2 rounded-xl font-bold text-white/90 hover:text-white hover:bg-white/15 transition-all duration-150"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-5 py-2 rounded-xl font-black bg-white text-brand-600 transition-all duration-150"
              style={{ boxShadow: '0 4px 0 #46A302' }}
            >
              Start Free
            </Link>
          </div>
        </nav>

        {/* Hero content */}
        <section className="max-w-6xl mx-auto px-6 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -32 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15, duration: 0.4 }}
                className="inline-flex items-center gap-2 bg-white/20 border border-white/30 rounded-full px-4 py-2 text-white text-sm font-bold mb-6"
              >
                <span>✨</span> AI-Powered Early Detection
              </motion.div>

              <h1 className="text-5xl md:text-6xl font-black text-white leading-tight mb-6">
                Speech therapy
                <br />
                <span className="text-[#FFC800]">kids actually love</span>
              </h1>

              <p className="text-white/85 text-lg font-semibold leading-relaxed mb-8">
                Making learning fun while we look out for your child's development.
                Gamified speech exercises with AI neurological screening built in.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                {/* Primary CTA — white button, green shadow */}
                <Link
                  to="/register"
                  className="px-8 py-4 bg-white text-brand-600 font-black text-lg rounded-2xl text-center transition-all duration-100 active:translate-y-0.5"
                  style={{ boxShadow: '0 4px 0 #46A302' }}
                >
                  🚀 Start Free Today
                </Link>
                <Link
                  to="/login"
                  className="px-8 py-4 bg-white/15 border-2 border-white/40 text-white font-black text-lg rounded-2xl hover:bg-white/25 transition-all duration-150 text-center"
                >
                  Sign In
                </Link>
              </div>

              <div className="flex items-center gap-6 mt-8">
                {[
                  { icon: '👶', label: '10k+ Kids' },
                  { icon: '⭐', label: '4.9 Rating' },
                  { icon: '🏥', label: 'Clinically Reviewed' },
                ].map((stat) => (
                  <div key={stat.label} className="flex items-center gap-2">
                    <span className="text-xl">{stat.icon}</span>
                    <span className="text-white/80 font-bold text-sm">{stat.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Mascot + mock card */}
            <motion.div
              initial={{ opacity: 0, x: 32 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="flex flex-col items-center gap-6"
            >
              <Mascot mood="happy" size="lg" message="Hi! I'm Bright. Let's learn together! 🎉" />

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.4 }}
                className="bg-white rounded-2xl p-6 border-2 border-[#E5E5E5] w-full max-w-xs"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="badge bg-brand-100 text-brand-700">🔤 Repeat Word</span>
                  <span className="text-xs font-bold text-gray-400">2 of 5</span>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <div className="w-20 h-20 bg-brand-100 rounded-2xl flex items-center justify-center text-5xl">
                    🌈
                  </div>
                  <p className="text-gray-500 font-bold text-sm">Say this word:</p>
                  <div className="bg-brand-500 rounded-2xl px-6 py-3" style={{ boxShadow: '0 4px 0 #46A302' }}>
                    <p className="text-white font-black text-2xl">Rainbow</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>
      </div>

      {/* ── Features — white section ── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="text-center mb-14"
          >
            <h2 className="text-4xl font-black text-gray-800 mb-4">
              Why parents love{' '}
              <span className="text-brand-600">NeuroBright</span>
            </h2>
            <p className="text-gray-500 font-semibold text-lg max-w-xl mx-auto">
              The only platform that combines gamified speech therapy with clinical-grade neurological screening.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-6"
          >
            {features.map((f) => (
              <motion.div
                key={f.title}
                variants={itemVariants}
                className="bg-white rounded-2xl p-7 border-2 border-[#E5E5E5] hover:border-[#1CB0F6] transition-colors duration-150"
              >
                <div className="w-14 h-14 rounded-2xl bg-brand-100 flex items-center justify-center text-3xl mb-5">
                  {f.emoji}
                </div>
                <h3 className="font-black text-gray-800 text-xl mb-3">{f.title}</h3>
                <p className="text-gray-600 font-semibold leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* How it works */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-24 text-center mb-14"
          >
            <h2 className="text-4xl font-black text-gray-800 mb-4">How it works</h2>
            <p className="text-gray-500 font-semibold text-lg">Get started in minutes, see results in weeks</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center text-center"
              >
                <div className="relative mb-4">
                  <div className="w-20 h-20 rounded-2xl bg-brand-100 flex items-center justify-center text-4xl">
                    {step.emoji}
                  </div>
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-brand-500 text-white font-black text-sm flex items-center justify-center">
                    {step.num}
                  </div>
                </div>
                <h3 className="font-black text-gray-800 text-lg mb-2">{step.title}</h3>
                <p className="text-gray-500 font-semibold leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Bottom CTA — flat green */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-20 bg-brand-500 rounded-2xl p-12 text-center"
          >
            <h2 className="text-4xl font-black text-white mb-4">Ready to get started?</h2>
            <p className="text-white/85 font-semibold text-lg mb-8 max-w-md mx-auto">
              Join thousands of families using NeuroBright to support their children's speech development.
            </p>
            <Link
              to="/register"
              className="inline-block px-10 py-4 bg-white text-brand-600 font-black text-xl rounded-2xl transition-all duration-100"
              style={{ boxShadow: '0 4px 0 #46A302' }}
            >
              🎉 Start for Free
            </Link>
            <p className="text-white/60 font-semibold text-sm mt-4">
              No credit card required. Free forever for basic use.
            </p>
          </motion.div>
        </div>

        {/* Footer */}
        <div className="max-w-6xl mx-auto mt-16 pt-8 border-t-2 border-[#E5E5E5] flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🧠</span>
            <span className="font-black text-gray-700">NeuroBright</span>
          </div>
          <p className="text-gray-400 font-semibold text-sm">
            © 2025 NeuroBright. Made with ❤️ for children everywhere.
          </p>
        </div>
      </section>
    </div>
  )
}
