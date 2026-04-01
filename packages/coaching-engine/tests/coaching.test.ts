import { describe, it, expect } from 'vitest'
import { generateInsights } from '../src/index'
import { businessLaunchRules } from '../../scenario-data/src/index'
import type {
  SimulationOutput,
  CoachingRule,
  Trace,
  Score,
} from '../../shared-types/src/index'
import { FailureReason } from '../../shared-types/src/index'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal SimulationOutput for testing. */
function makeOutput(
  metrics: Partial<Score> = {},
  traces: Partial<Trace>[] = []
): SimulationOutput {
  const defaultMetrics: Score = {
    quality: 0.8,
    cost_efficiency: 0.8,
    time_efficiency: 0.8,
    robustness: 0.8,
    ...metrics,
  }

  const defaultTrace = (t: Partial<Trace>): Trace => ({
    node_id: 'n1',
    success: true,
    time: 1,
    cost: 1,
    quality: 0.8,
    agentId: 'agent-analyst',
    taskId: 'task-research',
    startTick: 0,
    endTick: 1,
    retryCount: 0,
    ...t,
  })

  return {
    outputs: {},
    metrics: defaultMetrics,
    trace: traces.map(defaultTrace),
    insights: [],
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('generateInsights', () => {
  // 1. Empty rules array returns []
  it('returns [] when no rules are provided', () => {
    const output = makeOutput()
    expect(generateInsights(output, [])).toEqual([])
  })

  // 2. score_below fires on a low quality score (empty trace is fine)
  it('fires score_below rule when quality metric is below threshold', () => {
    const output = makeOutput({ quality: 0.4 }) // below 0.6 threshold in bl-rule-001
    const rule: CoachingRule = {
      id: 'test-score-below',
      trigger: { type: 'score_below', dimension: 'quality', threshold: 0.6 },
      insightText: 'Quality is low.',
      severity: 'critical',
    }
    const insights = generateInsights(output, [rule])
    expect(insights).toContain('Quality is low.')
  })

  // 3. failure_reason_present fires on AGENT_UNAVAILABLE
  it('fires failure_reason_present rule when AGENT_UNAVAILABLE appears in traces', () => {
    const output = makeOutput({}, [
      { success: false, failureReason: FailureReason.AGENT_UNAVAILABLE },
    ])
    const rule: CoachingRule = {
      id: 'test-agent-unavail',
      trigger: { type: 'failure_reason_present', reason: FailureReason.AGENT_UNAVAILABLE },
      insightText: 'Agent unavailable detected.',
      severity: 'warning',
    }
    const insights = generateInsights(output, [rule])
    expect(insights).toContain('Agent unavailable detected.')
  })

  // 4. failure_reason_present fires on TIMEOUT (distinct FailureReason value)
  it('fires failure_reason_present rule when TIMEOUT appears in traces', () => {
    const output = makeOutput({}, [
      { success: false, failureReason: FailureReason.TIMEOUT },
    ])
    const rule: CoachingRule = {
      id: 'test-timeout',
      trigger: { type: 'failure_reason_present', reason: FailureReason.TIMEOUT },
      insightText: 'Timeout detected.',
      severity: 'warning',
    }
    const insights = generateInsights(output, [rule])
    expect(insights).toContain('Timeout detected.')
  })

  // 5. bottleneck_penalty_above fires when failure proportion exceeds threshold
  it('fires bottleneck_penalty_above rule when failure proportion is high', () => {
    // 3 failures out of 4 traces = 0.75 proportion, threshold 0.5
    const output = makeOutput({}, [
      { success: false },
      { success: false },
      { success: false },
      { success: true },
    ])
    const rule: CoachingRule = {
      id: 'test-bottleneck',
      trigger: { type: 'bottleneck_penalty_above', threshold: 0.5 },
      insightText: 'Too many failures.',
      severity: 'critical',
    }
    const insights = generateInsights(output, [rule])
    expect(insights).toContain('Too many failures.')
  })

  // 6. agent_utilization_above fires when one agent dominates the trace list
  it('fires agent_utilization_above rule when single agent exceeds utilization threshold', () => {
    // agent-strategist appears 9 out of 10 traces = 0.9 utilization, threshold 0.85
    const traces: Partial<Trace>[] = [
      ...Array(9).fill({ agentId: 'agent-strategist' }),
      { agentId: 'agent-analyst' },
    ]
    const output = makeOutput({}, traces)
    const rule: CoachingRule = {
      id: 'test-utilization',
      trigger: {
        type: 'agent_utilization_above',
        agentId: 'agent-strategist',
        threshold: 0.85,
      },
      insightText: 'agent-strategist is overloaded.',
      severity: 'warning',
    }
    const insights = generateInsights(output, [rule])
    expect(insights).toContain('agent-strategist is overloaded.')
  })

  // 7. All businessLaunchRules — crafted output fires all rule types
  it('returns multiple insights from businessLaunchRules when all conditions are met', () => {
    // Fire:
    //   bl-rule-001: quality < 0.6
    //   bl-rule-002: cost_efficiency < 0.5
    //   bl-rule-003: DEPENDENCY_CYCLE present
    //   bl-rule-004: AGENT_UNAVAILABLE present
    //   bl-rule-005: agent-strategist utilization > 0.85 (9 out of 10 traces)
    // 18 strategist traces out of 20 total = 0.9 utilization (> 0.85 threshold)
    // The 2 analyst traces carry the two required failure reasons
    const traces: Partial<Trace>[] = [
      ...Array(18).fill({ agentId: 'agent-strategist', success: true }),
      {
        agentId: 'agent-analyst',
        success: false,
        failureReason: FailureReason.DEPENDENCY_CYCLE,
      },
      {
        agentId: 'agent-analyst',
        success: false,
        failureReason: FailureReason.AGENT_UNAVAILABLE,
      },
    ]

    const output = makeOutput(
      { quality: 0.4, cost_efficiency: 0.3 },
      traces
    )

    const insights = generateInsights(output, businessLaunchRules)

    // All 5 rules should have fired
    expect(insights.length).toBe(5)

    // Spot-check a couple of insight texts
    expect(insights[0]).toMatch(/Quality is critically low/)
    expect(insights[2]).toMatch(/dependency cycle/i)
    expect(insights[4]).toMatch(/agent-strategist utilization/)
  })

  // 8. Deduplication — two rules with identical insightText only emit it once
  it('deduplicates insight text even when multiple rules would fire the same string', () => {
    const sharedText = 'Shared insight text.'
    const rules: CoachingRule[] = [
      {
        id: 'dup-rule-a',
        trigger: { type: 'score_below', dimension: 'quality', threshold: 0.9 },
        insightText: sharedText,
        severity: 'info',
      },
      {
        id: 'dup-rule-b',
        trigger: { type: 'score_below', dimension: 'cost_efficiency', threshold: 0.9 },
        insightText: sharedText,
        severity: 'info',
      },
    ]
    // Both rules fire (both scores are 0.5, below 0.9)
    const output = makeOutput({ quality: 0.5, cost_efficiency: 0.5 })
    const insights = generateInsights(output, rules)

    expect(insights).toEqual([sharedText])
    expect(insights.length).toBe(1)
  })
})
