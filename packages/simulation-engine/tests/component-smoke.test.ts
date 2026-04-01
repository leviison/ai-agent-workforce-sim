/**
 * component-smoke.test.ts
 *
 * Smoke tests verifying that the simulation pipeline produces output matching
 * the ViewModel contracts defined in ui-contracts. Uses a live simulation run
 * against the businessLaunch scenario instead of static fixtures.
 */

import { describe, it, expect } from 'vitest'
import type {
  SimulationResultViewModel,
  ScoreSummaryViewModel,
  TraceRowViewModel,
} from '@sim/ui-contracts'
import { runSimulationFromInput, buildWorkflowFromAssignments } from '@sim/simulation-facade'
import { businessLaunch } from '@sim/scenario-data'

// ---------------------------------------------------------------------------
// Build a live result from the engine
// ---------------------------------------------------------------------------
const assignments: Record<string, string> = {
  'task-research': 'agent-analyst',
  'task-problem-mapping': 'agent-strategist',
  'task-idea-generation': 'agent-creative',
  'task-offer-design': 'agent-creative',
  'task-launch-plan': 'agent-strategist',
  'task-validation': 'agent-analyst',
}

const workflow = buildWorkflowFromAssignments(assignments, businessLaunch)
const result: SimulationResultViewModel = runSimulationFromInput({
  workflow,
  agents: businessLaunch.agents,
  scenario: businessLaunch,
  seed: 42,
})

const score: ScoreSummaryViewModel = result.score

// Type assertions — verified at compile time
const _resultTypeCheck: SimulationResultViewModel = result
const _scoreTypeCheck: ScoreSummaryViewModel = score
const _tracesTypeCheck: TraceRowViewModel[] = result.traces
void _resultTypeCheck
void _scoreTypeCheck
void _tracesTypeCheck

// ---------------------------------------------------------------------------
// Data-integrity assertions
// ---------------------------------------------------------------------------

describe('component smoke — ScoreSummaryViewModel', () => {
  it('overallScore is between 0 and 1 (inclusive)', () => {
    expect(score.overallScore).toBeGreaterThanOrEqual(0)
    expect(score.overallScore).toBeLessThanOrEqual(1)
  })

  it('all individual score dimensions are between 0 and 1', () => {
    const { quality, costEfficiency, timeEfficiency, robustness } = score
    for (const value of [quality, costEfficiency, timeEfficiency, robustness]) {
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThanOrEqual(1)
    }
  })

  it('agentCount and taskCount are positive integers', () => {
    expect(score.agentCount).toBeGreaterThan(0)
    expect(score.taskCount).toBeGreaterThan(0)
    expect(Number.isInteger(score.agentCount)).toBe(true)
    expect(Number.isInteger(score.taskCount)).toBe(true)
  })

  it('durationTicks is a positive integer', () => {
    expect(score.durationTicks).toBeGreaterThan(0)
    expect(Number.isInteger(score.durationTicks)).toBe(true)
  })
})

describe('component smoke — SimulationResultViewModel', () => {
  it('traces array has at least 6 entries (one per task, plus retries)', () => {
    expect(result.traces.length).toBeGreaterThanOrEqual(6)
  })

  it('each trace entry has required fields with valid types', () => {
    for (const trace of result.traces) {
      expect(typeof trace.nodeId).toBe('string')
      expect(typeof trace.agentId).toBe('string')
      expect(typeof trace.taskId).toBe('string')
      expect(typeof trace.success).toBe('boolean')
      expect(typeof trace.startTick).toBe('number')
      expect(typeof trace.endTick).toBe('number')
      expect(typeof trace.cost).toBe('number')
      expect(typeof trace.quality).toBe('number')
      expect(typeof trace.retryCount).toBe('number')
      expect(trace.endTick).toBeGreaterThanOrEqual(trace.startTick)
      expect(trace.quality).toBeGreaterThanOrEqual(0)
      expect(trace.quality).toBeLessThanOrEqual(1)
    }
  })

  it('failed traces carry a non-empty failureReason string', () => {
    const failed = result.traces.filter(t => !t.success)
    for (const trace of failed) {
      expect(trace.failureReason).toBeDefined()
      expect(typeof trace.failureReason).toBe('string')
      expect((trace.failureReason as string).length).toBeGreaterThan(0)
    }
  })

  it('scenarioId and scenarioName are non-empty strings', () => {
    expect(result.scenarioId.length).toBeGreaterThan(0)
    expect(result.scenarioName.length).toBeGreaterThan(0)
  })

  it('insights array is present', () => {
    expect(Array.isArray(result.insights)).toBe(true)
  })

  it('score field is present and valid', () => {
    expect(result.score).toBeDefined()
    expect(typeof result.score.overallScore).toBe('number')
  })
})
