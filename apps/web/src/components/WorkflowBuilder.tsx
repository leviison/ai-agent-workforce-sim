import { useMemo, useCallback, memo } from 'react'
import ReactFlow, { Node, Edge, Handle, Position, NodeProps } from 'reactflow'
import 'reactflow/dist/style.css'
import { useSimulationStore } from '../store/simulationStore'
import { scenarios } from '../../../../packages/simulation-facade/src/index'

// Custom node data shape
type TaskNodeData = {
  taskId: string
  taskType: string
  agentId: string
  agents: { id: string; role: string }[]
  onAssign: (taskId: string, agentId: string) => void
}

// Custom node component — must be defined outside the parent or memoized
const TaskNode = memo(({ data }: NodeProps<TaskNodeData>) => {
  return (
    <div
      style={{
        border: data.agentId ? '1px solid #d1d5db' : '2px solid #dc2626',
        borderRadius: '8px',
        padding: '10px 14px',
        backgroundColor: '#ffffff',
        width: 220,
      }}
    >
      <Handle type="target" position={Position.Top} style={{ visibility: 'hidden' }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#111827' }}>
          {data.taskType}
        </span>
        <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{data.taskId}</span>
        <select
          value={data.agentId}
          onChange={(e) => data.onAssign(data.taskId, e.target.value)}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          style={{
            fontSize: '0.8rem',
            padding: '3px 6px',
            borderRadius: '4px',
            border: '1px solid #d1d5db',
            backgroundColor: '#ffffff',
            cursor: 'pointer',
          }}
        >
          <option value="">— assign agent —</option>
          {data.agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.role} ({agent.id})
            </option>
          ))}
        </select>
      </div>

      <Handle type="source" position={Position.Bottom} style={{ visibility: 'hidden' }} />
    </div>
  )
})
TaskNode.displayName = 'TaskNode'

const nodeTypes = { taskNode: TaskNode }

export default function WorkflowBuilder() {
  const agentAssignments = useSimulationStore((s) => s.agentAssignments)
  const assignAgent = useSimulationStore((s) => s.assignAgent)
  const selectedScenarioId = useSimulationStore((s) => s.selectedScenarioId)

  const scenario = scenarios.find((s) => s.id === selectedScenarioId) ?? scenarios[0]

  const onAssign = useCallback(
    (taskId: string, agentId: string) => assignAgent(taskId, agentId),
    [assignAgent],
  )

  const agents = useMemo(
    () => scenario.agents.map((a) => ({ id: a.id, role: a.role })),
    [scenario],
  )

  const nodes: Node<TaskNodeData>[] = useMemo(
    () =>
      scenario.tasks.map((task, index) => ({
        id: task.id,
        type: 'taskNode',
        position: { x: 100, y: index * 150 },
        data: {
          taskId: task.id,
          taskType: task.type,
          agentId: agentAssignments[task.id] ?? '',
          agents,
          onAssign,
        },
      })),
    [scenario, agentAssignments, agents, onAssign],
  )

  const edges: Edge[] = useMemo(() => {
    const result: Edge[] = []
    scenario.tasks.forEach((task) => {
      task.dependencies.forEach((depId) => {
        result.push({
          id: `${depId}->${task.id}`,
          source: depId,
          target: task.id,
          type: 'smoothstep',
          style: { stroke: '#6b7280' },
        })
      })
    })
    return result
  }, [scenario])

  return (
    <div>
      <h2 style={{ margin: '0 0 12px', fontSize: '1rem', fontWeight: 600, color: '#111827' }}>
        Step 1 — Build Your Workflow
      </h2>
      <div
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          backgroundColor: '#f9fafb',
          height: `${Math.max(400, scenario.tasks.length * 150 + 100)}px`,
          overflow: 'hidden',
        }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          panOnDrag={false}
          zoomOnScroll={false}
          zoomOnPinch={false}
          zoomOnDoubleClick={false}
          preventScrolling={false}
        />
      </div>
    </div>
  )
}
