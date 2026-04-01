import { getAvailableScenarios } from '@sim/simulation-facade'
import { useSimulationStore } from '../store/simulationStore'

const availableScenarios = getAvailableScenarios()

export default function ScenarioSelector() {
  const selectedScenarioId = useSimulationStore((s) => s.selectedScenarioId)
  const setScenario = useSimulationStore((s) => s.setScenario)

  const selected = availableScenarios.scenarios.find((s) => s.id === selectedScenarioId)

  return (
    <div
      style={{
        backgroundColor: '#eff6ff',
        border: '1px solid #bfdbfe',
        borderRadius: '8px',
        padding: '14px 18px',
        marginBottom: '24px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
        <label
          htmlFor="scenario-select"
          style={{ fontWeight: 600, fontSize: '0.9rem', color: '#111827' }}
        >
          Scenario
        </label>
        <select
          id="scenario-select"
          value={selectedScenarioId}
          onChange={(e) => setScenario(e.target.value)}
          style={{
            fontSize: '0.875rem',
            padding: '6px 10px',
            borderRadius: '6px',
            border: '1px solid #93c5fd',
            backgroundColor: '#ffffff',
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          {availableScenarios.scenarios.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {selected && (
        <div>
          <p style={{ margin: '0 0 6px', fontSize: '0.875rem', color: '#374151' }}>
            {selected.description}
          </p>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280' }}>
            {selected.taskCount} tasks / {selected.agentCount} agents
          </p>
        </div>
      )}
    </div>
  )
}
