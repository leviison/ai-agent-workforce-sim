import type { Scenario, ScenarioPlugin } from '@sim/shared-types'
import { businessLaunchRules } from '../coaching-rules'

export const businessLaunch: Scenario = {
  id: 'business-launch',
  name: 'Launch a $1M Business',
  description: 'Create a viable business concept and launch plan under budget and time constraints.',
  tasks: [
    {
      id: 'task-research',
      type: 'research',
      complexity: 0.6,
      required_skills: ['accuracy', 'reasoning'],
      dependencies: [],
    },
    {
      id: 'task-problem-mapping',
      type: 'analysis',
      complexity: 0.7,
      required_skills: ['reasoning', 'creativity'],
      dependencies: ['task-research'],
    },
    {
      id: 'task-idea-generation',
      type: 'creative',
      complexity: 0.8,
      required_skills: ['creativity', 'reasoning'],
      dependencies: ['task-problem-mapping'],
    },
    {
      id: 'task-offer-design',
      type: 'design',
      complexity: 0.75,
      required_skills: ['creativity', 'accuracy'],
      dependencies: ['task-idea-generation'],
    },
    {
      id: 'task-launch-plan',
      type: 'planning',
      complexity: 0.85,
      required_skills: ['reasoning', 'accuracy'],
      dependencies: ['task-offer-design'],
    },
    {
      id: 'task-validation',
      type: 'validation',
      complexity: 0.5,
      required_skills: ['accuracy', 'reasoning'],
      dependencies: ['task-launch-plan'],
    },
  ],
  agents: [
    {
      id: 'agent-analyst',
      role: 'Analyst',
      skill_vector: { accuracy: 0.9, speed: 0.7, creativity: 0.5, reasoning: 0.85 },
      cost: 1.2,
      reliability: 0.88,
      failure_modes: [{ type: 'missed_insight', probability: 0.1 }],
    },
    {
      id: 'agent-strategist',
      role: 'Strategist',
      skill_vector: { accuracy: 0.75, speed: 0.65, creativity: 0.85, reasoning: 0.9 },
      cost: 1.5,
      reliability: 0.82,
      failure_modes: [{ type: 'over_scope', probability: 0.15 }],
    },
    {
      id: 'agent-creative',
      role: 'Creative',
      skill_vector: { accuracy: 0.6, speed: 0.8, creativity: 0.95, reasoning: 0.7 },
      cost: 1.0,
      reliability: 0.78,
      failure_modes: [{ type: 'off_brand', probability: 0.2 }],
    },
  ],
}

export const businessLaunchPlugin: ScenarioPlugin = {
  id: businessLaunch.id,
  name: businessLaunch.name,
  description: businessLaunch.description,
  scenario: businessLaunch,
  coachingRules: businessLaunchRules,
}

export const scenarios: Scenario[] = [businessLaunch]
