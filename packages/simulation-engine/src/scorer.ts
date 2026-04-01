// Derives aggregate Score from a completed trace

import type { Trace, Score, ScoringConfig, Task } from '@sim/shared-types'
import { defaultScoringConfig } from '@sim/shared-types'

export function computeScore(
  trace: Trace[],
  config: ScoringConfig = defaultScoringConfig,
  tasks: Task[] = [],
): Score {
  if (trace.length === 0) {
    return { quality: 0, cost_efficiency: 0, time_efficiency: 0, robustness: 0 }
  }

  const { weights, bottleneckPenaltyThreshold } = config

  const successCount = trace.filter(t => t.success).length
  const robustness = successCount / trace.length

  const avgQuality = trace.reduce((sum, t) => sum + t.quality, 0) / trace.length

  const totalCost = trace.reduce((sum, t) => sum + t.cost, 0)
  // cost_efficiency: lower cost relative to quality is better; normalised 0-1
  const cost_efficiency = totalCost > 0 ? Math.min(1, avgQuality / totalCost) : 1

  const totalTime = trace.reduce((sum, t) => sum + t.time, 0)
  // time_efficiency: fewer steps × lower time = better; normalised 0-1
  const time_efficiency = totalTime > 0 ? Math.min(1, trace.length / totalTime) : 1

  // Bottleneck penalty: if any trace's time exceeds bottleneckPenaltyThreshold × task.complexity × 10,
  // reduce the final quality score by 0.1. This penalises workflows where individual task executions
  // take significantly longer than expected relative to their complexity.
  const taskMap = new Map<string, Task>(tasks.map(t => [t.id, t]))
  const hasBottleneck = trace.some(t => {
    const task = taskMap.get(t.taskId)
    if (!task) return false
    return t.time > bottleneckPenaltyThreshold * task.complexity * 10
  })

  // Apply configurable weights to the four score dimensions
  const totalWeight = weights.quality + weights.cost_efficiency + weights.time_efficiency + weights.robustness

  const rawQuality = totalWeight > 0
    ? (avgQuality * weights.quality
      + cost_efficiency * weights.cost_efficiency
      + time_efficiency * weights.time_efficiency
      + robustness * weights.robustness)
      / totalWeight
    : avgQuality

  // Apply bottleneck penalty to the final quality score (-0.1)
  const penalisedQuality = hasBottleneck ? Math.max(0, rawQuality - 0.1) : rawQuality

  return {
    quality: parseFloat(penalisedQuality.toFixed(4)),
    cost_efficiency: parseFloat(cost_efficiency.toFixed(4)),
    time_efficiency: parseFloat(time_efficiency.toFixed(4)),
    robustness: parseFloat(robustness.toFixed(4)),
  }
}
