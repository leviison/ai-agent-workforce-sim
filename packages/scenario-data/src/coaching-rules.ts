import type { CoachingRule } from '@sim/shared-types'
import { FailureReason } from '@sim/shared-types'

export const businessLaunchRules: CoachingRule[] = [
  // --- score_below rules ---
  {
    id: 'bl-rule-001',
    trigger: {
      type: 'score_below',
      dimension: 'quality',
      threshold: 0.6,
    },
    insightText:
      'Quality is critically low. The research and problem-mapping tasks are the foundation of the entire launch — consider assigning agent-analyst (accuracy 0.9) to both before allowing downstream tasks to proceed.',
    severity: 'critical',
  },
  {
    id: 'bl-rule-002',
    trigger: {
      type: 'score_below',
      dimension: 'cost_efficiency',
      threshold: 0.5,
    },
    insightText:
      'Cost efficiency has dropped below 50%. agent-strategist carries the highest per-unit cost (1.5). Reserve them for high-reasoning tasks such as task-launch-plan and task-problem-mapping, and route creative tasks to agent-creative (cost 1.0) instead.',
    severity: 'warning',
  },

  // --- failure_reason_present rules ---
  {
    id: 'bl-rule-003',
    trigger: {
      type: 'failure_reason_present',
      reason: FailureReason.DEPENDENCY_CYCLE,
    },
    insightText:
      'A dependency cycle was detected in the workflow. The businessLaunch task chain is strictly linear: research → problem-mapping → idea-generation → offer-design → launch-plan → validation. Check that no task has been wired to depend on a downstream node.',
    severity: 'critical',
  },
  {
    id: 'bl-rule-004',
    trigger: {
      type: 'failure_reason_present',
      reason: FailureReason.AGENT_UNAVAILABLE,
    },
    insightText:
      'An agent became unavailable mid-workflow. With only three agents in the roster, a single unavailability can stall the entire pipeline. Ensure task-validation always has a fallback agent with sufficient accuracy and reasoning scores.',
    severity: 'warning',
  },

  // --- agent_utilization_above rule ---
  {
    id: 'bl-rule-005',
    trigger: {
      type: 'agent_utilization_above',
      agentId: 'agent-strategist',
      threshold: 0.85,
    },
    insightText:
      'agent-strategist utilization is above 85%. This agent has a 15% over-scope failure probability; sustained overload amplifies that risk across the launch-plan and idea-generation tasks. Redistribute lower-complexity reasoning work to agent-analyst.',
    severity: 'warning',
  },
]
