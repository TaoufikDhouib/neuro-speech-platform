import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import type { NeuralRiskDomains, RiskLevel } from '../types'

interface NeuroChartProps {
  domains: NeuralRiskDomains
  riskLevel?: RiskLevel
}

const DOMAIN_LABELS: Record<keyof NeuralRiskDomains, string> = {
  articulation: 'Articulation',
  fluency: 'Fluency',
  phonologicalAwareness: 'Phonology',
  vocabulary: 'Vocabulary',
  processingSpeed: 'Processing',
  workingMemory: 'Memory',
}

const RISK_COLORS: Record<RiskLevel, { fill: string; stroke: string }> = {
  LOW:      { fill: 'rgba(88, 204, 2, 0.2)',    stroke: '#58CC02' },
  MODERATE: { fill: 'rgba(255, 200, 0, 0.25)',  stroke: '#FFC800' },
  HIGH:     { fill: 'rgba(255, 150, 0, 0.25)',  stroke: '#FF9600' },
  REFER:    { fill: 'rgba(255, 75, 75, 0.25)',  stroke: '#FF4B4B' },
}

export default function NeuroChart({ domains, riskLevel = 'LOW' }: NeuroChartProps) {
  const data = (Object.keys(DOMAIN_LABELS) as (keyof NeuralRiskDomains)[]).map(
    (key) => ({
      domain: DOMAIN_LABELS[key],
      score: domains[key],
      fullMark: 100,
    })
  )

  const colors = RISK_COLORS[riskLevel]

  return (
    <ResponsiveContainer width="100%" height={320}>
      <RadarChart data={data} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
        <PolarGrid stroke="#e5e7eb" strokeWidth={1.5} />
        <PolarAngleAxis
          dataKey="domain"
          tick={{
            fontSize: 12,
            fontWeight: 700,
            fontFamily: 'Nunito, sans-serif',
            fill: '#374151',
          }}
        />
        <Radar
          name="Score"
          dataKey="score"
          stroke={colors.stroke}
          fill={colors.fill}
          strokeWidth={2.5}
          dot={{ fill: colors.stroke, strokeWidth: 0, r: 4 }}
        />
        <Tooltip
          contentStyle={{
            fontFamily: 'Nunito, sans-serif',
            fontWeight: 700,
            borderRadius: '12px',
            border: '2px solid #E5E5E5',
            boxShadow: 'none',
          }}
          formatter={(value: number) => [`${value}/100`, 'Score']}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}
