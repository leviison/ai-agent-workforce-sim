import type { CoachingRule } from '@sim/shared-types'
import { FailureReason } from '@sim/shared-types'

export const researchPipelineRules: CoachingRule[] = [
  // --- score_below rule (quality gate on literature-review) ---
  {
    id: 'rp-rule-001',
    trigger: {
      type: 'score_below',
      dimension: 'quality',
      threshold: 0.6,
    },
    insightText:
      'Quality has dropped below 60%. The literature-review is the foundation of the entire research pipeline — consider assigning agent-researcher (accuracy 0.92) to task-lit-review to ensure downstream hypothesis-formulation and experiment-design receive high-quality inputs.',
    severity: 'critical',
  },

  // --- agent_utilization_above rule (researcher overload) ---
  {
    id: 'rp-rule-002',
    trigger: {
      type: 'agent_utilization_above',
      agentId: 'agent-researcher',
      threshold: 0.8,
    },
    insightText:
      'agent-researcher utilization is above 80%. This agent anchors both the literature-review and data-analysis paths; sustained overload risks cascading delays through the diamond DAG. Redistribute experiment-design or hypothesis-formulation work to agent-experimentalist.',
    severity: 'warning',
  },

  // --- failure_reason_present rule (timeout risk) ---
  {
    id: 'rp-rule-003',
    trigger: {
      type: 'failure_reason_present',
      reason: FailureReason.TIMEOUT,
    },
    insightText:
      'A task timed out during the research pipeline. The diamond dependency structure means both hypothesis-formulation and experiment-design must complete before data-analysis can begin. Assign faster agents (agent-experimentalist, speed 0.85) to the critical path to avoid further timeouts.',
    severity: 'critical',
  },

  // --- failure_reason_present rule (dependency failure) ---
  {
    id: 'rp-rule-004',
    trigger: {
      type: 'failure_reason_present',
      reason: FailureReason.DEPENDENCY_CYCLE,
    },
    insightText:
      'A dependency cycle was detected in the workflow. The research pipeline follows a diamond DAG: literature-review fans out to hypothesis-formulation and experiment-design, which converge at data-analysis before paper-drafting. Check that no task depends on a downstream node.',
    severity: 'critical',
  },

  // --- score_below rule (cost warning) ---
  {
    id: 'rp-rule-005',
    trigger: {
      type: 'score_below',
      dimension: 'cost_efficiency',
      threshold: 0.45,
    },
    insightText:
      'Cost efficiency has fallen below 45%. agent-researcher carries the highest per-unit cost (1.4). Reserve them for accuracy-critical tasks like task-lit-review and task-data-analysis, and route task-hypothesis or task-paper to agent-writer (cost 0.9) instead.',
    severity: 'warning',
  },
]
