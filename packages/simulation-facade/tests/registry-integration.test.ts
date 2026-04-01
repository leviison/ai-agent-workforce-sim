import { describe, it, expect } from 'vitest'
import {
  getAvailableScenarios,
  runSimulationFromInput,
  businessLaunch,
} from '@sim/simulation-facade'
import type { SimulationInput, WorkflowNode } from '@sim/shared-types'

function buildInput(seed = 42): SimulationInput {
  const scenario = businessLaunch
  const assignments: Record<string, string> = {
    'task-research': 'agent-analyst',
    'task-problem-mapping': 'agent-strategist',
    'task-idea-generation': 'agent-creative',
    'task-offer-design': 'agent-creative',
    'task-launch-plan': 'agent-strategist',
    'task-validation': 'agent-analyst',
  }

  const nodes: WorkflowNode[] = scenario.tasks.map(t => ({
    id: `node-${t.id}`,
    task_id: t.id,
    agent_id: assignments[t.id],
  }))

  const edges = scenario.tasks.flatMap(t =>
    t.dependencies.map(dep => ({
      from: `node-${dep}`,
      to: `node-${t.id}`,
    }))
  )

  return {
    workflow: { nodes, edges },
    agents: scenario.agents,
    scenario,
    seed,
  }
}

describe('Simulation Facade - Registry Integration', () => {
  it('getAvailableScenarios returns exactly 3 scenarios', () => {
    const result = getAvailableScenarios()
    expect(result.scenarios).toHaveLength(3)
  })

  it('each scenario has correct taskCount and agentCount', () => {
    const result = getAvailableScenarios()
    const byId = new Map(result.scenarios.map(s => [s.id, s]))

    const bl = byId.get('business-launch')!
    expect(bl).toBeDefined()
    expect(bl.taskCount).toBe(6)
    expect(bl.agentCount).toBe(3)

    const rp = byId.get('research-pipeline')!
    expect(rp).toBeDefined()
    expect(rp.taskCount).toBe(5)
    expect(rp.agentCount).toBe(3)

    const ir = byId.get('incident-response')!
    expect(ir).toBeDefined()
    expect(ir.taskCount).toBe(5)
    expect(ir.agentCount).toBe(4)
  })

  it('each scenario has correct shape', () => {
    const result = getAvailableScenarios()

    for (const s of result.scenarios) {
      expect(s).toHaveProperty('id')
      expect(s).toHaveProperty('name')
      expect(s).toHaveProperty('description')
      expect(s).toHaveProperty('taskCount')
      expect(s).toHaveProperty('agentCount')
      expect(typeof s.id).toBe('string')
      expect(typeof s.name).toBe('string')
      expect(typeof s.description).toBe('string')
      expect(typeof s.taskCount).toBe('number')
      expect(typeof s.agentCount).toBe('number')
    }
  })

  it('runSimulationFromInput with businessLaunch returns insights via registry lookup', () => {
    const input = buildInput(42)
    const result = runSimulationFromInput(input)

    expect(result).toBeDefined()
    expect(result.scenarioId).toBe('business-launch')
    expect(result.scenarioName).toBe('Launch a $1M Business')
    // insights should be populated from coaching rules
    expect(result.insights).toBeDefined()
    expect(Array.isArray(result.insights)).toBe(true)
  })

  it('the facade insights field is a string array (not null/undefined)', () => {
    const input = buildInput(123)
    const result = runSimulationFromInput(input)

    expect(result.insights).not.toBeNull()
    expect(result.insights).not.toBeUndefined()
    expect(Array.isArray(result.insights)).toBe(true)

    for (const insight of result.insights) {
      expect(typeof insight).toBe('string')
    }
  })
})
