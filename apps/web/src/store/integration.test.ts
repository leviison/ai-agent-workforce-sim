import { describe, it, expect, beforeEach } from 'vitest'
import {
  buildWorkflowFromAssignments,
  runSimulationFromInput,
} from '@sim/simulation-facade'
import type { SimulationResultViewModel } from '@sim/simulation-facade'
import { businessLaunch } from '@sim/scenario-data'
import { useSimulationStore } from './simulationStore'

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/** Full taskId → agentId map covering every task in businessLaunch */
const fullAssignments: Record<string, string> = {
  'task-research':        'agent-analyst',
  'task-problem-mapping': 'agent-strategist',
  'task-idea-generation': 'agent-creative',
  'task-offer-design':    'agent-creative',
  'task-launch-plan':     'agent-strategist',
  'task-validation':      'agent-analyst',
}

function buildInput(seed: number) {
  const workflow = buildWorkflowFromAssignments(fullAssignments, businessLaunch)
  return {
    workflow,
    agents: businessLaunch.agents,
    scenario: businessLaunch,
    seed,
  }
}

/** Reset store state before every test to prevent cross-test pollution. */
beforeEach(() => {
  useSimulationStore.getState().reset()
})

// ---------------------------------------------------------------------------
// 1. buildWorkflowFromAssignments — node / edge counts
// ---------------------------------------------------------------------------

describe('facade → buildWorkflowFromAssignments', () => {
  it('produces a workflow with 6 nodes and 5 edges for businessLaunch', () => {
    const workflow = buildWorkflowFromAssignments(fullAssignments, businessLaunch)

    expect(workflow.nodes).toHaveLength(6)
    expect(workflow.edges).toHaveLength(5)
  })
})

// ---------------------------------------------------------------------------
// 2. runSimulationFromInput — happy-path ViewModel shape
// ---------------------------------------------------------------------------

describe('facade → runSimulationFromInput', () => {
  it('returns a SimulationResultViewModel with scenarioId="business-launch" for full businessLaunch assignments', () => {
    const result: SimulationResultViewModel = runSimulationFromInput(buildInput(42))

    expect(result.scenarioId).toBe('business-launch')
    expect(result.scenarioName).toBe(businessLaunch.name)
    expect(result.seed).toBe(42)
    expect(Array.isArray(result.traces)).toBe(true)
    expect(result.traces.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// 3. Determinism — same seed via facade produces identical traces
// ---------------------------------------------------------------------------

describe('facade → determinism', () => {
  it('same seed run twice via the store produces identical result.traces', () => {
    const input = buildInput(77)
    const result1 = runSimulationFromInput(input)
    const result2 = runSimulationFromInput(input)

    expect(result1.traces).toEqual(result2.traces)
  })
})

// ---------------------------------------------------------------------------
// 4. Store — full run reaches runStatus='success'
// ---------------------------------------------------------------------------

describe('store → runSimulation with all tasks assigned', () => {
  it('reaches runStatus="success" when all tasks are assigned', async () => {
    const store = useSimulationStore.getState()

    for (const [taskId, agentId] of Object.entries(fullAssignments)) {
      store.assignAgent(taskId, agentId)
    }

    await useSimulationStore.getState().runSimulation()

    const state = useSimulationStore.getState()
    expect(state.runStatus).toBe('success')
    expect(state.result).not.toBeNull()
    expect(state.errorMessage).toBeNull()
    // Traces may include retries, so count >= number of tasks
    expect(state.result!.traces.length).toBeGreaterThanOrEqual(businessLaunch.tasks.length)
    expect(state.result!.score).toBeDefined()
    expect(state.result!.score.overallScore).toBeGreaterThanOrEqual(0)
  })
})

// ---------------------------------------------------------------------------
// 5. Store — reset after success returns result to null and runStatus to 'idle'
// ---------------------------------------------------------------------------

describe('store → reset', () => {
  it('returns result to null and runStatus to "idle" after a successful run', async () => {
    const store = useSimulationStore.getState()

    for (const [taskId, agentId] of Object.entries(fullAssignments)) {
      store.assignAgent(taskId, agentId)
    }

    await useSimulationStore.getState().runSimulation()

    // Confirm success before reset
    expect(useSimulationStore.getState().runStatus).toBe('success')
    expect(useSimulationStore.getState().result).not.toBeNull()

    // Reset and verify clean state
    useSimulationStore.getState().reset()

    const state = useSimulationStore.getState()
    expect(state.result).toBeNull()
    expect(state.runStatus).toBe('idle')
    expect(state.errorMessage).toBeNull()
    expect(state.agentAssignments).toEqual({})
    expect(state.seed).toBe(42)
  })
})
