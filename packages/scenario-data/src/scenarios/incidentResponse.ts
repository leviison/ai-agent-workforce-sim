import type { Scenario, ScenarioPlugin } from '@sim/shared-types'
import { incidentResponseRules } from '../coaching-rules-incident'

export const incidentResponse: Scenario = {
  id: 'incident-response',
  name: 'Incident Response Pipeline',
  description: 'Triage a production incident, develop a hotfix, verify the fix, and produce a postmortem — all under budget constraints.',
  tasks: [
    {
      id: 'task-triage',
      type: 'analysis',
      complexity: 0.5,
      required_skills: ['speed', 'reasoning'],
      dependencies: [],
    },
    {
      id: 'task-root-cause',
      type: 'analysis',
      complexity: 0.8,
      required_skills: ['accuracy', 'reasoning'],
      dependencies: ['task-triage'],
    },
    {
      id: 'task-hotfix',
      type: 'development',
      complexity: 0.85,
      required_skills: ['speed', 'creativity'],
      dependencies: ['task-root-cause'],
    },
    {
      id: 'task-verification',
      type: 'validation',
      complexity: 0.6,
      required_skills: ['accuracy'],
      dependencies: ['task-hotfix'],
    },
    {
      id: 'task-postmortem',
      type: 'documentation',
      complexity: 0.55,
      required_skills: ['accuracy', 'creativity'],
      dependencies: ['task-verification', 'task-triage'],
    },
  ],
  agents: [
    {
      id: 'agent-oncall',
      role: 'On-Call Engineer',
      skill_vector: { accuracy: 0.65, speed: 0.9, creativity: 0.5, reasoning: 0.7 },
      cost: 0.8,
      reliability: 0.85,
      failure_modes: [{ type: 'misclassification', probability: 0.12 }],
    },
    {
      id: 'agent-sre',
      role: 'Site Reliability Engineer',
      skill_vector: { accuracy: 0.85, speed: 0.7, creativity: 0.55, reasoning: 0.9 },
      cost: 1.5,
      reliability: 0.88,
      failure_modes: [{ type: 'over_investigation', probability: 0.1 }],
    },
    {
      id: 'agent-developer',
      role: 'Developer',
      skill_vector: { accuracy: 0.75, speed: 0.7, creativity: 0.8, reasoning: 0.75 },
      cost: 1.2,
      reliability: 0.8,
      failure_modes: [{ type: 'regression', probability: 0.15 }],
    },
    {
      id: 'agent-tech-writer',
      role: 'Technical Writer',
      skill_vector: { accuracy: 0.88, speed: 0.65, creativity: 0.75, reasoning: 0.65 },
      cost: 0.9,
      reliability: 0.83,
      failure_modes: [{ type: 'incomplete_doc', probability: 0.1 }],
    },
  ],
}

export const incidentResponsePlugin: ScenarioPlugin = {
  id: incidentResponse.id,
  name: incidentResponse.name,
  description: incidentResponse.description,
  scenario: incidentResponse,
  coachingRules: incidentResponseRules,
  requiredMechanics: ['budget-constraint'],
  outputPluginId: 'default-json-output',
}
