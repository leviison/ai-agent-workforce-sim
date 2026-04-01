// mappers.ts — engine output → ViewModel transformations
// Owen Mercer implements these bodies in Sprint 3.

import type { SimulationOutput, Trace, Score, Scenario } from '@sim/shared-types'
import type {
  SimulationResultViewModel,
  TraceRowViewModel,
  ScoreSummaryViewModel,
} from '@sim/ui-contracts'

/**
 * Map a single engine Trace to a TraceRowViewModel for the trace table.
 */
export function mapTraceToRow(trace: Trace): TraceRowViewModel {
  return {
    nodeId: trace.node_id,
    agentId: trace.agentId,
    taskId: trace.taskId,
    success: trace.success,
    startTick: trace.startTick,
    endTick: trace.endTick,
    cost: trace.cost,
    quality: trace.quality,
    retryCount: trace.retryCount,
    ...(trace.failureReason !== undefined && { failureReason: String(trace.failureReason) }),
  }
}

/**
 * Map engine Score + Trace[] to a ScoreSummaryViewModel for the score-card panel.
 */
export function mapScoreToSummary(
  score: Score,
  traces: Trace[],
  durationTicks: number,
): ScoreSummaryViewModel {
  const overallScore = (score.quality + score.cost_efficiency + score.time_efficiency + score.robustness) / 4

  const agentCount = new Set(traces.map(t => t.agentId)).size
  const taskCount = new Set(traces.map(t => t.taskId)).size

  return {
    overallScore: parseFloat(overallScore.toFixed(4)),
    quality: score.quality,
    costEfficiency: score.cost_efficiency,
    timeEfficiency: score.time_efficiency,
    robustness: score.robustness,
    hasBottleneck: overallScore < 0.65,
    agentCount,
    taskCount,
    durationTicks,
  }
}

/**
 * Map a full SimulationOutput + Scenario metadata to a SimulationResultViewModel.
 */
export function mapOutputToViewModel(
  output: SimulationOutput,
  scenario: Scenario,
  seed: number,
): SimulationResultViewModel {
  const maxEndTick = Math.max(...output.trace.map(t => t.endTick), 0)
  return {
    scenarioId: scenario.id,
    scenarioName: scenario.name,
    seed,
    traces: output.trace.map(mapTraceToRow),
    insights: output.insights,
    score: mapScoreToSummary(output.metrics, output.trace, maxEndTick),
  }
}
