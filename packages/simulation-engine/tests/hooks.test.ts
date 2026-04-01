import { describe, it, expect, vi } from 'vitest'
import { runSimulation } from '@sim/simulation-engine'
import { businessLaunch } from '@sim/scenario-data'
import type { SimulationInput, MechanicsPlugin, MechanicsContext, WorkflowNode } from '@sim/shared-types'

function buildBusinessLaunchInput(seed = 42): SimulationInput {
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

describe('Engine hooks (MechanicsPlugin)', () => {
  it('runSimulation without mechanics param produces a valid result (backward compat)', () => {
    const input = buildBusinessLaunchInput(42)
    const result = runSimulation(input)

    expect(result.trace.length).toBeGreaterThan(0)
    expect(result.metrics).toBeDefined()
    expect(result.metrics.quality).toBeGreaterThanOrEqual(0)
  })

  it('runSimulation with empty mechanics array produces same result as without', () => {
    const input1 = buildBusinessLaunchInput(42)
    const input2 = buildBusinessLaunchInput(42)

    const result1 = runSimulation(input1)
    const result2 = runSimulation(input2, [])

    expect(result1.metrics).toEqual(result2.metrics)
    expect(result1.trace.length).toBe(result2.trace.length)
    for (let i = 0; i < result1.trace.length; i++) {
      expect(result1.trace[i].node_id).toBe(result2.trace[i].node_id)
      expect(result1.trace[i].success).toBe(result2.trace[i].success)
      expect(result1.trace[i].quality).toBe(result2.trace[i].quality)
    }
  })

  it('fires onBeforeSimulation once, onAfterNode per sorted node, onBeforeScoring once', () => {
    const onBeforeSimulation = vi.fn()
    const onAfterNode = vi.fn()
    const onBeforeScoring = vi.fn()

    const mechanic: MechanicsPlugin = {
      id: 'spy-mechanic',
      name: 'Spy Mechanic',
      description: 'Tracks hook invocations',
      onBeforeSimulation,
      onAfterNode,
      onBeforeScoring,
    }

    const input = buildBusinessLaunchInput(99)
    runSimulation(input, [mechanic])

    expect(onBeforeSimulation).toHaveBeenCalledTimes(1)
    // businessLaunch has 6 tasks => 6 workflow nodes => onAfterNode fires 6 times
    expect(onAfterNode).toHaveBeenCalledTimes(6)
    expect(onBeforeScoring).toHaveBeenCalledTimes(1)
  })

  it('a mechanic that modifies scoringConfig.weights in onBeforeScoring changes the final Score', () => {
    const input1 = buildBusinessLaunchInput(77)
    const baseResult = runSimulation(input1)

    const weightModifier: MechanicsPlugin = {
      id: 'weight-modifier',
      name: 'Weight Modifier',
      description: 'Sets quality weight to 1 and all others to 0',
      onBeforeScoring(context: MechanicsContext) {
        context.scoringConfig.weights = {
          quality: 1,
          cost_efficiency: 0,
          time_efficiency: 0,
          robustness: 0,
        }
      },
    }

    const input2 = buildBusinessLaunchInput(77)
    const modifiedResult = runSimulation(input2, [weightModifier])

    // The metrics should differ because weights changed
    // With quality=1 and others=0, the overall composition will be different
    // unless by extreme coincidence all dimensions are equal
    const base = baseResult.metrics
    const modified = modifiedResult.metrics

    // At minimum the two score objects should not be identical
    // (quality-only weighting vs equal weighting)
    const baseEqual =
      base.quality === base.cost_efficiency &&
      base.cost_efficiency === base.time_efficiency &&
      base.time_efficiency === base.robustness

    if (!baseEqual) {
      // If dimensions differ, the weighted scores must differ
      expect(modified).not.toEqual(base)
    }
    // Regardless, the modified result should still be a valid Score
    expect(typeof modified.quality).toBe('number')
    expect(typeof modified.cost_efficiency).toBe('number')
    expect(typeof modified.time_efficiency).toBe('number')
    expect(typeof modified.robustness).toBe('number')
  })
})
