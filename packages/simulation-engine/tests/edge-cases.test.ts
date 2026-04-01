import { describe, it, expect } from 'vitest'
import { runSimulation } from '../src/engine'
import { businessLaunch } from '../../scenario-data/src/index'
import type { Workflow, SimulationInput } from '@sim/shared-types'

function makeInput(workflow: Workflow): SimulationInput {
  return {
    workflow,
    agents: businessLaunch.agents,
    scenario: businessLaunch,
    seed: 42,
  }
}

describe('simulation-engine edge cases', () => {
  it('empty workflow (0 nodes, 0 edges) returns empty trace and zero scores', () => {
    const input = makeInput({ nodes: [], edges: [] })
    const result = runSimulation(input)

    expect(result.trace).toEqual([])
    expect(result.outputs).toEqual({})
    expect(result.metrics.quality).toBe(0)
    expect(result.metrics.cost_efficiency).toBe(0)
    expect(result.metrics.time_efficiency).toBe(0)
    expect(result.metrics.robustness).toBe(0)
    expect(result.insights).toEqual([])
  })

  it('missing agent_id throws descriptive error', () => {
    const input = makeInput({
      nodes: [{ id: 'n1', task_id: 'task-research', agent_id: 'agent-nonexistent' }],
      edges: [],
    })

    expect(() => runSimulation(input)).toThrow(
      "Agent 'agent-nonexistent' not found for node 'n1'"
    )
  })

  it('missing task_id throws descriptive error', () => {
    const input = makeInput({
      nodes: [{ id: 'n1', task_id: 'task-nonexistent', agent_id: 'agent-analyst' }],
      edges: [],
    })

    expect(() => runSimulation(input)).toThrow(
      "Task 'task-nonexistent' not found for node 'n1'"
    )
  })

  it('cyclic workflow throws', () => {
    const input = makeInput({
      nodes: [
        { id: 'a', task_id: 'task-research', agent_id: 'agent-analyst' },
        { id: 'b', task_id: 'task-validation', agent_id: 'agent-analyst' },
      ],
      edges: [
        { from: 'a', to: 'b' },
        { from: 'b', to: 'a' },
      ],
    })

    expect(() => runSimulation(input)).toThrow('cycle')
  })

  it('single-node workflow (1 task, no edges) runs successfully', () => {
    const input = makeInput({
      nodes: [{ id: 'n1', task_id: 'task-research', agent_id: 'agent-analyst' }],
      edges: [],
    })

    const result = runSimulation(input)
    expect(result.trace.length).toBeGreaterThanOrEqual(1)
    expect(result.trace[0].taskId).toBe('task-research')
    expect(result.trace[0].agentId).toBe('agent-analyst')
    expect(result.metrics.quality).toBeGreaterThanOrEqual(0)
    expect(result.metrics.quality).toBeLessThanOrEqual(1)
  })

  it('workflow with all tasks assigned to the same agent runs successfully', () => {
    const input = makeInput({
      nodes: [
        { id: 'n1', task_id: 'task-research', agent_id: 'agent-analyst' },
        { id: 'n2', task_id: 'task-validation', agent_id: 'agent-analyst' },
      ],
      edges: [{ from: 'n1', to: 'n2' }],
    })

    const result = runSimulation(input)
    expect(result.trace.length).toBeGreaterThanOrEqual(2)
    // All trace entries should reference the same agent
    for (const t of result.trace) {
      expect(t.agentId).toBe('agent-analyst')
    }
    expect(result.metrics.quality).toBeGreaterThanOrEqual(0)
  })
})
