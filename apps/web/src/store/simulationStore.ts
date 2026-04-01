import { create } from 'zustand'
import {
  runSimulationFromInput,
  buildWorkflowFromAssignments,
} from '@sim/simulation-facade'
import type { SimulationResultViewModel } from '@sim/simulation-facade'
import { businessLaunch } from '@sim/scenario-data'

// ---------------------------------------------------------------------------
// Store shape
// ---------------------------------------------------------------------------

interface SimulationStore {
  agentAssignments: Record<string, string> // taskId → agentId
  seed: number
  runStatus: 'idle' | 'running' | 'success' | 'error'
  errorMessage: string | null
  result: SimulationResultViewModel | null
  assignAgent: (taskId: string, agentId: string) => void
  setSeed: (seed: number) => void
  runSimulation: () => Promise<void>
  reset: () => void
}

// ---------------------------------------------------------------------------
// Initial state — extracted so reset() can reuse it
// ---------------------------------------------------------------------------

const initialState = {
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

  assignAgent: (taskId: string, agentId: string) => {
    set(state => ({
      agentAssignments: { ...state.agentAssignments, [taskId]: agentId },
    }))
  },

  setSeed: (seed: number) => {
    set({ seed })
  },

  runSimulation: async () => {
    const { agentAssignments, seed } = get()

    // 1. Validate — every task must have an assignment
    const allTaskIds = businessLaunch.tasks.map(t => t.id)
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
      const workflow = buildWorkflowFromAssignments(agentAssignments, businessLaunch)

      const input = {
        workflow,
        agents: businessLaunch.agents,
        scenario: businessLaunch,
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
