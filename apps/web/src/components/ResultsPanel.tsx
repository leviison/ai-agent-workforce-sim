import { useSimulationStore } from '../store/simulationStore'
import TraceTimeline from './TraceTimeline'
import CoachingInsightsPanel from './CoachingInsightsPanel'
import SimulationRunCard from './SimulationRunCard'
import ScoreBreakdownPanel from './ScoreBreakdownPanel'

function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
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

  const filename = `sim-result-${result.scenarioId}-seed${result.seed}.json`

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h2 style={{ margin: 0, fontSize: '1.125rem', color: '#111827' }}>Step 3 — Analyse Results</h2>
        <button
          onClick={() => downloadJson(result, filename)}
          style={{
            padding: '6px 14px',
            borderRadius: '6px',
            border: '1px solid #d1d5db',
            backgroundColor: '#ffffff',
            color: '#374151',
            fontWeight: 500,
            fontSize: '0.8rem',
            cursor: 'pointer',
          }}
        >
          Export JSON
        </button>
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
