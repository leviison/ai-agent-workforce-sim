import { registry } from './index'
import { businessLaunchPlugin, researchPipelinePlugin, incidentResponsePlugin } from '@sim/scenario-data'
import { timeLimitMechanic } from './mechanics/timeLimitMechanic'
import { budgetConstraintMechanic } from './mechanics/budgetConstraintMechanic'

export function registerAllPlugins(): void {
  registry.registerScenario(businessLaunchPlugin)
  registry.registerScenario(researchPipelinePlugin)
  registry.registerScenario(incidentResponsePlugin)
  registry.registerMechanics(timeLimitMechanic)
  registry.registerMechanics(budgetConstraintMechanic)
}
