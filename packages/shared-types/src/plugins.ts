import type { Scenario, Agent, CoachingRule, SimulationOutput, Score, ScoringConfig, Trace, Task, WorkflowNode } from './index'

export type ScenarioPlugin = {
  id: string
  name: string
  description: string
  scenario: Scenario
  coachingRules: CoachingRule[]
  scoringConfig?: Partial<ScoringConfig>
  requiredMechanics?: string[]
  outputPluginId?: string
}

export type AgentPlugin = {
  id: string
  agent: Agent
  scenarioScope: string[]
  tags: string[]
}

export type OutputFormat = 'json' | 'csv' | 'pdf'

export type OutputPlugin = {
  id: string
  name: string
  supportedFormats: OutputFormat[]
  formatOutput: (output: SimulationOutput, scenario: Scenario, format: OutputFormat) => string | Uint8Array
}

export type MechanicsContext = {
  tick: number
  trace: Trace[]
  agents: Map<string, Agent>
  tasks: Map<string, Task>
  scoringConfig: ScoringConfig
}

export type MechanicsPlugin = {
  id: string
  name: string
  description: string
  onBeforeSimulation?: (context: MechanicsContext) => void
  onAfterNode?: (node: WorkflowNode, context: MechanicsContext) => void
  onBeforeScoring?: (context: MechanicsContext) => void
}

export type PluginRegistryState = {
  scenarios: Map<string, ScenarioPlugin>
  agents: Map<string, AgentPlugin>
  outputs: Map<string, OutputPlugin>
  mechanics: Map<string, MechanicsPlugin>
}
