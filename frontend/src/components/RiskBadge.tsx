import type { RiskLevel } from '../types'

interface RiskBadgeProps {
  riskLevel: RiskLevel
  size?: 'sm' | 'md' | 'lg'
}

const riskConfig = {
  LOW: {
    label: 'Low Risk',
    emoji: '✅',
    classes: 'bg-primary-100 text-primary-700 border-primary-300',
    dot: 'bg-primary-500',
  },
  MODERATE: {
    label: 'Moderate',
    emoji: '⚠️',
    classes: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    dot: 'bg-yellow-500',
  },
  HIGH: {
    label: 'High Risk',
    emoji: '🔶',
    classes: 'bg-orange-100 text-orange-700 border-orange-300',
    dot: 'bg-orange-500',
  },
  REFER: {
    label: 'Refer Now',
    emoji: '🚨',
    classes: 'bg-red-100 text-red-700 border-red-300',
    dot: 'bg-red-500',
  },
}

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs gap-1',
  md: 'px-3 py-1 text-sm gap-1.5',
  lg: 'px-4 py-2 text-base gap-2',
}

export default function RiskBadge({ riskLevel, size = 'md' }: RiskBadgeProps) {
  const config = riskConfig[riskLevel]
  const sizeClass = sizeClasses[size]

  return (
    <span
      className={`inline-flex items-center font-bold rounded-full border-2 ${config.classes} ${sizeClass}`}
    >
      <span>{config.emoji}</span>
      <span>{config.label}</span>
    </span>
  )
}
