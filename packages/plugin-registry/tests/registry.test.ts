import { describe, it, expect, beforeEach } from 'vitest'
import { registry, resetRegistry } from '@sim/plugin-registry'
import type { ScenarioPlugin, MechanicsPlugin } from '@sim/shared-types'

function makeScenarioPlugin(overrides: Partial<ScenarioPlugin> = {}): ScenarioPlugin {
  return {
    id: overrides.id ?? 'test-scenario',
    name: overrides.name ?? 'Test Scenario',
    description: overrides.description ?? 'A test scenario',
    scenario: overrides.scenario ?? {
      id: overrides.id ?? 'test-scenario',
      name: 'Test Scenario',
      description: 'A test scenario',
      tasks: [],
      agents: [],
    },
    coachingRules: overrides.coachingRules ?? [],
    requiredMechanics: overrides.requiredMechanics,
  }
}

function makeMechanicsPlugin(id: string): MechanicsPlugin {
  return {
    id,
    name: `Mechanics ${id}`,
    description: `Test mechanics plugin ${id}`,
  }
}

describe('PluginRegistry', () => {
  beforeEach(() => {
    resetRegistry()
  })

  describe('registerScenario / getScenario', () => {
    it('stores a plugin and getScenario retrieves it', () => {
      const plugin = makeScenarioPlugin({ id: 'alpha' })
      registry.registerScenario(plugin)

      const retrieved = registry.getScenario('alpha')
      expect(retrieved).toBeDefined()
      expect(retrieved!.id).toBe('alpha')
      expect(retrieved).toBe(plugin)
    })

    it('throws when registering a duplicate scenario ID', () => {
      const plugin = makeScenarioPlugin({ id: 'dup' })
      registry.registerScenario(plugin)

      expect(() => registry.registerScenario(plugin)).toThrow(
        'Duplicate scenario plugin ID: dup'
      )
    })
  })

  describe('getAllScenarios', () => {
    it('returns all registered scenarios', () => {
      registry.registerScenario(makeScenarioPlugin({ id: 'a' }))
      registry.registerScenario(makeScenarioPlugin({ id: 'b' }))
      registry.registerScenario(makeScenarioPlugin({ id: 'c' }))

      const all = registry.getAllScenarios()
      expect(all).toHaveLength(3)
      expect(all.map(s => s.id).sort()).toEqual(['a', 'b', 'c'])
    })
  })

  describe('registerMechanics / getMechanicsForScenario', () => {
    it('stores mechanics and returns those matching a scenario requiredMechanics', () => {
      const mech1 = makeMechanicsPlugin('mech-1')
      const mech2 = makeMechanicsPlugin('mech-2')
      registry.registerMechanics(mech1)
      registry.registerMechanics(mech2)

      const scenario = makeScenarioPlugin({
        id: 'sc',
        requiredMechanics: ['mech-1', 'mech-2'],
      })
      registry.registerScenario(scenario)

      const result = registry.getMechanicsForScenario('sc')
      expect(result).toHaveLength(2)
      expect(result.map(m => m.id)).toEqual(['mech-1', 'mech-2'])
    })

    it('returns empty array when scenario has no requiredMechanics', () => {
      const scenario = makeScenarioPlugin({ id: 'no-mech' })
      registry.registerScenario(scenario)

      const result = registry.getMechanicsForScenario('no-mech')
      expect(result).toEqual([])
    })
  })

  describe('validate', () => {
    it('returns errors for missing mechanics references', () => {
      const scenario = makeScenarioPlugin({
        id: 'needs-mech',
        requiredMechanics: ['missing-mech'],
      })
      registry.registerScenario(scenario)

      const errors = registry.validate()
      expect(errors).toHaveLength(1)
      expect(errors[0]).toContain('needs-mech')
      expect(errors[0]).toContain('missing-mech')
    })

    it('returns empty array when all references are satisfied', () => {
      registry.registerMechanics(makeMechanicsPlugin('present-mech'))
      const scenario = makeScenarioPlugin({
        id: 'ok',
        requiredMechanics: ['present-mech'],
      })
      registry.registerScenario(scenario)

      expect(registry.validate()).toEqual([])
    })
  })

  describe('resetRegistry', () => {
    it('clears all maps', () => {
      registry.registerScenario(makeScenarioPlugin({ id: 'x' }))
      registry.registerMechanics(makeMechanicsPlugin('y'))

      resetRegistry()

      expect(registry.getAllScenarios()).toEqual([])
      expect(registry.getScenario('x')).toBeUndefined()
      expect(registry.getMechanicsForScenario('x')).toEqual([])
    })
  })
})
