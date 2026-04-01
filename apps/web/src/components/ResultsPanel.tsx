import { useSimulationStore } from '../store/simulationStore'
import type { SimulationResultViewModel } from '@sim/simulation-facade'
import TraceTimeline from './TraceTimeline'
import CoachingInsightsPanel from './CoachingInsightsPanel'
import SimulationRunCard from './SimulationRunCard'
import ScoreBreakdownPanel from './ScoreBreakdownPanel'

function exportResult(result: SimulationResultViewModel, format: 'json' | 'csv') {
  let content: string
  let mimeType: string
  let extension: string

  if (format === 'csv') {
    const lines: string[] = []
    lines.push(`# Scenario: ${result.scenarioName} (${result.scenarioId})`)
    lines.push(`# Seed: ${result.seed}`)
    lines.push(`# Score: quality=${result.score.quality}, costEfficiency=${result.score.costEfficiency}, timeEfficiency=${result.score.timeEfficiency}, robustness=${result.score.robustness}`)
    lines.push('')
    lines.push('nodeId,agentId,taskId,success,startTick,endTick,cost,quality,retryCount,failureReason')
    for (const t of result.traces) {
      const esc = (v: unknown) => { const s = String(v ?? ''); return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s }
      lines.push([esc(t.nodeId), esc(t.agentId), esc(t.taskId), t.success, t.startTick, t.endTick, t.cost, t.quality, t.retryCount, esc(t.failureReason ?? '')].join(','))
    }
    content = lines.join('\n')
    mimeType = 'text/csv'
    extension = 'csv'
  } else {
    content = JSON.stringify(result, null, 2)
    mimeType = 'application/json'
    extension = 'json'
  }

  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `sim-result-${result.scenarioId}-seed${result.seed}.${extension}`
  a.click()
  URL.revokeObjectURL(url)
}

export default function ResultsPanel() {
  const result = useSimulationStore((s) => s.result)
  const runStatus = useSimulationStore((s) => s.runStatus)
  const errorMessage = useSimulationStore((s) => s.errorMessage)

  const cardStyle: React.CSSProperties = {
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '20px 24px',
    backgroundColor: '#ffffff',
  }

  // Idle — prompt user
  if (runStatus === 'idle' && !result) {
    return (
      <div style={cardStyle}>
        <h2 style={{ margin: '0 0 8px', fontSize: '1.125rem', color: '#111827' }}>Step 3 — Analyse Results</h2>
        <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
          Run the simulation to see results here.
        </p>
      </div>
    )
  }

  // Running — loading indicator
  if (runStatus === 'running') {
    return (
      <div style={cardStyle}>
        <h2 style={{ margin: '0 0 8px', fontSize: '1.125rem', color: '#111827' }}>Step 3 — Analyse Results</h2>
        <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
          <span style={{ display: 'inline-block', animation: 'pulse 1.5s ease-in-out infinite' }}>
            Simulating...
          </span>
        </p>
        <style>{`@keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.4 } }`}</style>
      </div>
    )
  }

  // Error — show message in results area
  if (runStatus === 'error') {
    return (
      <div style={cardStyle}>
        <h2 style={{ margin: '0 0 8px', fontSize: '1.125rem', color: '#111827' }}>Step 3 — Analyse Results</h2>
        <p style={{ margin: 0, fontSize: '0.875rem', color: '#dc2626', fontWeight: 500 }}>
          {errorMessage ?? 'An unexpected error occurred.'}
        </p>
      </div>
    )
  }

  // No result yet (shouldn't normally happen, but guard)
  if (!result) return null

  const exportBtnStyle: React.CSSProperties = {
    padding: '6px 14px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    backgroundColor: '#ffffff',
    color: '#374151',
    fontWeight: 500,
    fontSize: '0.8rem',
    cursor: 'pointer',
  }

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h2 style={{ margin: 0, fontSize: '1.125rem', color: '#111827' }}>Step 3 — Analyse Results</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => exportResult(result, 'json')}
            style={exportBtnStyle}
          >
            Export JSON
          </button>
          <button
            onClick={() => exportResult(result, 'csv')}
            style={exportBtnStyle}
          >
            Export CSV
          </button>
        </div>
      </div>

      <p style={{ margin: '0 0 20px', fontSize: '0.875rem', color: '#6b7280' }}>
        Simulation complete — {result.traces.length} steps, seed {result.seed}
      </p>

      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '20px', alignItems: 'flex-start' }}>
        <SimulationRunCard score={result.score} />
        <ScoreBreakdownPanel score={result.score} />
      </div>

      <TraceTimeline traces={result.traces} />

      <div style={{ marginTop: '20px' }}>
        <CoachingInsightsPanel insights={result.insights} />
      </div>
    </div>
  )
}
