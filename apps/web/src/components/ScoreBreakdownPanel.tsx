import type { ScoreSummaryViewModel } from '../../../packages/ui-contracts/src/index'
import { pct } from '../utils/format'

type Props = {
  score: ScoreSummaryViewModel
}

type Dimension = {
  label: string
  value: number
}

function barColor(value: number): string {
  if (value >= 0.75) return '#16a34a'
  if (value >= 0.5) return '#d97706'
  return '#dc2626'
}

function DimensionRow({ label, value }: Dimension) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '4px',
          fontSize: '0.875rem',
          color: '#374151',
        }}
      >
        <span>{label}</span>
        <span style={{ fontWeight: 600 }}>{pct(value)}</span>
      </div>
      {/* Track */}
      <div
        style={{
          height: '8px',
          backgroundColor: '#e5e7eb',
          borderRadius: '4px',
          overflow: 'hidden',
        }}
      >
        {/* Fill */}
        <div
          style={{
            height: '100%',
            width: pct(value),
            backgroundColor: barColor(value),
            borderRadius: '4px',
            transition: 'width 0.3s ease',
          }}
        />
      </div>
    </div>
  )
}

export default function ScoreBreakdownPanel({ score }: Props) {
  const dimensions: Dimension[] = [
    { label: 'Quality', value: score.quality },
    { label: 'Cost Efficiency', value: score.costEfficiency },
    { label: 'Time Efficiency', value: score.timeEfficiency },
    { label: 'Robustness', value: score.robustness },
  ]

  return (
    <div
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '20px 24px',
        backgroundColor: '#ffffff',
        maxWidth: '480px',
      }}
    >
      <h2 style={{ margin: '0 0 16px', fontSize: '1.125rem', color: '#111827' }}>
        Score Breakdown
      </h2>

      {/* Bottleneck warning */}
      {score.hasBottleneck && (
        <div
          style={{
            backgroundColor: '#fffbeb',
            border: '1px solid #f59e0b',
            borderRadius: '6px',
            padding: '10px 14px',
            marginBottom: '16px',
            fontSize: '0.875rem',
            color: '#92400e',
            fontWeight: 500,
          }}
        >
          Bottleneck detected — workflow efficiency penalised
        </div>
      )}

      {/* Per-dimension bars */}
      {dimensions.map((dim) => (
        <DimensionRow key={dim.label} label={dim.label} value={dim.value} />
      ))}
    </div>
  )
}
