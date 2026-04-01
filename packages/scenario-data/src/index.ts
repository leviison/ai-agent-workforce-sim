export { businessLaunch, businessLaunchPlugin } from './scenarios/businessLaunch'
export { businessLaunchRules } from './coaching-rules'
export { incidentResponse, incidentResponsePlugin } from './scenarios/incidentResponse'
export { incidentResponseRules } from './coaching-rules-incident'
export { researchPipeline, researchPipelinePlugin } from './scenarios/researchPipeline'
export { researchPipelineRules } from './coaching-rules-research'

import type { Scenario } from '@sim/shared-types'
import { businessLaunch } from './scenarios/businessLaunch'
import { incidentResponse } from './scenarios/incidentResponse'
import { researchPipeline } from './scenarios/researchPipeline'

export const scenarios: Scenario[] = [businessLaunch, incidentResponse, researchPipeline]
