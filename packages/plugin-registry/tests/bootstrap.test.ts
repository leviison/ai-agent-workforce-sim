import { describe, it, expect, beforeEach } from 'vitest'
import { registry, resetRegistry, registerAllPlugins } from '@sim/plugin-registry'

describe('registerAllPlugins (bootstrap)', () => {
  beforeEach(() => {
    resetRegistry()
  })

  it('registers the business-launch scenario', () => {
    registerAllPlugins()

    const plugin = registry.getScenario('business-launch')
    expect(plugin).toBeDefined()
    expect(plugin!.id).toBe('business-launch')
    expect(plugin!.name).toBe('Launch a $1M Business')
    expect(typeof plugin!.description).toBe('string')
  })

  it('business-launch scenario has 6 tasks and 3 agents', () => {
    registerAllPlugins()

    const plugin = registry.getScenario('business-launch')!
    expect(plugin.scenario.tasks).toHaveLength(6)
    expect(plugin.scenario.agents).toHaveLength(3)
  })

  it('business-launch plugin has 5 coaching rules', () => {
    registerAllPlugins()

    const plugin = registry.getScenario('business-launch')!
    expect(plugin.coachingRules).toHaveLength(5)
  })

  it('registerAllPlugins() yields 3 scenarios in getAllScenarios()', () => {
    registerAllPlugins()

    const all = registry.getAllScenarios()
    expect(all).toHaveLength(3)
  })

  it('research-pipeline has 5 tasks and 3 agents', () => {
    registerAllPlugins()

    const plugin = registry.getScenario('research-pipeline')
    expect(plugin).toBeDefined()
    expect(plugin!.scenario.tasks).toHaveLength(5)
    expect(plugin!.scenario.agents).toHaveLength(3)
  })

  it('incident-response has 5 tasks and 4 agents', () => {
    registerAllPlugins()

    const plugin = registry.getScenario('incident-response')
    expect(plugin).toBeDefined()
    expect(plugin!.scenario.tasks).toHaveLength(5)
    expect(plugin!.scenario.agents).toHaveLength(4)
  })

  it('getMechanicsForScenario("research-pipeline") returns the time-limit mechanic', () => {
    registerAllPlugins()

    const mechanics = registry.getMechanicsForScenario('research-pipeline')
    expect(mechanics).toHaveLength(1)
    expect(mechanics[0].id).toBe('time-limit')
  })

  it('getMechanicsForScenario("incident-response") returns the budget-constraint mechanic', () => {
    registerAllPlugins()

    const mechanics = registry.getMechanicsForScenario('incident-response')
    expect(mechanics).toHaveLength(1)
    expect(mechanics[0].id).toBe('budget-constraint')
  })

  it('validate() returns empty array when all required mechanics are registered', () => {
    registerAllPlugins()

    const errors = registry.validate()
    expect(errors).toEqual([])
  })
})
