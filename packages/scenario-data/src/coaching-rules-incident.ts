import type { CoachingRule } from '@sim/shared-types'
import { FailureReason } from '@sim/shared-types'

export const incidentResponseRules: CoachingRule[] = [
  // --- score_below rules ---
  {
    id: 'ir-rule-001',
    trigger: {
      type: 'score_below',
      dimension: 'time_efficiency',
      threshold: 0.5,
    },
    insightText:
      'Triage is taking too long. Time efficiency has dropped below 50%. Assign agent-oncall (speed 0.9) to task-triage to accelerate initial incident classification and unblock root-cause-analysis.',
    severity: 'warning',
  },
  {
    id: 'ir-rule-002',
    trigger: {
      type: 'score_below',
      dimension: 'cost_efficiency',
      threshold: 0.4,
    },
    insightText:
      'Budget overrun detected — cost efficiency is below 40%. agent-sre carries the highest per-unit cost (1.5). Reserve them for task-root-cause where their reasoning score (0.9) is essential, and route lower-complexity work to agent-oncall (cost 0.8) or agent-tech-writer (cost 0.9).',
    severity: 'critical',
  },

  // --- failure_reason_present rule ---
  {
    id: 'ir-rule-003',
    trigger: {
      type: 'failure_reason_present',
      reason: FailureReason.AGENT_UNAVAILABLE,
    },
    insightText:
      'An agent became unavailable during the incident response. With only four agents and a time-sensitive pipeline, a single unavailability can delay the hotfix. Ensure task-hotfix and task-verification each have a fallback agent with adequate speed and accuracy.',
    severity: 'critical',
  },

  // --- agent_utilization_above rule ---
  {
    id: 'ir-rule-004',
    trigger: {
      type: 'agent_utilization_above',
      agentId: 'agent-sre',
      threshold: 0.85,
    },
    insightText:
      'agent-sre utilization is above 85%. Overloading the SRE increases failure risk across root-cause-analysis and verification. Redistribute documentation and lower-complexity tasks to agent-tech-writer or agent-oncall.',
    severity: 'warning',
  },

  // --- score_below rule (quality gate) ---
  {
    id: 'ir-rule-005',
    trigger: {
      type: 'score_below',
      dimension: 'quality',
      threshold: 0.55,
    },
    insightText:
      'Quality has fallen below the verification gate threshold (55%). The hotfix may not be production-ready. Assign agent-sre (accuracy 0.85) or agent-tech-writer (accuracy 0.88) to task-verification to ensure the fix meets quality standards before postmortem.',
    severity: 'critical',
  },
]
