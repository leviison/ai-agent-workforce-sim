import type {
  ScenarioPlugin,
  AgentPlugin,
  OutputPlugin,
  MechanicsPlugin,
} from '@sim/shared-types'

export class PluginRegistry {
  private scenarios = new Map<string, ScenarioPlugin>()
  private agents = new Map<string, AgentPlugin>()
  private outputs = new Map<string, OutputPlugin>()
  private mechanics = new Map<string, MechanicsPlugin>()

  registerScenario(plugin: ScenarioPlugin): void {
    if (this.scenarios.has(plugin.id)) {
      throw new Error(`Duplicate scenario plugin ID: ${plugin.id}`)
    }
    this.scenarios.set(plugin.id, plugin)
  }

  registerAgent(plugin: AgentPlugin): void {
    if (this.agents.has(plugin.id)) {
      throw new Error(`Duplicate agent plugin ID: ${plugin.id}`)
    }
    this.agents.set(plugin.id, plugin)
  }

  registerOutput(plugin: OutputPlugin): void {
    if (this.outputs.has(plugin.id)) {
      throw new Error(`Duplicate output plugin ID: ${plugin.id}`)
    }
    this.outputs.set(plugin.id, plugin)
  }

  registerMechanics(plugin: MechanicsPlugin): void {
    if (this.mechanics.has(plugin.id)) {
      throw new Error(`Duplicate mechanics plugin ID: ${plugin.id}`)
    }
    this.mechanics.set(plugin.id, plugin)
  }

  getScenario(id: string): ScenarioPlugin | undefined {
    return this.scenarios.get(id)
  }

  getAllScenarios(): ScenarioPlugin[] {
    return Array.from(this.scenarios.values())
  }

  getMechanicsForScenario(scenarioId: string): MechanicsPlugin[] {
    const scenario = this.scenarios.get(scenarioId)
    if (!scenario || !scenario.requiredMechanics) {
      return []
    }
    return scenario.requiredMechanics
      .map((id) => this.mechanics.get(id))
      .filter((m): m is MechanicsPlugin => m !== undefined)
  }

  getOutputPlugin(id: string): OutputPlugin | undefined {
    return this.outputs.get(id)
  }

  validate(): string[] {
    const errors: string[] = []
    for (const [, scenario] of this.scenarios) {
      if (scenario.requiredMechanics) {
        for (const mechanicsId of scenario.requiredMechanics) {
          if (!this.mechanics.has(mechanicsId)) {
            errors.push(
              `Scenario "${scenario.id}" requires mechanics "${mechanicsId}" which is not registered`
            )
          }
        }
      }
    }
    return errors
  }

  reset(): void {
    this.scenarios.clear()
    this.agents.clear()
    this.outputs.clear()
    this.mechanics.clear()
  }
}

export const registry = new PluginRegistry()

export function resetRegistry(): void {
  registry.reset()
}

export { registerAllPlugins } from './bootstrap'
