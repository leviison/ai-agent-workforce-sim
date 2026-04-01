// simulation-facade — stable entry point for apps/web
// apps/web must import simulation results through this package only.
// No direct imports from @sim/simulation-engine are permitted in apps/web.

import { runSimulation } from '@sim/simulation-engine'
import { generateInsights } from '@sim/coaching-engine'
import { registry, registerAllPlugins } from '@sim/plugin-registry'
import type { SimulationInput, Scenario, Workflow, WorkflowNode, WorkflowEdge } from '@sim/shared-types'
import type { SimulationResultViewModel, ScenarioSelectorViewModel } from '@sim/ui-contracts'
import { mapOutputToViewModel } from './mappers'

export type { SimulationInput } from '@sim/shared-types'
export type { SimulationResultViewModel, TraceRowViewModel, ScoreSummaryViewModel } from '@sim/ui-contracts'
export { mapTraceToRow, mapScoreToSummary, mapOutputToViewModel } from './mappers'
export { businessLaunch, scenarios } from '@sim/scenario-data'

// Register all plugins once at module load
let _pluginsRegistered = false
if (!_pluginsRegistered) {
  registerAllPlugins()
  _pluginsRegistered = true
}

/**
 * Run a simulation and return a UI-ready view model.
 */
export function runSimulationFromInput(input: SimulationInput): SimulationResultViewModel {
  const output = runSimulation(input)
  try {
    const scenarioPlugin = registry.getScenario(input.scenario.id)
    const rules = scenarioPlugin?.coachingRules ?? []
    output.insights = generateInsights(output, rules)
  } catch (e) {
    console.error('Coaching engine error (non-fatal):', e)
    output.insights = []
  }
  return mapOutputToViewModel(output, input.scenario, input.seed)
}

/**
 * Return all registered scenarios as a UI-ready view model.
 */
export function getAvailableScenarios(): ScenarioSelectorViewModel {
  const all = registry.getAllScenarios()
  return {
    scenarios: all.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      taskCount: p.scenario.tasks.length,
      agentCount: p.scenario.agents.length,
    }))
  }
}

/**
 * Build a Workflow from a task→agent assignment map and a scenario.
 * node id = `node-${task.id}`, edges derived from task.dependencies.
 */
export function buildWorkflowFromAssignments(
  assignments: Record<string, string>, // taskId → agentId
  scenario: Scenario,
): Workflow {
  const nodes: WorkflowNode[] = scenario.tasks.map(task => ({
    id: `node-${task.id}`,
    task_id: task.id,
    agent_id: assignments[task.id],
  }))

  const edges: WorkflowEdge[] = scenario.tasks.flatMap(task =>
    task.dependencies.map(depId => ({
      from: `node-${depId}`,
      to: `node-${task.id}`,
    }))
  )

  return { nodes, edges }
}
