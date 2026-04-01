import { useSimulationStore } from '../store/simulationStore'
import { businessLaunch } from '../../../packages/simulation-facade/src/index'

export default function RunControls() {
  const seed = useSimulationStore((s) => s.seed)
  const runStatus = useSimulationStore((s) => s.runStatus)
  const errorMessage = useSimulationStore((s) => s.errorMessage)
  const agentAssignments = useSimulationStore((s) => s.agentAssignments)
  const setSeed = useSimulationStore((s) => s.setSeed)
  const runSimulation = useSimulationStore((s) => s.runSimulation)
  const reset = useSimulationStore((s) => s.reset)

  const allTasksAssigned = businessLaunch.tasks.every(
    (task) => !!agentAssignments[task.id],
  )
  const runDisabled = runStatus === 'running' || !allTasksAssigned

  return (
    <div
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '20px 24px',
        backgroundColor: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      <h2 style={{ margin: 0, fontSize: '1.125rem', color: '#111827' }}>Step 2 — Run the Simulation</h2>

      {/* Seed input */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <label
          htmlFor="seed-input"
          style={{ fontSize: '0.875rem', color: '#374151', fontWeight: 500 }}
        >
          Seed
        </label>
        <input
          id="seed-input"
          type="number"
          value={seed}
          onChange={(e) => setSeed(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
          min="0"
          step="1"
          style={{
            padding: '6px 10px',
            borderRadius: '6px',
            border: '1px solid #d1d5db',
            fontSize: '0.875rem',
            width: '120px',
          }}
        />
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <button
          onClick={() => runSimulation()}
          disabled={runDisabled}
          style={{
            padding: '8px 20px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: runDisabled ? '#d1d5db' : '#2563eb',
            color: runDisabled ? '#9ca3af' : '#ffffff',
            fontWeight: 600,
            fontSize: '0.875rem',
            cursor: runDisabled ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.15s ease',
          }}
        >
          {runStatus === 'running' ? 'Simulating...' : 'Run Simulation'}
        </button>

        <button
          onClick={() => reset()}
          style={{
            padding: '8px 20px',
            borderRadius: '6px',
            border: '1px solid #d1d5db',
            backgroundColor: '#ffffff',
            color: '#374151',
            fontWeight: 500,
            fontSize: '0.875rem',
            cursor: 'pointer',
          }}
        >
          Reset
        </button>
      </div>

      {/* Error message */}
      {runStatus === 'error' && errorMessage && (
        <p style={{ margin: 0, fontSize: '0.875rem', color: '#dc2626', fontWeight: 500 }}>
          {errorMessage}
        </p>
      )}
    </div>
  )
}
