// simulation-facade — stable entry point for apps/web
// apps/web must import simulation results through this package only.
// No direct imports from @sim/simulation-engine are permitted in apps/web.

import { runSimulation } from '@sim/simulation-engine'
import { generateInsights } from '@sim/coaching-engine'
import { registry, registerAllPlugins } from '@sim/plugin-registry'
import type { SimulationInput, SimulationOutput, Scenario, Workflow, WorkflowNode, WorkflowEdge, OutputFormat } from '@sim/shared-types'
import type { SimulationResultViewModel, ScenarioSelectorViewModel } from '@sim/ui-contracts'
import { mapOutputToViewModel } from './mappers'

export type { SimulationInput, OutputFormat } from '@sim/shared-types'
export type { SimulationResultViewModel, TraceRowViewModel, ScoreSummaryViewModel } from '@sim/ui-contracts'
export { mapTraceToRow, mapScoreToSummary, mapOutputToViewModel } from './mappers'
export { businessLaunch, scenarios } from '@sim/scenario-data'
export type { CoachingRule } from '@sim/shared-types'

/**
 * Get coaching rules for a scenario by ID.
 */
export function getCoachingRules(scenarioId: string): import('@sim/shared-types').CoachingRule[] {
  return registry.getScenario(scenarioId)?.coachingRules ?? []
}

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
  if (!input.scenario) {
    throw new Error('SimulationInput.scenario is required')
  }

  if (input.workflow.nodes.length === 0) {
    return {
      scenarioId: input.scenario.id,
      scenarioName: input.scenario.name,
      seed: input.seed,
      traces: [],
      insights: [],
      score: {
        overallScore: 0,
        quality: 0,
        costEfficiency: 0,
        timeEfficiency: 0,
        robustness: 0,
        hasBottleneck: false,
        agentCount: 0,
        taskCount: 0,
        durationTicks: 0,
      },
    }
  }

  const mechanics = registry.getMechanicsForScenario(input.scenario.id)
  const output = runSimulation(input, mechanics)
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
  try {
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
  } catch {
    return { scenarios: [] }
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

/**
 * Export a simulation result in the requested format.
 * Looks up an output plugin by format, falls back to JSON.stringify for json.
 */
export function exportSimulationResult(
  output: SimulationOutput,
  scenario: Scenario,
  format: OutputFormat,
): string | Uint8Array {
  const FORMAT_PLUGIN_MAP: Record<string, string> = {
    json: 'default-json-output',
    csv: 'csv-output',
  }

  const pluginId = FORMAT_PLUGIN_MAP[format]
  const plugin = pluginId ? registry.getOutputPlugin(pluginId) : undefined

  if (!plugin) {
    // Fallback for JSON
    if (format === 'json') return JSON.stringify(output, null, 2)
    throw new Error(`No output plugin found for format: ${format}`)
  }

  return plugin.formatOutput(output, scenario, format)
}
