import type { ScoreSummaryViewModel } from '../../../packages/ui-contracts/src/index'
import { pct } from '../utils/format'

type Props = {
  score: ScoreSummaryViewModel
}

function scoreBadgeStyle(overallScore: number): React.CSSProperties {
  let backgroundColor: string
  let color: string

  if (overallScore >= 0.75) {
    backgroundColor = '#16a34a'
    color = '#ffffff'
  } else if (overallScore >= 0.5) {
    backgroundColor = '#d97706'
    color = '#ffffff'
  } else {
    backgroundColor = '#dc2626'
    color = '#ffffff'
  }

  return {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '999px',
    fontWeight: 700,
    fontSize: '1.25rem',
    backgroundColor,
    color,
  }
}

const gridItemStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
}

const labelStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: '#6b7280',
}

const valueStyle: React.CSSProperties = {
  fontSize: '1rem',
  fontWeight: 600,
  color: '#111827',
}

export default function SimulationRunCard({ score }: Props) {
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
      <h2 style={{ margin: '0 0 12px', fontSize: '1.125rem', color: '#111827' }}>
        Simulation Run Summary
      </h2>

      {/* Overall score badge */}
      <div style={{ marginBottom: '20px' }}>
        <span style={scoreBadgeStyle(score.overallScore)}>
          {pct(score.overallScore)}
        </span>
        <span style={{ marginLeft: '10px', color: '#6b7280', fontSize: '0.875rem' }}>
          overall score
        </span>
      </div>

      {/* 2-column grid of dimension scores */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px 24px',
          marginBottom: '20px',
        }}
      >
        <div style={gridItemStyle}>
          <span style={labelStyle}>Quality</span>
          <span style={valueStyle}>{pct(score.quality)}</span>
        </div>
        <div style={gridItemStyle}>
          <span style={labelStyle}>Cost Efficiency</span>
          <span style={valueStyle}>{pct(score.costEfficiency)}</span>
        </div>
        <div style={gridItemStyle}>
          <span style={labelStyle}>Time Efficiency</span>
          <span style={valueStyle}>{pct(score.timeEfficiency)}</span>
        </div>
        <div style={gridItemStyle}>
          <span style={labelStyle}>Robustness</span>
          <span style={valueStyle}>{pct(score.robustness)}</span>
        </div>
      </div>

      {/* Run stats */}
      <div
        style={{
          borderTop: '1px solid #e5e7eb',
          paddingTop: '12px',
          display: 'flex',
          gap: '24px',
          fontSize: '0.875rem',
          color: '#374151',
        }}
      >
        <span>
          <strong>{score.agentCount}</strong> agents
        </span>
        <span>
          <strong>{score.taskCount}</strong> tasks
        </span>
        <span>
          <strong>{score.durationTicks}</strong> ticks
        </span>
      </div>
    </div>
  )
}
