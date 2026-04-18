import type { Child } from '../types'
import XPBar from './XPBar'

interface ChildCardProps {
  child: Child
  onClick: () => void
}

const AVATAR_EMOJIS = ['🦁', '🐼', '🦊', '🐨', '🐸', '🦋', '🐬', '🦄', '🐯', '🦅', '🐧', '🦉']

function getAvatar(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0
  }
  return AVATAR_EMOJIS[Math.abs(hash) % AVATAR_EMOJIS.length]
}

// Flat solid colors — no gradients
const AVATAR_COLORS = ['#58CC02', '#1CB0F6', '#FF9600', '#CE82FF', '#FF86D0', '#FF4B4B']
const AVATAR_TEXT_COLORS = ['#358201', '#0E8FC7', '#c27200', '#9c4ccc', '#cc4a9a', '#D63333']

function getAvatarColor(seed: string): { bg: string; text: string } {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0
  }
  const idx = Math.abs(hash) % AVATAR_COLORS.length
  return { bg: AVATAR_COLORS[idx], text: AVATAR_TEXT_COLORS[idx] }
}

export { getAvatar }

// Keep getAvatarBg as a shim so ChildDetail still compiles
export function getAvatarBg(seed: string): string {
  return getAvatarColor(seed).bg
}

export default function ChildCard({ child, onClick }: ChildCardProps) {
  const avatar = getAvatar(child.avatarSeed || child.name)
  const { bg: avatarBg, text: avatarText } = getAvatarColor(child.avatarSeed || child.name)

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl border-2 border-[#E5E5E5] p-5 cursor-pointer transition-all duration-150 relative overflow-hidden hover:border-[#1CB0F6]"
    >
      {/* Solid color top strip */}
      <div
        className="absolute top-0 left-0 right-0 h-1.5"
        style={{ background: avatarBg }}
      />

      <div className="flex items-start gap-4 mb-4">
        {/* Avatar — flat solid color square */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
          style={{ background: avatarBg }}
        >
          {avatar}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-black text-gray-800 text-lg truncate">{child.name}</h3>
          <p className="text-gray-500 font-semibold text-sm">Age {child.age}</p>

          <div className="flex items-center gap-2 mt-1">
            {/* Level pill */}
            <span className="pill pill-xp text-xs py-0.5 px-2">
              Lvl {child.level}
            </span>
            {child.streak > 0 && (
              <span className="pill pill-streak text-xs py-0.5 px-2">
                🔥 {child.streak}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* XP progress bar */}
      <XPBar xp={child.xp} level={child.level} compact />

      {/* Bottom stats */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t-2 border-[#E5E5E5]">
        <span className="pill pill-lives text-xs py-0.5 px-2">
          ❤️ {child.hearts}/5
        </span>
        {child.lastActive ? (
          <span className="text-xs font-semibold text-gray-400">
            {new Date(child.lastActive).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        ) : (
          <span className="text-xs font-semibold text-gray-400">Never played</span>
        )}
      </div>
    </div>
  )
}
