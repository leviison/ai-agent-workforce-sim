import type { CoachingRule, SimulationOutput } from '@sim/shared-types'

/**
 * Evaluates each CoachingRule's TriggerCondition against the SimulationOutput
 * and returns a deduplicated list of insightText strings, preserving rule order.
 *
 * Supported condition types:
 *   - score_below
 *   - failure_reason_present
 *   - bottleneck_penalty_above
 *   - agent_utilization_above
 */
export function generateInsights(
  output: SimulationOutput,
  rules: CoachingRule[]
): string[] {
  const seen = new Set<string>()
  const results: string[] = []

  for (const rule of rules) {
    const { trigger, insightText } = rule

    let fired = false

    if (trigger.type === 'score_below') {
      const value = output.metrics[trigger.dimension]
      fired = value < trigger.threshold

    } else if (trigger.type === 'failure_reason_present') {
      fired = output.trace.some(
        (t) => t.failureReason === trigger.reason
      )

    } else if (trigger.type === 'bottleneck_penalty_above') {
      const total = output.trace.length
      if (total > 0) {
        const failed = output.trace.filter((t) => !t.success).length
        fired = failed / total > trigger.threshold
      }

    } else if (trigger.type === 'agent_utilization_above') {
      const total = output.trace.length
      if (total > 0) {
        const forAgent = output.trace.filter(
          (t) => t.agentId === trigger.agentId
        ).length
        fired = forAgent / total > trigger.threshold
      }

    }
    // Unknown condition types fall through with fired === false — no throw

    if (fired && !seen.has(insightText)) {
      seen.add(insightText)
      results.push(insightText)
    }
  }

  return results
}
