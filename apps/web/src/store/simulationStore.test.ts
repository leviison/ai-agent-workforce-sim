import { describe, it, expect, beforeEach } from 'vitest'
import { useSimulationStore } from './simulationStore'
import { businessLaunch } from '@sim/scenario-data'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Full taskId→agentId map covering every task in businessLaunch */
const fullAssignments: Record<string, string> = {
  'task-research':        'agent-analyst',
  'task-problem-mapping': 'agent-strategist',
  'task-idea-generation': 'agent-creative',
  'task-offer-design':    'agent-creative',
  'task-launch-plan':     'agent-strategist',
  'task-validation':      'agent-analyst',
}

/** Reset store state before every test to prevent cross-test pollution. */
beforeEach(() => {
  useSimulationStore.getState().reset()
})

// ---------------------------------------------------------------------------
// 1. Initial state
// ---------------------------------------------------------------------------

describe('initial state', () => {
  it('starts idle with empty assignments, seed 42, and no result', () => {
    const state = useSimulationStore.getState()

    expect(state.runStatus).toBe('idle')
    expect(state.agentAssignments).toEqual({})
    expect(state.seed).toBe(42)
    expect(state.errorMessage).toBeNull()
    expect(state.result).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// 2. assignAgent
// ---------------------------------------------------------------------------

describe('assignAgent', () => {
  it('updates agentAssignments for the given taskId', () => {
    const { assignAgent } = useSimulationStore.getState()

    assignAgent('task-research', 'agent-analyst')
    assignAgent('task-offer-design', 'agent-creative')

    const { agentAssignments } = useSimulationStore.getState()
    expect(agentAssignments['task-research']).toBe('agent-analyst')
    expect(agentAssignments['task-offer-design']).toBe('agent-creative')
  })

  it('overwrites an existing assignment for the same taskId', () => {
    const { assignAgent } = useSimulationStore.getState()

    assignAgent('task-research', 'agent-analyst')
    assignAgent('task-research', 'agent-creative')

    expect(useSimulationStore.getState().agentAssignments['task-research']).toBe('agent-creative')
  })
})

// ---------------------------------------------------------------------------
// 3. setSeed
// ---------------------------------------------------------------------------

describe('setSeed', () => {
  it('updates the seed value', () => {
    useSimulationStore.getState().setSeed(99)
    expect(useSimulationStore.getState().seed).toBe(99)
  })

  it('stores seed 0 correctly (falsy boundary)', () => {
    useSimulationStore.getState().setSeed(0)
    expect(useSimulationStore.getState().seed).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// 4. runSimulation with incomplete assignments → error
// ---------------------------------------------------------------------------

describe('runSimulation — validation failure', () => {
  it('sets runStatus=error and the correct message when tasks are unassigned', async () => {
    // Assign only some tasks — leave the rest empty
    const { assignAgent, runSimulation } = useSimulationStore.getState()
    assignAgent('task-research', 'agent-analyst')
    // task-problem-mapping, task-idea-generation, etc. are intentionally missing

    await runSimulation()

    const state = useSimulationStore.getState()
    expect(state.runStatus).toBe('error')
    expect(state.errorMessage).toBe(
      'All tasks must have an assigned agent before running.',
    )
    expect(state.result).toBeNull()
  })

  it('sets runStatus=error when assignments is completely empty', async () => {
    await useSimulationStore.getState().runSimulation()

    const state = useSimulationStore.getState()
    expect(state.runStatus).toBe('error')
    expect(state.errorMessage).toBe(
      'All tasks must have an assigned agent before running.',
    )
  })
})

// ---------------------------------------------------------------------------
// 5. reset
// ---------------------------------------------------------------------------

describe('reset', () => {
  it('returns store to initial state after assignments and a run attempt', async () => {
    const store = useSimulationStore.getState()
    store.assignAgent('task-research', 'agent-analyst')
    store.setSeed(7)
    await store.runSimulation() // will error — that's fine, we just want dirty state

    store.reset()

    const state = useSimulationStore.getState()
    expect(state.agentAssignments).toEqual({})
    expect(state.seed).toBe(42)
    expect(state.runStatus).toBe('idle')
    expect(state.errorMessage).toBeNull()
    expect(state.result).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// 6. (bonus) Full run — all agents assigned → success with populated result
// ---------------------------------------------------------------------------

describe('runSimulation — full run', () => {
  it('sets runStatus=success and populates result when all tasks are assigned', async () => {
    const store = useSimulationStore.getState()

    // Assign every task
    for (const [taskId, agentId] of Object.entries(fullAssignments)) {
      store.assignAgent(taskId, agentId)
    }

    await useSimulationStore.getState().runSimulation()

    const state = useSimulationStore.getState()
    expect(state.runStatus).toBe('success')
    expect(state.result).not.toBeNull()
    expect(state.errorMessage).toBeNull()

    // Result should reflect the scenario metadata
    expect(state.result!.scenarioId).toBe(businessLaunch.id)
    expect(state.result!.scenarioName).toBe(businessLaunch.name)
    expect(state.result!.seed).toBe(42)

    // Traces include retries so count is >= number of tasks
    expect(state.result!.traces.length).toBeGreaterThanOrEqual(businessLaunch.tasks.length)
  })
})
