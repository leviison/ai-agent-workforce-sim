import WorkflowBuilder from './components/WorkflowBuilder'
import RunControls from './components/RunControls'
import ResultsPanel from './components/ResultsPanel'
import ScenarioSelector from './components/ScenarioSelector'

export default function App() {
  return (
    <div
      style={{
        fontFamily: 'system-ui, sans-serif',
        padding: '32px',
        backgroundColor: '#f9fafb',
        minHeight: '100vh',
        color: '#111827',
      }}
    >
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: '1.5rem' }}>
          AI Agent Workforce Simulator
        </h1>
        <p style={{ margin: '0 0 32px', color: '#6b7280', fontSize: '0.9rem' }}>
          Assign agents to tasks, configure your seed, then run the simulation.
        </p>

        <ScenarioSelector />

        {/* Workflow DAG builder */}
        <div style={{ marginBottom: '24px' }}>
          <WorkflowBuilder />
        </div>

        {/* Run controls */}
        <div style={{ marginBottom: '24px' }}>
          <RunControls />
        </div>

        {/* Results — only shown after a successful run */}
        <ResultsPanel />
      </div>
    </div>
  )
}
