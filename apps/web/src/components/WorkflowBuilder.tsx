import ReactFlow, { Node, Edge } from 'reactflow'
import 'reactflow/dist/style.css'
import { useSimulationStore } from '../store/simulationStore'
import { businessLaunch } from '../../../packages/simulation-facade/src/index'

// Manual top-to-bottom layout positions keyed by task id
const POSITIONS: Record<string, { x: number; y: number }> = {
  'task-research':        { x: 0, y: 0 },
  'task-problem-mapping': { x: 0, y: 150 },
  'task-idea-generation': { x: 0, y: 300 },
  'task-offer-design':    { x: 0, y: 450 },
  'task-launch-plan':     { x: 0, y: 600 },
  'task-validation':      { x: 0, y: 750 },
}

export default function WorkflowBuilder() {
  const agentAssignments = useSimulationStore((s) => s.agentAssignments)
  const assignAgent = useSimulationStore((s) => s.assignAgent)

  const nodes: Node[] = businessLaunch.tasks.map((task) => {
    const assigned = agentAssignments[task.id]
    return {
      id: task.id,
      position: POSITIONS[task.id] ?? { x: 0, y: 0 },
      data: {
        label: (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '180px' }}>
            <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#111827' }}>
              {task.type}
            </span>
            <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{task.id}</span>
            <select
              value={assigned ?? ''}
              onChange={(e) => assignAgent(task.id, e.target.value)}
              style={{
                fontSize: '0.8rem',
                padding: '3px 6px',
                borderRadius: '4px',
                border: '1px solid #d1d5db',
                backgroundColor: '#ffffff',
                cursor: 'pointer',
              }}
              // Prevent React Flow from treating click on select as node drag
              onMouseDown={(e) => e.stopPropagation()}
            >
              <option value="">— assign agent —</option>
              {businessLaunch.agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.role} ({agent.id})
                </option>
              ))}
            </select>
          </div>
        ),
      },
      style: {
        border: assigned ? '1px solid #d1d5db' : '2px solid #dc2626',
        borderRadius: '8px',
        padding: '10px 14px',
        backgroundColor: '#ffffff',
        width: 220,
      },
    }
  })

  const edges: Edge[] = []
  businessLaunch.tasks.forEach((task) => {
    task.dependencies.forEach((depId) => {
      edges.push({
        id: `${depId}->${task.id}`,
        source: depId,
        target: task.id,
        type: 'smoothstep',
        style: { stroke: '#6b7280' },
      })
    })
  })

  return (
    <div>
      <h2 style={{ margin: '0 0 12px', fontSize: '1rem', fontWeight: 600, color: '#111827' }}>Step 1 — Build Your Workflow</h2>
      <div
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          backgroundColor: '#f9fafb',
          height: '900px',
          overflow: 'hidden',
        }}
      >
        <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        />
      </div>
    </div>
  )
}
