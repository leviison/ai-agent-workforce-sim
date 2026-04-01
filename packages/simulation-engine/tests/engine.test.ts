import { describe, it, expect } from 'vitest'
import { runSimulation } from '../src/engine'
import { businessLaunch } from '../../scenario-data/src/index'
import type { Workflow } from '@sim/shared-types'

const workflow: Workflow = {
  nodes: [
    { id: 'n1', task_id: 'task-research',        agent_id: 'agent-analyst'    },
    { id: 'n2', task_id: 'task-problem-mapping',  agent_id: 'agent-strategist' },
    { id: 'n3', task_id: 'task-idea-generation',  agent_id: 'agent-creative'   },
    { id: 'n4', task_id: 'task-offer-design',     agent_id: 'agent-creative'   },
    { id: 'n5', task_id: 'task-launch-plan',      agent_id: 'agent-strategist' },
    { id: 'n6', task_id: 'task-validation',       agent_id: 'agent-analyst'    },
  ],
  edges: [
    { from: 'n1', to: 'n2' },
    { from: 'n2', to: 'n3' },
    { from: 'n3', to: 'n4' },
    { from: 'n4', to: 'n5' },
    { from: 'n5', to: 'n6' },
  ],
}

const input = {
  workflow,
  agents: businessLaunch.agents,
  scenario: businessLaunch,
  seed: 42,
}

describe('simulation engine', () => {
  it('is deterministic — same seed produces same output', () => {
    const result1 = runSimulation(input)
    const result2 = runSimulation(input)
    expect(result1.trace).toEqual(result2.trace)
    expect(result1.metrics).toEqual(result2.metrics)
  })

  it('different seeds produce different outputs', () => {
    const result1 = runSimulation({ ...input, seed: 1 })
    const result2 = runSimulation({ ...input, seed: 2 })
    expect(result1.trace).not.toEqual(result2.trace)
  })

  it('produces a trace entry for every workflow node (at least one per node, including retries)', () => {
    const result = runSimulation(input)
    // There must be at least one trace entry per workflow node; retries add more entries.
    expect(result.trace.length).toBeGreaterThanOrEqual(workflow.nodes.length)
    // Every workflow node must have a first-attempt trace (node_id = '<nodeId>-attempt-0')
    const firstAttemptIds = result.trace
      .filter(t => t.retryCount === 0)
      .map(t => t.node_id)
    const expectedFirstAttempts = workflow.nodes.map(n => `${n.id}-attempt-0`)
    expect(firstAttemptIds).toEqual(expectedFirstAttempts)
  })

  it('trace node_ids match workflow node ids (first-attempt entries)', () => {
    const result = runSimulation(input)
    // First-attempt traces use '<nodeId>-attempt-0'; retries use '<nodeId>-attempt-N'
    const firstAttemptNodeIds = result.trace
      .filter(t => t.retryCount === 0)
      .map(t => t.node_id)
    const expectedIds = workflow.nodes.map(n => `${n.id}-attempt-0`)
    expect(firstAttemptNodeIds).toEqual(expectedIds)
  })

  it('score fields are between 0 and 1', () => {
    const result = runSimulation(input)
    const { quality, cost_efficiency, time_efficiency, robustness } = result.metrics
    for (const val of [quality, cost_efficiency, time_efficiency, robustness]) {
      expect(val).toBeGreaterThanOrEqual(0)
      expect(val).toBeLessThanOrEqual(1)
    }
  })

  it('throws on cyclic workflow', () => {
    const cyclicWorkflow: Workflow = {
      nodes: [
        { id: 'a', task_id: 'task-research', agent_id: 'agent-analyst' },
        { id: 'b', task_id: 'task-validation', agent_id: 'agent-analyst' },
      ],
      edges: [
        { from: 'a', to: 'b' },
        { from: 'b', to: 'a' },
      ],
    }
    expect(() => runSimulation({ ...input, workflow: cyclicWorkflow })).toThrow('cycle')
  })
})
