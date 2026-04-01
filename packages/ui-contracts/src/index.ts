// ui-contracts — view model types for the AI Agent Workforce Simulator UI
// No imports from simulation-engine or shared-types.
// This file is the sole data boundary between the simulation engine and the UI.

/**
 * One row in the trace table — represents a single agent task execution.
 */
export type TraceRowViewModel = {
  nodeId: string
  agentId: string
  taskId: string
  success: boolean
  startTick: number
  endTick: number
  cost: number
  quality: number
  retryCount: number
  failureReason?: string
}

/**
 * Full result of a completed simulation run, ready for the UI to render.
 */
export type SimulationResultViewModel = {
  scenarioId: string
  scenarioName: string
  seed: number
  traces: TraceRowViewModel[]
  insights: string[]
  score: ScoreSummaryViewModel
}

/**
 * Aggregated score dimensions for the score-card panel.
 * All numeric fields are in the range 0–1 unless otherwise noted.
 */
export type ScoreSummaryViewModel = {
  /** Arithmetic mean of quality, costEfficiency, timeEfficiency, and robustness. */
  overallScore: number
  quality: number
  costEfficiency: number
  timeEfficiency: number
  robustness: number
  hasBottleneck: boolean
  agentCount: number
  taskCount: number
  durationTicks: number
}
