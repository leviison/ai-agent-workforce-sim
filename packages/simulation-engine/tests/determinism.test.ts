import { describe, it, expect } from 'vitest'
import { runSimulation } from '../src/engine'
import { businessLaunch } from '../../scenario-data/src/index'
import type { Workflow, SimulationOutput } from '@sim/shared-types'

// Full 6-node linear workflow matching the businessLaunch scenario
const workflow: Workflow = {
  nodes: [
    { id: 'n1', task_id: 'task-research',       agent_id: 'agent-analyst'    },
    { id: 'n2', task_id: 'task-problem-mapping', agent_id: 'agent-strategist' },
    { id: 'n3', task_id: 'task-idea-generation', agent_id: 'agent-creative'   },
    { id: 'n4', task_id: 'task-offer-design',    agent_id: 'agent-creative'   },
    { id: 'n5', task_id: 'task-launch-plan',     agent_id: 'agent-strategist' },
    { id: 'n6', task_id: 'task-validation',      agent_id: 'agent-analyst'    },
  ],
  edges: [
    { from: 'n1', to: 'n2' },
    { from: 'n2', to: 'n3' },
    { from: 'n3', to: 'n4' },
    { from: 'n4', to: 'n5' },
    { from: 'n5', to: 'n6' },
  ],
}

function makeInput(seed: number) {
  return {
    workflow,
    agents: businessLaunch.agents,
    scenario: businessLaunch,
    seed,
  }
}

function deepEqual(a: SimulationOutput, b: SimulationOutput): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

describe('determinism — seed 42, 100 runs', () => {
  it('every run with seed 42 produces an identical SimulationOutput', () => {
    const reference = runSimulation(makeInput(42))

    for (let i = 1; i < 100; i++) {
      const result = runSimulation(makeInput(42))
      expect(deepEqual(result, reference)).toBe(true)
      // Also assert component by component for clearer failure messages
      expect(result.trace).toEqual(reference.trace)
      expect(result.metrics).toEqual(reference.metrics)
      expect(result.outputs).toEqual(reference.outputs)
      expect(result.insights).toEqual(reference.insights)
    }
  })
})

describe('determinism — additional seeds (10 runs each)', () => {
  const additionalSeeds = [1, 99, 12345]

  for (const seed of additionalSeeds) {
    it(`seed ${seed}: 10 consecutive runs are all deep-equal`, () => {
      const reference = runSimulation(makeInput(seed))

      for (let i = 1; i < 10; i++) {
        const result = runSimulation(makeInput(seed))
        expect(result.trace).toEqual(reference.trace)
        expect(result.metrics).toEqual(reference.metrics)
        expect(result.outputs).toEqual(reference.outputs)
        expect(result.insights).toEqual(reference.insights)
      }
    })
  }

  it('different seeds produce different trace outputs', () => {
    const results = additionalSeeds.map(s => runSimulation(makeInput(s)))
    // Each pair of results should differ (at least in trace)
    for (let i = 0; i < results.length; i++) {
      for (let j = i + 1; j < results.length; j++) {
        expect(results[i].trace).not.toEqual(results[j].trace)
      }
    }
  })
})
