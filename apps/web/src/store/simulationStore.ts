import { create } from 'zustand'
import {
  runSimulationFromInput,
  buildWorkflowFromAssignments,
  scenarios,
} from '@sim/simulation-facade'
import type { SimulationResultViewModel } from '@sim/simulation-facade'

// ---------------------------------------------------------------------------
// Store shape
// ---------------------------------------------------------------------------

interface SimulationStore {
  selectedScenarioId: string
  agentAssignments: Record<string, string> // taskId → agentId
  seed: number
  runStatus: 'idle' | 'running' | 'success' | 'error'
  errorMessage: string | null
  result: SimulationResultViewModel | null
  setScenario: (scenarioId: string) => void
  assignAgent: (taskId: string, agentId: string) => void
  setSeed: (seed: number) => void
  runSimulation: () => Promise<void>
  reset: () => void
}

// ---------------------------------------------------------------------------
// Initial state — extracted so reset() can reuse it
// ---------------------------------------------------------------------------

const initialState = {
  selectedScenarioId: 'business-launch',
  agentAssignments: {} as Record<string, string>,
  seed: 42,
  runStatus: 'idle' as const,
  errorMessage: null,
  result: null,
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  ...initialState,

  setScenario: (scenarioId: string) => {
    set({
      selectedScenarioId: scenarioId,
      agentAssignments: {},
      result: null,
      runStatus: 'idle',
      errorMessage: null,
    })
  },

  assignAgent: (taskId: string, agentId: string) => {
    set(state => ({
      agentAssignments: { ...state.agentAssignments, [taskId]: agentId },
    }))
  },

  setSeed: (seed: number) => {
    set({ seed })
  },

  runSimulation: async () => {
    const { agentAssignments, seed, selectedScenarioId } = get()

    // Look up the selected scenario
    const scenario = scenarios.find(s => s.id === selectedScenarioId)
    if (!scenario) {
      set({
        runStatus: 'error',
        errorMessage: `Unknown scenario: ${selectedScenarioId}`,
      })
      return
    }

    // 1. Validate — every task must have an assignment
    const allTaskIds = scenario.tasks.map(t => t.id)
    const missing = allTaskIds.some(id => !agentAssignments[id])

    if (missing) {
      set({
        runStatus: 'error',
        errorMessage: 'All tasks must have an assigned agent before running.',
      })
      return
    }

    // 2. Mark as running, clear previous result / error
    set({ runStatus: 'running', errorMessage: null, result: null })

    // 3 & 4. Build workflow and simulation input
    try {
      const workflow = buildWorkflowFromAssignments(agentAssignments, scenario)

      const input = {
        workflow,
        agents: scenario.agents,
        scenario,
        seed,
      }

      // 5. Run the simulation (synchronous engine, async wrapper for interface compliance)
      const result = runSimulationFromInput(input)

      // 6. Success
      set({ result, runStatus: 'success' })
    } catch (err: unknown) {
      // 7. Error
      const message = err instanceof Error ? err.message : String(err)
      set({ errorMessage: message, runStatus: 'error' })
    }
  },

  reset: () => {
    set({ ...initialState })
  },
}))
