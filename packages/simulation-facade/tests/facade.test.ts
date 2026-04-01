import { describe, it, expect } from 'vitest'
import { runSimulationFromInput, buildWorkflowFromAssignments } from '../src/index'
import { businessLaunch } from '../../scenario-data/src/index'

// Canonical assignments: one agent per task using agents from the scenario
const assignments: Record<string, string> = {
  'task-research':        'agent-analyst',
  'task-problem-mapping': 'agent-strategist',
  'task-idea-generation': 'agent-creative',
  'task-offer-design':    'agent-creative',
  'task-launch-plan':     'agent-strategist',
  'task-validation':      'agent-analyst',
}

function buildInput(seed: number) {
  const workflow = buildWorkflowFromAssignments(assignments, businessLaunch)
  return {
    workflow,
    agents: businessLaunch.agents,
    scenario: businessLaunch,
    seed,
  }
}

describe('simulation-facade', () => {
  describe('runSimulationFromInput', () => {
    it('happy path: returns a SimulationResultViewModel with non-empty traces', () => {
      const result = runSimulationFromInput(buildInput(42))

      expect(result.scenarioId).toBe('business-launch')
      expect(result.scenarioName).toBe('Launch a $1M Business')
      expect(result.seed).toBe(42)
      expect(Array.isArray(result.traces)).toBe(true)
      expect(result.traces.length).toBeGreaterThan(0)
      expect(Array.isArray(result.insights)).toBe(true)

      // Each trace row has the expected shape
      const row = result.traces[0]
      expect(typeof row.nodeId).toBe('string')
      expect(typeof row.agentId).toBe('string')
      expect(typeof row.taskId).toBe('string')
      expect(typeof row.success).toBe('boolean')
      expect(typeof row.startTick).toBe('number')
      expect(typeof row.endTick).toBe('number')
      expect(typeof row.cost).toBe('number')
      expect(typeof row.quality).toBe('number')
      expect(typeof row.retryCount).toBe('number')
    })

    it('determinism: same seed produces identical SimulationResultViewModel', () => {
      const input = buildInput(99)
      const result1 = runSimulationFromInput(input)
      const result2 = runSimulationFromInput(input)
      expect(result1).toEqual(result2)
    })

    it('different seeds produce different trace outputs', () => {
      const result1 = runSimulationFromInput(buildInput(1))
      const result2 = runSimulationFromInput(buildInput(2))
      expect(result1.traces).not.toEqual(result2.traces)
    })

    it('insights is a valid string array (not null or undefined)', () => {
      const result = runSimulationFromInput(buildInput(42))
      expect(result.insights).not.toBeNull()
      expect(result.insights).not.toBeUndefined()
      expect(Array.isArray(result.insights)).toBe(true)
      for (const insight of result.insights) {
        expect(typeof insight).toBe('string')
      }
    })

    it('low-quality run (seed 999) insights is a valid string array', () => {
      const result = runSimulationFromInput(buildInput(999))
      expect(Array.isArray(result.insights)).toBe(true)
      for (const insight of result.insights) {
        expect(typeof insight).toBe('string')
      }
    })
  })

  describe('buildWorkflowFromAssignments', () => {
    it('builds correct node and edge counts for the linear businessLaunch chain (6 nodes, 5 edges)', () => {
      const workflow = buildWorkflowFromAssignments(assignments, businessLaunch)

      expect(workflow.nodes).toHaveLength(6)
      expect(workflow.edges).toHaveLength(5)
    })

    it('node ids are prefixed with "node-" and task_id matches', () => {
      const workflow = buildWorkflowFromAssignments(assignments, businessLaunch)

      for (const node of workflow.nodes) {
        expect(node.id).toBe(`node-${node.task_id}`)
        expect(assignments[node.task_id]).toBe(node.agent_id)
      }
    })

    it('edges connect the correct node ids for the linear dependency chain', () => {
      const workflow = buildWorkflowFromAssignments(assignments, businessLaunch)

      // Expected linear chain: research → problem-mapping → idea-generation → offer-design → launch-plan → validation
      const edgeSet = new Set(workflow.edges.map(e => `${e.from}->${e.to}`))
      expect(edgeSet).toContain('node-task-research->node-task-problem-mapping')
      expect(edgeSet).toContain('node-task-problem-mapping->node-task-idea-generation')
      expect(edgeSet).toContain('node-task-idea-generation->node-task-offer-design')
      expect(edgeSet).toContain('node-task-offer-design->node-task-launch-plan')
      expect(edgeSet).toContain('node-task-launch-plan->node-task-validation')
    })
  })
})
