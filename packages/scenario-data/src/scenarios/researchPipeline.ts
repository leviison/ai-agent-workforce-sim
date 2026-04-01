import type { Scenario, ScenarioPlugin } from '@sim/shared-types'
import { researchPipelineRules } from '../coaching-rules-research'

export const researchPipeline: Scenario = {
  id: 'research-pipeline',
  name: 'Research Pipeline',
  description: 'Diamond DAG scenario: literature review fans out to hypothesis formulation and experiment design, which converge at data analysis before paper drafting.',
  tasks: [
    {
      id: 'task-lit-review',
      type: 'research',
      complexity: 0.65,
      required_skills: ['accuracy', 'reasoning'],
      dependencies: [],
    },
    {
      id: 'task-hypothesis',
      type: 'analysis',
      complexity: 0.7,
      required_skills: ['reasoning', 'creativity'],
      dependencies: ['task-lit-review'],
    },
    {
      id: 'task-experiment',
      type: 'design',
      complexity: 0.75,
      required_skills: ['accuracy', 'speed'],
      dependencies: ['task-lit-review'],
    },
    {
      id: 'task-data-analysis',
      type: 'analysis',
      complexity: 0.85,
      required_skills: ['accuracy', 'reasoning'],
      dependencies: ['task-hypothesis', 'task-experiment'],
    },
    {
      id: 'task-paper',
      type: 'creative',
      complexity: 0.8,
      required_skills: ['creativity', 'reasoning'],
      dependencies: ['task-data-analysis'],
    },
  ],
  agents: [
    {
      id: 'agent-researcher',
      role: 'Researcher',
      skill_vector: { accuracy: 0.92, speed: 0.65, creativity: 0.6, reasoning: 0.88 },
      cost: 1.4,
      reliability: 0.85,
      failure_modes: [{ type: 'incomplete_review', probability: 0.12 }],
    },
    {
      id: 'agent-experimentalist',
      role: 'Experimentalist',
      skill_vector: { accuracy: 0.8, speed: 0.85, creativity: 0.5, reasoning: 0.75 },
      cost: 1.1,
      reliability: 0.82,
      failure_modes: [{ type: 'flawed_protocol', probability: 0.15 }],
    },
    {
      id: 'agent-writer',
      role: 'Writer',
      skill_vector: { accuracy: 0.7, speed: 0.75, creativity: 0.9, reasoning: 0.7 },
      cost: 0.9,
      reliability: 0.8,
      failure_modes: [{ type: 'unclear_prose', probability: 0.18 }],
    },
  ],
}

export const researchPipelinePlugin: ScenarioPlugin = {
  id: researchPipeline.id,
  name: researchPipeline.name,
  description: researchPipeline.description,
  scenario: researchPipeline,
  coachingRules: researchPipelineRules,
  requiredMechanics: ['time-limit'],
}
