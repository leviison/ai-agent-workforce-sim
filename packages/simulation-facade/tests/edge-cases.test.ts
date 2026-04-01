import { describe, it, expect } from 'vitest'
import {
  runSimulationFromInput,
  getAvailableScenarios,
  buildWorkflowFromAssignments,
} from '../src/index'
import { businessLaunch } from '../../scenario-data/src/index'
import type { SimulationInput } from '@sim/shared-types'

const assignments: Record<string, string> = {
  'task-research':        'agent-analyst',
  'task-problem-mapping': 'agent-strategist',
  'task-idea-generation': 'agent-creative',
  'task-offer-design':    'agent-creative',
  'task-launch-plan':     'agent-strategist',
  'task-validation':      'agent-analyst',
}

function buildValidInput(seed: number): SimulationInput {
  const workflow = buildWorkflowFromAssignments(assignments, businessLaunch)
  return {
    workflow,
    agents: businessLaunch.agents,
    scenario: businessLaunch,
    seed,
  }
}

describe('simulation-facade edge cases', () => {
  it('empty workflow returns valid SimulationResultViewModel with empty traces', () => {
    const input: SimulationInput = {
      workflow: { nodes: [], edges: [] },
      agents: businessLaunch.agents,
      scenario: businessLaunch,
      seed: 42,
    }

    const result = runSimulationFromInput(input)

    expect(result.traces).toEqual([])
    expect(result.insights).toEqual([])
    expect(result.score.overallScore).toBe(0)
    expect(result.score.quality).toBe(0)
    expect(result.score.costEfficiency).toBe(0)
    expect(result.score.timeEfficiency).toBe(0)
    expect(result.score.robustness).toBe(0)
    expect(result.score.agentCount).toBe(0)
    expect(result.score.taskCount).toBe(0)
    expect(result.score.durationTicks).toBe(0)
    expect(result.scenarioId).toBe('business-launch')
  })

  it('unknown scenario ID still produces a result (no coaching rules, but no crash)', () => {
    const workflow = buildWorkflowFromAssignments(assignments, businessLaunch)
    const fakeScenario = {
      ...businessLaunch,
      id: 'scenario-that-does-not-exist-in-registry',
    }
    const input: SimulationInput = {
      workflow,
      agents: businessLaunch.agents,
      scenario: fakeScenario,
      seed: 42,
    }

    const result = runSimulationFromInput(input)

    expect(result).not.toBeNull()
    expect(result.scenarioId).toBe('scenario-that-does-not-exist-in-registry')
    expect(result.traces.length).toBeGreaterThan(0)
    expect(Array.isArray(result.insights)).toBe(true)
  })

  it('getAvailableScenarios with populated registry returns correct count', () => {
    const result = getAvailableScenarios()

    expect(result).toBeDefined()
    expect(Array.isArray(result.scenarios)).toBe(true)
    // Registry has at least the businessLaunch scenario
    expect(result.scenarios.length).toBeGreaterThanOrEqual(1)
    const bl = result.scenarios.find(s => s.id === 'business-launch')
    expect(bl).toBeDefined()
    expect(bl!.name).toBe('Launch a $1M Business')
    expect(bl!.taskCount).toBe(businessLaunch.tasks.length)
    expect(bl!.agentCount).toBe(businessLaunch.agents.length)
  })

  it('runSimulationFromInput with valid input returns non-null result (sanity check)', () => {
    const result = runSimulationFromInput(buildValidInput(42))

    expect(result).not.toBeNull()
    expect(result).not.toBeUndefined()
    expect(result.scenarioId).toBe('business-launch')
    expect(result.traces.length).toBeGreaterThan(0)
    expect(typeof result.score.overallScore).toBe('number')
    expect(result.score.overallScore).toBeGreaterThanOrEqual(0)
    expect(result.score.overallScore).toBeLessThanOrEqual(1)
  })
})
